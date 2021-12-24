"use strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({});
const bcrypt = require("bcryptjs");

const { signToken, comparePassword, response } = require("../libs/utils");

const register = async (event, context, callback) => {
  const { email, password, name, amount } = JSON.parse(event.body);
  let bodyErrors = "";

  if (!email) {
    bodyErrors += "Email is required\n";
  }

  if (!name) {
    bodyErrors += "Name is required\n";
  }

  if (!password) {
    bodyErrors += "Password is required\n";
  }

  if (!amount) {
    bodyErrors += "Initial balance is required\n";
  }

  if (bodyErrors.trim().length) {
    return response(callback,400,{message: bodyErrors});
  }

  try {
    const passwordHash = await bcrypt.hash(password, 8); // hash the pass
    let user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        profile: {
          create: {
            name,
            transactions: {
              create: [
                {
                  amount: amount,
                },
              ],
            },
          },
        },
      },
    });
    let token = await signToken(user);
    return response(callback,200,token);
  } catch (error) {
    return response(callback,500,error );
  }
};

const login = async (event, context, callback) => {
  const { email, password } = JSON.parse(event.body);
  let bodyErrors = "";

  if (!email) {
    bodyErrors += "Email is required\n";
  }

  if (!password) {
    bodyErrors += "Password is required\n";
  }

  if (bodyErrors.trim().length) {
    return response(callback,400,{message: bodyErrors});
  }

  try {
    // By unique identifier
    // By unique identifier
    let user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!user) {
      return response(callback,500,{message: "User not found!"});
    }

    let matchPswd = await comparePassword(password, user.password);
    if (!matchPswd) {
      return response(callback,500,{message: "Password does not match!"});
    }

    delete user.password;
    let token = await signToken(user);
    return response(callback,200,{user,token});
  } catch (error) {
    console.log(error);
    return response(callback,500,error);
  }
};

const getUser = async (event, context, callback) => {
  const { id } = event.requestContext.authorizer.claims;
  if (!id) {
    return response(callback,400,{message: "Id is required"});
  }

  try {
    // By unique identifier
    let user = await getUserById(id);
    if(!user){
      return response(callback,400,{message: "User not found"});
    }
    delete user.password;
    return response(callback,200,user);
  } catch (error) {
    console.log(error);
    return response(callback,500,{message: "Something wrong happened!"});
  }
};

const getUserById = async (id) => {
  if (!id) {
    return null;
  }

  try {
    // By unique identifier
    let user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return user;
  } catch (error) {
    return null;
  }
};

module.exports = {
  register,
  getUser,
  getUserById,
  login,
};
