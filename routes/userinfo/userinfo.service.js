const Boom = require('boom');
const User = require('../../models/user');

const get = async () => {
  try {
    const id = request.auth.credentials._id; // eslint-disable-line

    if (!id) {
      return Boom.unauthorized('Invalid Token');
    }
    const user = User.findById(id)
      .lean()
      .exec();

    return user;
  } catch (error) {
    return Boom.badRequest(error);
  }
};

module.exports = {
  get
};
