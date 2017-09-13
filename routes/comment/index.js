'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Comment = require('../../models/comment');

exports.register = function(server, options, next) {

    server.route([{
        method: 'GET',
        path: '/comments',
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

                return reply(Comment.find(query).sort('-submittedDate'));
            }
        }
    }, {
        method: 'GET',
        path: '/comments/{id}',
        config: {
            description: 'No required authorization.',
            auth: false,
            handler: function(request, reply) {

                return reply(Comment.findById(request.params.id));
            }
        }
    },{
        method: 'POST',
        path: '/comments',
        config: {
            description: 'User required authorization',
            auth: {
                strategy: 'jwt',
                scope: 'user'
            },
            handler: function(request, reply) {
              var comment = new Comment(request.payload);

              comment.save((error) => {
                  if (!error) {
                      reply(comment).created('/comment/' + comment._id); // HTTP 201
                  } else {
                      reply(Boom.forbidden(error)); // HTTP 403
                  }
              });
            }
        }
    }, {
        method: 'PUT',
        path: '/comments/{id}',
        config: {
            description: 'User required authorization',
            auth: {
                strategy: 'jwt',
                scope: 'user'
            },
            handler: function(request, reply) {
              Comment.findByIdAndUpdate(request.params.id, request.payload, (error, comment) => {
                  if (!error) {
                      reply(comment); // HTTP 200
                  } else {
                      reply(Boom.forbidden(error)); // HTTP 403
                  }
              });
            }
        }
    }]);

    next();
}

exports.register.attributes = {
    name: 'comments'
};
