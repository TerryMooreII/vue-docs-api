'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Article = require('../../models/article');
const Comment = require('../../models/comment');
const User = require('../../models/user');
const itemsPerPage = 20;

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
            const page = request.query.page && !isNaN(request.query.page) && request.query.page > 1 ? request.query.page - 1 : 0;

            if (request.query.tags || request.query.q || request.query.latest){
              return reply(Article.find(query)
                .skip(page * itemsPerPage)
                .limit(request.query.count || itemsPerPage)
                .sort('-submittedDate'));
            } else {
              //return (votes - 1) / pow((item_hour_age+2), gravity)
              return reply(Article.aggregate([
                  {
                    $addFields: {
                      //article: "$$ROOT",
                      ranking: { $divide: [
                        { $subtract: [ "$votesUp", "$votesDown" ] },  //Total Votes
                        { $pow: [
                            {$divide: [
                              {$add: [
                                {$subtract: [new Date(), "$submittedDate"]}
                                , 2]} //hours since submitted + 2
                              , 3600000 ]}, //convert to hours
                          1.8] } //gravity of 1.8
                        ]
                      }
                    }
                  }
                ])
                .skip(page * itemsPerPage)
                .limit(request.query.count || itemsPerPage)
                .sort('-ranking'))
              }
            }
          }
        },
        {
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
        },
        {
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
                    $regex: new RegExp(`.*${request.query.thread}.*`, 'i')
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
        },
        {
          method: 'POST',
          path: '/articles',
          config: {
            description: 'Create an article',
            pre: [{
              method: verifyUniqueArticle,
              assign: 'article'
            }],
            auth: {
              strategy: 'jwt',
              scope: ['user', 'admin', 'moderator']
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
        },
        {
          method: 'PUT',
          path: '/articles/{id}',
          config: {
            description: 'User required authorization',
            auth: {
              strategy: 'jwt',
              scope: ['user', 'admin', 'moderator'],
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

    function verifyUniqueArticle(request, reply) {
      // Find an entry from the database that
      // matches either the email or username
      const daysForUniqueArticle = 2
      var currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - daysForUniqueArticle);

      Article.find({
          $and: [{
              url: new RegExp(request.payload.url, 'i')
            },
            {
              submittedDate: {
                $gt: new Date(currentDate)
              }
            }
          ]
        })
        .sort('-submittedDate')
        .then((article) => {
          if (article && article.length > 0) {
            return reply(Boom.badRequest('Thanks but this article has already been submitted recently.'));
          }
          // If everything checks out, send the payload through
          // to the route handler
          reply(request.payload);
        });
    }
