"use-strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({});
const { response } = require("../libs/utils");
const { getPrismaBalance } = require("./payment");
const { getUserById } = require("../auth/user");
const { validateFieldsTransfer } = require("./utils");

const registerTransfer = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  const body = JSON.parse(event.body);
  let total=0;
  if (!id) {
    return response(callback, 400, { message: "Id is required" });
  }

  let user = await getUserById(id);

  if (!user) {
    return response(callback, 400, { message: "Invalid user" });
  }

  let amounts = await getPrismaBalance(user.profile.id);
  if(amounts==null){
    return response(callback, 400, { message: "It was not possible to get your current balance" });
  }


  if (Array.isArray(body)) {
    let transactions = body;
    let errors = "";
    let transactionDB = [];
    transactions.forEach((value, i) => {
      errors += validateFieldsTransfer(value);

      if (user.profile.id == value.target) {
        errors = "You cannot transfer money to the same account";
        // return response(callback, 400, { message: "You cannot transfer money to the same account" });
      } else {
        transactionDB.push({
          userOriginId: user.profile.id,
          userTargetId: value.target,
          amount: Number(value.amount),
          description: value.description || "",
        });
        total+=(Number(value.amount) * Number(value.quantity));
      }
    });

    if (errors.trim().length) {
      return response(callback, 400, { message: errors });
    }

    const inc = amounts[0]._sum.amount;
    const outc = amounts[1]._sum.amount;

    if(total>(inc-outc)){
      return response(callback, 400, { message: "You don't have enough money to process your transactions" });
    }


    try {
      let manyTransactions = await prisma.transaction.createMany({
        data: transactionDB,
        skipDuplicates: true,
      });
      return response(callback, 200, { manyTransactions, transactions });
    } catch (error) {
      return response(callback, 500, error);
    }
  } else {
    const { amount, description, target } = JSON.parse(event.body);
    total= amount;
    const errors = validateFieldsTransfer(JSON.parse(event.body));
    if (errors.trim().length) {
      return response(callback, 400, { message: errors });
    }

    if (user.profile.id == target) {
      return response(callback, 400, { message: "You cannot transfer money to the same account" });
    }

    const inc = amounts[0]._sum.amount;
    const outc = amounts[1]._sum.amount;

    if(total>(inc-outc)){
      return response(callback, 400, { message: "You don't have enough money to process your transactions" });
    }

    try {
      let cart = await prisma.transaction.create({
        data: {
          userOriginId: user.profile.id,
          userTargetId: target,
          amount: Number(amount),
          description: description || "",
        },
      });
      return response(callback, 200, cart);
    } catch (error) {
      return response(callback, 500, error);
    }
  }
};

const getMyTransfer = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  if (!id) {
    return response(callback, 400, { message: "Id is required" });
  }

  let user = await getUserById(id);

  if (!user) {
    return response(callback, 400, { message: "Inavlid user" });
  }

  let transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      amount: true,
      userTarget: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      userOrigin: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
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
      AND: [
        {
          NOT: {
            userOriginId: {
              equals: null,
            },
          },
        },
        {
          NOT: {
            userTargetId: {
              equals: null,
            },
          },
        },
      ],
    },
    orderBy:{
      createdAt:'desc'
    }
  });

  return response(callback, 200, transactions);
};

module.exports = {
  registerTransfer,
  getMyTransfer
};
