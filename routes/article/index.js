'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Article = require('../../models/article');

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
                console.log(query);
                return reply(Article.find(query).sort('-submittedDate'));
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
