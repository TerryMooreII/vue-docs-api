const Boom = require('boom');
const User = require('../../models/user');
const bcrypt = require('bcrypt');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/users',
    options: {
      description: 'Get Users',
      auth: false,
      handler: (request, h) => {
        try {
          const users = User.find({});
          return users;
        } catch (error) {
          return Boom.forbidden(error);
        }
      },
    },
  }, {
    method: 'POST',
    path: '/users',
    options: {
      description: 'User Save and registation',
      auth: false,
      pre: [{
        method: verifyUniqueUser,
        assign: 'user',
      }],
      handler: (request, h) => {
        const newUser = request.payload;
        newUser.password = bcrypt.hashSync(request.payload.password, 5);
        newUser.createdDate = Date.now();

        try {
          const user = new User(newUser);
          if (!newUser.scope) {
            user.scope = ['user'];
          }
          const savedUser = user.save();
          return h.response(savedUser).code(201); // eslint-disable-line
        } catch (error) {
          console.log(error);
          return Boom.forbidden(error);
        }
      },
    },
  }, {
    method: 'GET',
    path: '/users/me',
    options: {
      description: 'Get My info',
      auth: {
        strategy: 'jwt',
        scope: ['user', 'admin'],
      },
      handler: (request) => {
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
          console.log(request);
          return Boom.badRequest(error);
        }
      },
    },
  }]);
};

module.exports = {
  register,
  name: 'user',
};


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

