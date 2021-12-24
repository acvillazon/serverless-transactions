"use-strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({});
const { response } = require("../libs/utils");
const { getUserById } = require("../auth/user");
const { validateFields } = require("./utils");

const registerPayment = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  let total = 0;
  const body = JSON.parse(event.body);
  if (!id) {
    return response(callback, 400, { message: "Id is required" });
  }

  let user = await getUserById(id);
  if (!user) {
    return response(callback, 400, { message: "Invalid user" });
  }

  let amounts = await getPrismaBalance(user.profile.id);
  if (amounts == null) {
    return response(callback, 400, { message: "It was not possible to get your current balance" });
  }

  if (Array.isArray(body)) {
    let transactions = body;
    let errors = "";
    let transactionDB = [];
    transactions.forEach((value, i) => {
      errors += validateFields(value);
      transactionDB.push({
        userOriginId: user.profile.id,
        amount: Number(value.amount) * Number(value.quantity),
        name: value.name,
        description: value.description || "",
      });
      total += Number(value.amount) * Number(value.quantity);
    });

    if (errors.trim().length) {
      return response(callback, 400, { message: errors });
    }

    const inc = amounts[0]._sum.amount;
    const outc = amounts[1]._sum.amount;

    if (total > inc - outc) {
      return response(callback, 400, { message: "You don't have enough money to process your transactions" });
    }

    try {
      let manyTransactions = await prisma.transaction.createMany({
        data: transactionDB,
        skipDuplicates: true,
      });
      return response(callback, 200, { manyTransactions, transactions });
    } catch (error) {
      console.error(error);
      return response(callback, 500, error);
    }
  } else {
    const { amount, description, name, quantity } = JSON.parse(event.body);
    total = amount;
    const errors = validateFields(JSON.parse(event.body));
    if (errors.trim().length) {
      return response(callback, 400, { message: errors });
    }

    const inc = amounts[0]._sum.amount;
    const outc = amounts[1]._sum.amount;

    if (total > inc - outc) {
      return response(callback, 400, { message: "You don't have enough money to process your transactions" });
    }

    try {
      let cart = await prisma.transaction.create({
        data: {
          userOriginId: user.profile.id,
          amount: Number(amount) * Number(quantity),
          name,
          description: description || "",
        },
      });
      return response(callback, 200, cart);
    } catch (error) {
      console.log(error);
      return response(callback, 500, error);
    }
  }
};

const getMyPayments = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  if (!id) {
    return response(callback, 400, { message: "Id is required" });
  }

  let user = await getUserById(id);

  if (!user) {
    return response(callback, 400, { message: "Inavlid user" });
  }

  let transactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      OR: [
        {
          userTargetId: {
            equals: user.profile.id,
          },
        },
        {
          userOriginId: {
            equals: user.profile.id,
          },
        },
      ],
    },
  });

  return response(callback, 200, transactions);
};

const getMyPaymentsProducts = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  if (!id) {
    return response(callback, 400, { message: "Id is required" });
  }

  let user = await getUserById(id);

  if (!user) {
    return response(callback, 400, { message: "Inavlid user" });
  }

  let transactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      userTargetId: {
        equals: null,
      },
    },
  });

  return response(callback, 200, transactions);
};

const getMyBalance = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  if (!id) {
    return response(callback, 400, { message: "Id is required" });
  }

  // By unique identifier
  let user = await prisma.user.findUnique({
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    where: {
      id,
    },
  });

  if (!user) {
    return response(callback, 400, { message: "Inavlid user" });
  }

  let transactionsIn = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      userTargetId: {
        equals: user.profile.id,
      },
    },
  });

  let transactionsOut = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      userOriginId: {
        equals: user.profile.id,
      },
    },
  });
  user.balance = transactionsIn._sum.amount - transactionsOut._sum.amount;
  return response(callback, 200, user);
};

const getPrismaBalance = async (id) => {
  let transactionsIn = prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      userTargetId: {
        equals: id,
      },
    },
  });

  let transactionsOut = prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      userOriginId: {
        equals: id,
      },
    },
  });

  try {
    let response = await Promise.all([transactionsIn, transactionsOut]);
    return response;
  } catch (error) {
    return false;
  }
};

module.exports = {
  registerPayment,
  getMyPayments,
  getMyBalance,
  getMyPaymentsProducts,
  getPrismaBalance,
};
