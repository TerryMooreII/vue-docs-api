const Boom = require('boom');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/',
    config: {
      auth: false,
      handler: () => ({
        status: 'ok',
      }),
    },
  }, {
    method: 'GET',
    path: '/{path*}',
    config: {
      auth: false,
      handler: () => Boom.notFound(),
    },
  }]);
};

module.exports = {
  register,
  name: 'base',
};

