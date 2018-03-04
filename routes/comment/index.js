'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Comment = require('../../models/comment');
const Article = require('../../models/article');

const itemsPerPage = 20;

exports.register = function(server, options, next) {

  server.route([{
    method: 'GET',
    path: '/comments',
    config: {
      description: 'No required authorization.',
      auth: false,
      handler: function(request, reply) {
        const page = request.query.page && !isNaN(request.query.page) && request.query.page > 1 ? request.query.page - 1 : 0;

        return reply(Comment.find({})
          .skip(page * itemsPerPage)
          .limit(request.query.count || itemsPerPage)
          .populate('articleId')
          .populate('author')
          .sort('-posted'));
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
        scope: ['user', 'admin', 'moderator']
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

            return Article.findByIdAndUpdate(request.payload.articleId, {
              $inc: {
                commentCount: 1
              }
            }).then(() => {
              return slugs;
            })
          })
          .then(slugs => {
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
        scope: ['user', 'admin', 'moderator']
      },
      handler: function(request, reply) {
        if (request.auth.credentials._id !== request.payload.author._id) {
          reply(Boom.forbidden()); // HTTP 403
          return;
        }

        let updated = request.payload;
        updated.isEdited = true;

        Comment.findByIdAndUpdate(request.params.id, updated, (error, comment) => {
          if (!error) {
            reply(comment); // HTTP 200
          } else {
            reply(Boom.forbidden(error)); // HTTP 403
          }
        });
      }
    }
  }, {
    method: 'DELETE',
    path: '/comments/{id}',
    config: {
      description: 'Admin or moderators required authorization',
      auth: {
        strategy: 'jwt',
        scope: ['admin', 'moderator', 'user']
      },
      handler: function(request, reply) {
        if (request.auth.scope === 'user' && request.auth.credentials._id !== request.payload.author._id) {
          reply(Boom.forbidden()); // HTTP 403
          return;
        }

        Comment.findByIdAndUpdate(request.params.id, {
          text: '[DELETED]',
          isDeleted: true
        }, (error, comment) => {
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
