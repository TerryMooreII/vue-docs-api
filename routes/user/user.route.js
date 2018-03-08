const UserService = require('./user.service');
const UserValidator = require('./user.validator');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/users',
    options: {
      description: 'Get All Users',
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: UserService.getAll
    },
  }, {
    method: 'POST',
    path: '/users',
    options: {
      description: 'User Save and registation',
      auth: false,
      pre: [{
        method: UserValidator.verifyUniqueUser,
        assign: 'user',
      }],
      handler: UserService.post,
    },
  }]);
};

module.exports = {
  register,
  name: 'user',
};
