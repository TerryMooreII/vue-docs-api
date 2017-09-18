'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Article = require('../../models/article');
const Comment = require('../../models/comment');
const User = require('../../models/user');

exports.register = function(server, options, next) {

    server.route([{
        method: 'GET',
        path: '/articles',
        config: {
            description: 'No required authorization.',
            auth: false,
            handler: function(request, reply) {
                let query = {};
                if (request.query) {
                  if (request.query.q){
                    query['title'] = {
                      $regex : new RegExp(`.*${request.query.q}.*`, 'i')
                    }
                  }
                  if (request.query.tags) {
                    query['tags'] = { "$all" : request.query.tags.split(',')}
                  }
                }

                return reply(Article.find(query).sort('-submittedDate'));
            }
        }
    }, {
        method: 'GET',
        path: '/articles/{id}',
        config: {
            description: 'No required authorization.',
            auth: false,
            handler: function(request, reply) {
                var article = Article.findById(request.params.id);
                return reply(article);
            }
        }
    }, {
        method: 'GET',
        path: '/articles/{id}/comments',
        config: {
            description: 'No required authorization.',
            auth: false,
            handler: function(request, reply) {
                let comments
                if (request.query.thread) {
                  comments = Comment.find({
                    articleId: request.params.id,
                    slug: {
                      $regex : new RegExp(`.*${request.query.thread}.*`, 'i')
                    }
                  })
                } else {
                  comments = Comment.find({
                    articleId: request.params.id,
                  })
                }

                comments.populate('author', 'username').sort('fullSlug');
                return reply(comments);
            }
        }
    }, {
        method: 'POST',
        path: '/articles',
        config: {
            description: 'User required authorization',
            auth: {
                strategy: 'jwt',
                scope: 'user'
            },
            handler: function(request, reply) {
              var article = new Article(request.payload);

              article.save((error) => {
                  if (!error) {
                      reply(article).created('/article/' + article._id); // HTTP 201
                  } else {
                      reply(Boom.forbidden(getErrorMessageFrom(error))); // HTTP 403
                  }
              });
            }
        }
    }, {
        method: 'PUT',
        path: '/articles/{id}',
        config: {
            description: 'User required authorization',
            auth: {
                strategy: 'jwt',
                scope: 'user'
            },
            handler: function(request, reply) {
              Article.findByIdAndUpdate(request.params.id, request.payload, (error, article) => {
                  if (!error) {
                      reply(article); // HTTP 200
                  } else {
                      reply(Boom.forbidden(getErrorMessageFrom(error))); // HTTP 403
                  }
              });
            }
        }
    }]);

    next();
}

exports.register.attributes = {
    name: 'articles'
};
