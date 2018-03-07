const Joi = require('joi');
const AuthenticationValidator = require('./authentication.validator');
const AuthenticationService = require('./authentication.service');

const secret = process.env.TOKEN_SECRET;

const register = async (server) => {
  // This sets up out JWT authorization strategy
  // Access JWT user info at request.auth.credentials
  server.auth.strategy('jwt', 'jwt', {
    key: secret,
    validate: async () => ({ isValid: true }),
    verifyOptions: {
      algorithms: ['HS256'],
    },
  });

  server.auth.strategy('twitter', 'bell', {
    provider: 'twitter',
    password: 'cookie_encryption_password_secure',
    clientId: process.env.TWITTER_CONSUMER_KEY,
    clientSecret: process.env.TWITTER_CONSUMER_SECRET,
    isSecure: false, // process.env.NODE_ENV === 'production'
    forceHttps: process.env.NODE_ENV === 'production',
  });

  server.auth.strategy('google', 'bell', {
    provider: 'google',
    password: 'cookie_encryption_password_secure',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    isSecure: false, // process.env.NODE_ENV === 'production'
    forceHttps: process.env.NODE_ENV === 'production',
  });

  server.auth.strategy('github', 'bell', {
    provider: 'github',
    password: 'cookie_encryption_password_secure',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    isSecure: false, // process.env.NODE_ENV === 'production'
    forceHttps: process.env.NODE_ENV === 'production',
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/twitter', // The callback endpoint registered with the provider
    options: {
      auth: 'twitter',
      handler: AuthenticationService.oauthHandler,
    },
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/google', // The callback endpoint registered with the provider
    options: {
      auth: 'google',
      handler: AuthenticationService.oauthHandler,
    },
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/github', // The callback endpoint registered with the provider
    options: {
      auth: 'github',
      handler: AuthenticationService.oauthHandler,
    },
  });

  server.route([{
    method: 'POST',
    path: '/login',
    options: {
      auth: false,
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().min(2).max(200).required(),
        },
      },
      pre: [{
        method: AuthenticationValidator.getValidatedUser,
        assign: 'user',
      }],
      handler: AuthenticationService.loginHandler
    },
  }, {
    method: 'GET',
    path: '/logout',
    config: {
      auth: false,
      handler: AuthenticationService.logoutHandler,
    },
  }]);
};

module.exports = {
  register,
  name: 'auth',
};
