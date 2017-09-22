'use strict';

/**
 * Dependencies.
 */
const Joi = require('joi');
const Boom = require('boom');
const Promise = require('bluebird');
const Hoek = require('hoek');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const token = require('../../utils/token');
const secret = require('../../config').token.secret

exports.register = (server, options, next) => {


    //This sets up out JWT authorization strategy
    //Access JWT user info at request.auth.credentials
    server.auth.strategy('jwt', 'jwt', {
        key: secret,
        verifyOptions: {
            algorithms: ['HS256']
        }
    });

    server.route([{
        method: 'POST',
        path: '/login',
        config: {
            auth: false,
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().min(2).max(200).required()
                }
            },
            pre: [{method: getValidatedUser, assign: 'user'}],
            handler: (request, reply) => {
              reply({
                  user:request.pre.user,
                  id_token: token.createToken(request.pre.user)
              });

            }
        }
    }, {
        method: 'GET',
        path: '/logout',
        config: {
            auth: false,
            handler: (request, reply) =>  {
                return reply('Logout Successful!');
            }
        }
    }]);

    next();
}

exports.register.attributes = {
    name: 'auth'
};

function getValidatedUser(request, reply) {
    const {username,password} = request.payload;

    User.findOne({
          username: new RegExp(username, 'i')
      })
      .select('+password')
      .lean()
      .exec()
      .then((user) => {
          if (user && bcrypt.compareSync(password, user.password)) {
              delete user.password;
              reply(user);
          } else {
              reply(Boom.badRequest('Incorrect password!'));
          }
      }).catch((error) => {
            reply(Boom.badRequest('Incorrect password!'))
      });
}
