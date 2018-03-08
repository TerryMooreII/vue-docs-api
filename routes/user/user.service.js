const Boom = require('boom');
const User = require('../../models/user');
const bcrypt = require('bcrypt');

const getAll = async () => {
  try {
    const users = User.find({});
    return users;
  } catch (error) {
    return Boom.forbidden(error);
  }
};

const post = async (request, h) => {
  const newUser = request.payload;
  newUser.password = bcrypt.hashSync(request.payload.password, 5);
  newUser.createdDate = Date.now();

  try {
    const user = new User(newUser);
    if (!newUser.scope) {
      user.scope = ['user'];
    }
    const savedUser = await user.save();
    return h.response(savedUser).code(201); // eslint-disable-line
  } catch (error) {
    return Boom.forbidden(error);
  }
};

module.exports = {
  getAll,
  post
};
