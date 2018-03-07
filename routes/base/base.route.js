const BaseService = require('./base.service');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/',
    config: {
      auth: false,
      handler: BaseService.get
    },
  }]);
};

module.exports = {
  register,
  name: 'base'
};
