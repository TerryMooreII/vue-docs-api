const Boom = require('boom');
const User = require('../../models/user');
const OauthUser = require('../../models/oauth-user');
const token = require('../../utils/token');

const getOauthUser = async (request, h) => {
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

      return h.redirect(`${redirectUrl}#id_token=${token.createToken(data)}`);
    }
    let newUser = {};

    switch (request.auth.credentials.provider) {
      case 'google': // eslint-disable-line no-case-declarations
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

      return h.redirect(`${redirectUrl}#id_token=${token.createToken(data)}`);
    } catch (error) {
      return Boom.forbidden(error); // HTTP 403
    }
  } catch (error) {
    return Boom.badRequest(error);
  }
};

const oauthHandler = async (request, h) => {
  if (!request.auth.isAuthenticated) {
    return `Authentication failed due to: ${request.auth.error.message}`;
  }

  return getOauthUser(request, h);
};

const loginHandler = async request => ({
  user: request.pre.user,
  id_token: token.createToken(request.pre.user),
});

const logoutHandler = async (request, h) => h.response().code(201);

module.exports = {
  oauthHandler,
  OauthUser,
  loginHandler,
  logoutHandler
};
