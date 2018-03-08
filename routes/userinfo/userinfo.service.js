const Boom = require('boom');
const User = require('../../models/user');

const get = async (request) => {
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

const put = async (request) => {
  try {
    const user = User.findByIdAndUpdate(request.auth.credentials._id, request.payload); //eslint-disable-line
    return user;
  } catch (error) {
    return Boom.forbidden(error); // HTTP 403
  }
};

module.exports = {
  get,
  put
};
