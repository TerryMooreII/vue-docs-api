const ArticleCommentsService = require('./article-comments.service');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/articles/{id}/comments',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler: ArticleCommentsService.get
    },
  },]);
};

module.exports = {
  register,
  name: 'article-comments',
};
