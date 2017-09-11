'use strict';

const jwt = require('jsonwebtoken');
const secret = require('../config').token.secret;

function createToken(user) {
    // Sign the JWT
    return jwt.sign(user, secret, {
        algorithm: 'HS256',
        expiresIn: "1h"
    });
}

module.exports = {
    createToken: createToken
};
