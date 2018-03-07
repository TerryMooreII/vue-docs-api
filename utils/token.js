const jwt = require('jsonwebtoken');

const secret = process.env.TOKEN_SECRET;

const createToken = user => jwt.sign(user, secret, {
  algorithm: 'HS256',
  expiresIn: '21d',
});

module.exports = {
  createToken
};
