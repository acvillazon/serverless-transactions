const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const secretJWT = "secret-jwt";

const signToken = async (user) =>{
    const secret = Buffer.from(secretJWT, "base64");
    
    return jwt.sign({ email: user.email, id: user.id}, secret, {
      expiresIn: 86400 // expires in 24 hours
    });
}

const getUserFromToken = async (token) =>{
    const secret = Buffer.from(secretJWT, "base64");
    
    const decoded = jwt.verify(token.replace("Bearer ", ""), secret);
    
    return decoded;
}

const comparePassword = (eventPassword, userPassword)=>{
  return bcrypt.compare(eventPassword, userPassword);
}


const response = (cb,statusCode, body)=>{
  return cb(null,{statusCode, body: JSON.stringify({body})})
}

module.exports = {
  signToken,
  getUserFromToken,
  comparePassword,
  response
};