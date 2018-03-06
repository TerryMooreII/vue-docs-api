const Joi = require('joi');
const Boom = require('boom');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const OauthUser = require('../../models/oauth-user');
const token = require('../../utils/token');

const secret = process.env.TOKEN_SECRET;

const register = async (server) => {
  // This sets up out JWT authorization strategy
  // Access JWT user info at request.auth.credentials
  server.auth.strategy('jwt', 'jwt', {
    key: secret,
    validate: async (decoded, request) => {
      return { isValid: true };
    },
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
      handler: oauthHandler,
    },
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/google', // The callback endpoint registered with the provider
    options: {
      auth: 'google',
      handler: oauthHandler,
    },
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/oauth/github', // The callback endpoint registered with the provider
    options: {
      auth: 'github',
      handler: oauthHandler,
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
        method: getValidatedUser,
        assign: 'user',
      }],
      handler: request => ({
        user: request.pre.user,
        id_token: token.createToken(request.pre.user),
      }),
    },
  }, {
    method: 'GET',
    path: '/logout',
    config: {
      auth: false,
      handler: () => 'Logout Successful!',
    },
  }]);
};

module.exports = {
  register,
  name: 'auth',
};

const oauthHandler = async (request, h) => {
  if (!request.auth.isAuthenticated) {
    return `Authentication failed due to: ${request.auth.error.message}`;
  }

  return getOauthUser(request, h);
}

async function getOauthUser(request, h) {
  const oauthId = `${request.auth.credentials.provider}|${request.auth.credentials.profile.id}`;
  const redirectUrl = process.env.WEB_URL;
  try {
    const oauthUser = await OauthUser.findOne({
      id: oauthId,
    }).exec();

    if (oauthUser) {
      const data = await User.findById(oauthUser.user)
        .lean()
        .exec();

      return h.redirect(`${redirectUrl}#id_token=${token.createToken(data)}`)
    } 
    let newUser = {};

    switch (request.auth.credentials.provider) {
      case 'google':
        const email = request.auth.credentials.profile.email.split('@');
        newUser = {
          username: email[0],
          displayName: request.auth.credentials.profile.displayName,
          profileImage: request.auth.credentials.profile.raw.picture,
        };
        break;
      case 'github':
        newUser = {
          username: request.auth.credentials.profile.username,
          displayName: request.auth.credentials.profile.displayName,
          profileImage: request.auth.credentials.profile.raw.avatar_url,
        };
        break;
      case 'twitter':
        newUser = {
          username: request.auth.credentials.profile.username,
          displayName: request.auth.credentials.profile.displayName,
          profileImage: request.auth.credentials.profile.raw.profile_image_url_https,
        };
        break;
      default:
        break;
    }

    newUser.createdDate = Date.now();
    const user = new User(newUser);

    if (!newUser.scope) {
      user.scope = ['user'];
    }
    try {
      await user.save();

      const newOauthUser = new OauthUser({
        id: oauthId,
        user,
      });

      const savedUser = await newOauthUser.save();

      const data = await User.findById(savedUser.user)
        .lean()
        .exec();

      return h.redirect(`${redirectUrl}#id_token=${token.createToken(data)}`)
    } catch (error) {
      return Boom.forbidden(error); // HTTP 403
    }
  } catch (error) {
    return Boom.badRequest(error);
  }
}

const getValidatedUser = async (request, h) => {
  const {
    username,
    password,
  } = request.payload;

  try {
    const user = await User.findOne({
      username: new RegExp(username, 'i'),
    })
      .select('+password')
      .lean()
      .exec();

    if (user && bcrypt.compareSync(password, user.password)) {
      delete user.password;
      return user;
    }

    return Boom.badRequest('Incorrect password!');
  } catch (error) {
    return Boom.badRequest(error);
  }
};

