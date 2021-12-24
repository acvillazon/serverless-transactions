"use-strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({});
const { response } = require("../libs/utils");
const { getUserById } = require("../auth/user");
const { validateFieldsTransfer } = require("./utils");

const reCharge = async (event, context, callback) => {
  const body = JSON.parse(event.body);
  if (Array.isArray(body)) {
    return response(callback, 400, { message: "Body can't be an array" });
  } else {
    const { amount, target } = JSON.parse(event.body);
    const errors = validateFieldsTransfer(JSON.parse(event.body));
    if (errors.trim().length) {
      return response(callback, 400, { message: errors });
    }

    let user = await getUserById(target);
    if (!user) {
      return response(callback, 400, { message: "Invalid user" });
    }

    try {
      let cart = await prisma.transaction.create({
        data: {
          userTargetId: target,
          amount: Number(amount),
        },
      });
      return response(callback, 200, cart);
    } catch (error) {
      return response(callback, 500, error);
    }
  }
};

const myreCharge = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  if (!id) {
    return response(callback, 400, { message: "Id is required" });
  }

  try {
    let user = await getUserById(id);
    let transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        amount: true,
      },
      where: {
        OR: {
          userTargetId: {
            equals: user.profile.id,
          },
        },
        AND: {
          userOriginId: {
            equals: null,
          },
        },
      },
      orderBy:{
        createdAt:'desc'
      }
    });

    return response(callback, 200, transactions);

  } catch (error) {
    console.error(error)
    return response(callback, 500, error);
  }
};

module.exports = {
  reCharge,
  myreCharge
};
