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
                return reply(Article.find({}).sort('-submittedDate'));
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
    }]);

    next();
}

exports.register.attributes = {
    name: 'articles'
};
