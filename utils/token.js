

const jwt = require('jsonwebtoken');

const secret = process.env.TOKEN_SECRET;

function createToken(user) {
  // Sign the JWT
  return jwt.sign(user, secret, {
    algorithm: 'HS256',
    expiresIn: '21d',
  });
}

module.exports = {
  createToken,
};
