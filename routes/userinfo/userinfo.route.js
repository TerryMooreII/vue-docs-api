const UserinfoService = require('./userinfo.service');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/users/me',
    options: {
      description: 'Get My info',
      auth: {
        strategy: 'jwt',
        scope: ['user', 'admin'],
      },
      handler: UserinfoService.get,
    },
  }]);
};

module.exports = {
  register,
  name: 'userinfo',
};
