const ArticleService = require('./article.service');
const ArticleValidator = require('./article.validator');

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/articles',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler: ArticleService.getAll
    },
  },
  {
    method: 'GET',
    path: '/articles/{id}',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler: ArticleService.get,
    },
  },
  {
    method: 'POST',
    path: '/articles',
    options: {
      description: 'Create an article',
      pre: [{
        method: ArticleValidator.verifyUniqueArticle,
        assign: 'article',
      }],
      auth: {
        strategy: 'jwt',
        scope: ['user', 'admin', 'moderator'],
      },
      handler: ArticleService.post,
    },
  },
  {
    method: 'PUT',
    path: '/articles/{id}',
    options: {
      description: 'User required authorization',
      auth: {
        strategy: 'jwt',
        scope: ['user', 'admin', 'moderator'],
      },
      handler: ArticleService.put,
    },
  },
  ]);
};

module.exports = {
  register,
  name: 'articles',
};
