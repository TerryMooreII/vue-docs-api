const Boom = require('boom');
const User = require('../../models/user');

const verifyUniqueUser = async (request) => {
  // Find an entry from the database that
  // matches either the email or username
  try {
    const user = await User.findOne({
      $or: [{
        email: new RegExp(request.payload.email, 'i'),
      },
      {
        username: new RegExp(request.payload.username, 'i'),
      },
      ],
    });

    if (user &&
      (user.email.toLowerCase() === request.payload.email.toLowerCase() ||
      user.username.toLowerCase() === request.payload.username.toLowerCase())) {
      return Boom.badRequest('Username or Email taken');
    }
    return request.payload;
  } catch (error) {
    return Boom.badImplementation(error);
  }
};

module.exports = {
  verifyUniqueUser
};
