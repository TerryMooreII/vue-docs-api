'use strict';

const Joi = require('joi');
const Boom = require('boom');
const User = require('../../models/user');
const bcrypt = require('bcrypt');

exports.register = (server, options, next) => {

    server.route([{
        method: 'POST',
        path: '/users',
        config: {
            description: 'User Save and registation',
            auth: false,
            pre:[{
              method:verifyUniqueUser,
              assign:'user'
            }],
            handler: (request, reply) => {
                var newUser = request.payload;
                newUser.password = bcrypt.hashSync(request.payload.password, 5);
                var user = new User(newUser);
                if (!newUser.scope){
                  user.scope = ['user'];
                }
                user.save((error) => {
                    if (!error) {
                        reply(user).created('/users/' + user._id); // HTTP 201
                    } else {
                        reply(Boom.forbidden(getErrorMessageFrom(error))); // HTTP 403
                    }
                });
            }
        }
    },{
        method: 'GET',
        path: '/users/me',
        config: {
            description: 'Get My info',
            auth: {
                strategy: 'jwt',
                scope: ['user', 'admin']
            },
            handler: (request, reply) => {
              const email = request.auth.credentials.email;
              if (!email){
                reply(Boom.unauthorized('Invalid Token'))
              }
              User.findOne({
                    email: email
                })
                .lean()
                .exec()
                .then((user) => {
                    reply(user)
                }).catch((error) => {
                    reply(Boom.badRequest())
                });
            }
        }
    }]);

    next();
}

exports.register.attributes = {
    name: 'user'
};

function verifyUniqueUser(request, reply) {
  // Find an entry from the database that
  // matches either the email or username
  User.findOne({
    $or: [
      { email: request.payload.email }
    ]
  }, (err, user) => {
    // Check whether the username or email
    // is already taken and error out if so
    if (user) {
      if (user.email === request.payload.email) {
        return reply(Boom.badRequest('Email taken'));
      }
    }
    // If everything checks out, send the payload through
    // to the route handler
    reply(request.payload);
  });
}
