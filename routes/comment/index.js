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
          if (request.query.q) {
            query['title'] = {
              $regex: new RegExp(`.*${request.query.q}.*`, 'i')
            }
          }
          if (request.query.tags) {
            query['tags'] = {
              "$all": request.query.tags.split(',')
            }
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
  }, {
    method: 'POST',
    path: '/comments',
    config: {
      description: 'User required authorization',
      auth: {
        strategy: 'jwt',
        scope: 'user'
      },
      handler: function(request, reply) {
        const parentId = request.payload.parentId;
        const slugPart = getSlug(4);
        const fullSlugPart = `${getDateSlug()}:${slugPart}`;
        let slug;
        let fullSlug;
        var promise = new Promise((resolve, reject) => {
          if (parentId) {
            Comment.findById(parentId).then((parent) => {
              resolve({
                slug: parent.slug + '/' + slugPart,
                fullSlug: parent.fullSlug + '/' + fullSlugPart
              });
            });
          } else {
            resolve({
              slug: slugPart,
              fullSlug: fullSlugPart
            });
          }
        }).then(slugs => {
          let comment = request.payload;
          comment.slug = slugs.slug;
          comment.fullSlug = slugs.fullSlug
          comment.posted = Date.now();

          let saved = new Comment(comment);
          saved.save(comment).then((response, error) => {
            if (!error) {
              reply(comment).created('/comment/' + saved._id); // HTTP 201
            } else {
              reply(Boom.forbidden(error)); // HTTP 403
            }
          });
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

function getSlug(count = 4) {
  return Math.random().toString(36).substr(-count);
}

function getDateSlug() {
  var date = new Date();
  return `${date.getFullYear()}.${prependZero(date.getMonth() + 1)}.${prependZero(date.getDate())}.${prependZero(date.getHours())}.${prependZero(date.getMinutes())}.${prependZero(date.getSeconds())}`;
}

function prependZero(val) {
  return val < 10 ? `0${val}` : val;
}

exports.register.attributes = {
  name: 'comments'
};
