const CommentService = require('./comment.service');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/comments',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler: CommentService.getAll
    },
  }, {
    method: 'GET',
    path: '/comments/{id}',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler: CommentService.get,
    },
  }, {
    method: 'POST',
    path: '/comments',
    config: {
      description: 'User required authorization',
      auth: {
        strategy: 'jwt',
        scope: ['user', 'admin', 'moderator'],
      },
      handler: CommentService.post
    },
  }, {
    method: 'PUT',
    path: '/comments/{id}',
    options: {
      description: 'User required authorization',
      auth: {
        strategy: 'jwt',
        scope: ['user', 'admin', 'moderator'],
      },
      handler: CommentService.put,
    },
  }, {
    method: 'DELETE',
    path: '/comments/{id}',
    options: {
      description: 'Admin or moderators required authorization',
      auth: {
        strategy: 'jwt',
        scope: ['admin', 'moderator', 'user'],
      },
      handler: CommentService.remove
    },
  }]);
};

module.exports = {
  register,
  name: 'comments',
};
