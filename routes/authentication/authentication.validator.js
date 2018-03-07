const Boom = require('boom');
const User = require('../../models/user');
const bcrypt = require('bcrypt');

const getValidatedUser = async (request) => {
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

module.exports = {
  getValidatedUser
};

