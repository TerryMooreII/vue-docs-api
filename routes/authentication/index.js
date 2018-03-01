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
const OauthUser = require('../../models/oauth-user');
const token = require('../../utils/token');
const secret = process.env.TOKEN_SECRET;

exports.register = (server, options, next) => {

  //This sets up out JWT authorization strategy
  //Access JWT user info at request.auth.credentials
  server.auth.strategy('jwt', 'jwt', {
    key: secret,
    verifyOptions: {
      algorithms: ['HS256']
    }
  });

  server.auth.strategy('twitter', 'bell', {
    provider: 'twitter',
    password: 'cookie_encryption_password_secure',
    clientId: process.env.TWITTER_CONSUMER_KEY,
    clientSecret: process.env.TWITTER_CONSUMER_SECRET,
    isSecure: false // process.env.NODE_ENV === 'production'
  });

  server.auth.strategy('google', 'bell', {
    provider: 'google',
    password: 'cookie_encryption_password_secure',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    isSecure: false // process.env.NODE_ENV === 'production'
  });

  server.auth.strategy('github', 'bell', {
    provider: 'github',
    password: 'cookie_encryption_password_secure',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    isSecure: false // process.env.NODE_ENV === 'production'
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/twitter',   // The callback endpoint registered with the provider
    config: {
        auth: 'twitter',
        handler: oauthHandler
    }
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/google',   // The callback endpoint registered with the provider
    config: {
        auth: 'google',
        handler: oauthHandler
    }
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/github',   // The callback endpoint registered with the provider
    config: {
        auth: 'github',
        handler: oauthHandler
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
      pre: [{
        method: getValidatedUser,
        assign: 'user'
      }],
      handler: (request, reply) => {
        reply({
          user: request.pre.user,
          id_token: token.createToken(request.pre.user)
        });
      }
    }
  }, {
    method: 'GET',
    path: '/logout',
    config: {
      auth: false,
      handler: (request, reply) => {
        return reply('Logout Successful!');
      }
    }
  }]);

  next();
}

exports.register.attributes = {
  name: 'auth'
};

function oauthHandler (request, reply) {
  if (!request.auth.isAuthenticated) {
    return reply('Authentication failed due to: ' + request.auth.error.message);
  }

  getOauthUser(request, reply);
}

function getOauthUser(request, reply) {
  const oauthId = `${request.auth.credentials.provider}|${request.auth.credentials.profile.id}`;  
  const redirectUrl = process.env.WEB_URL;
  OauthUser.findOne({
    id: oauthId
  })
  .exec()
  .then((oauthUser) => {
    if (oauthUser) {
      User.findById(oauthUser.user)
        .lean()
        .exec()
        .then(data => reply().redirect(`${redirectUrl}#id_token=${token.createToken(data)}`));
    } else {
      var newUser = {
        username: request.auth.credentials.profile.username || request.auth.credentials.profile.displayName,
      }
      newUser.createdDate = Date.now();
      var user = new User(newUser);
      if (!newUser.scope) {
        user.scope = ['user'];
      }
      user.save((error) => {
        if (!error) {
          const newOauthUser = new OauthUser({
            id: oauthId,
            user
          })
          newOauthUser.save((error, savedUser) => {
            if (!error) {
              User.findById(savedUser.user)
                .lean()
                .exec()
                .then(data => reply().redirect(`${redirectUrl}#id_token=${token.createToken(data)}`));
            } else {
              reply(Boom.forbidden(getErrorMessageFrom(error))); // HTTP 403
            }
          })
        } else {
          reply(Boom.forbidden(getErrorMessageFrom(error))); // HTTP 403
        }
      });
    }
  }).catch((error) => {
    reply(Boom.badRequest('Oauth Login Failed!'));
  });
}

function getValidatedUser(request, reply) {
  const {
    username,
    password
  } = request.payload;

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
