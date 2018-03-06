const Boom = require('boom');
const Article = require('../../models/article');
const Comment = require('../../models/comment');
const twitter = require('../../utils/twitter');

const itemsPerPage = 20;

const register = async (server) => {
  server.route([{
    method: 'GET',
    path: '/articles',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler(request, reply) {
        const query = {};
        if (request.query) {
          if (request.query.q) {
            query.title = {
              $regex: new RegExp(`.*${request.query.q}.*`, 'i'),
            };
          }
          if (request.query.tags) {
            query.tags = {
              $all: request.query.tags.split(','),
            };
          }
        }
        const page = request.query.page &&
          !isNaN(request.query.page) &&
          request.query.page > 1 ? request.query.page - 1 : 0;

        try {
          if (request.query.tags || request.query.q || request.query.orderby) {
            const articles = Article.find(query)
              .populate('submittedBy')
              .sort('-submittedDate')
              .skip(page * itemsPerPage)
              .limit(request.query.count || itemsPerPage)
              .exec();

            return articles;
          }
          // return (votes - 1) / pow((item_hour_age+2), gravity)
          const result = Article.aggregate([{
            $addFields: {
              // article: "$$ROOT",
              ranking: {
                $divide: [{
                  $subtract: ['$votesUp', '$votesDown'],
                }, // Total Votes
                {
                  $pow: [{
                    $divide: [{
                      $add: [{
                        $subtract: [new Date(), '$submittedDate'],
                      }, 2],
                    }, // hours since submitted + 2
                    3600000,
                    ],
                  }, // convert to hours
                  1.8,
                  ],
                }, // gravity of 1.8
                ],
              },
            },
          }])
            .sort('-ranking')
            .skip(page * itemsPerPage)
            .limit(request.query.count || itemsPerPage)
            .exec();

          const articles = Article.populate(result, { path: 'submittedBy' });

          return articles;
        } catch (error) {
          return Boom.badRequest(error);
        }
      },
    },
  },
  {
    method: 'GET',
    path: '/articles/{id}',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler(request) {
        return Article.findById(request.params.id).lean();
      },
    },
  },
  {
    method: 'GET',
    path: '/articles/{id}/comments',
    options: {
      description: 'No required authorization.',
      auth: false,
      handler(request) {
        let comments;
        if (request.query.thread) {
          comments = Comment.find({
            articleId: request.params.id,
            slug: {
              $regex: new RegExp(`.*${request.query.thread}.*`, 'i'),
            },
          });
        } else {
          comments = Comment.find({
            articleId: request.params.id,
          });
        }

        comments.populate('author', 'username').sort('fullSlug');

        return comments;
      },
    },
  },
  {
    method: 'POST',
    path: '/articles',
    options: {
      description: 'Create an article',
      pre: [{
        method: verifyUniqueArticle,
        assign: 'article',
      }],
      auth: {
        strategy: 'jwt',
        scope: ['user', 'admin', 'moderator'],
      },
      handler(request, h) {
        try {
          const article = new Article(request.payload);
          twitter.tweet(article.title, article._id); // eslint-disable-line 
          article.save();

          return h.response(article).created(`/article/${article._id}`); // eslint-disable-line
        } catch (error) {
          return Boom.forbidden(error); // HTTP 403
        }
      },
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
      handler(request) {
        try {
          const article = Article.findByIdAndUpdate(request.params.id, request.payload);
          return article;
        } catch (error) {
          return Boom.forbidden(error); // HTTP 403
        }
      },
    },
  },
  ]);
};


module.exports = {
  register,
  name: 'articles',
};


const verifyUniqueArticle = async (request) => {
  // Find an entry from the database that
  // matches either the email or username
  const daysForUniqueArticle = 2;
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - daysForUniqueArticle);
  try {
    const article = await Article.find({
      $and: [{
        url: new RegExp(request.payload.url, 'i'),
      },
      {
        submittedDate: {
          $gt: new Date(currentDate),
        },
      },
      ],
    })
      .sort('-submittedDate');

    if (article && article.length > 0) {
      return Boom.badRequest('Thanks but this article has already been submitted recently.');
    }

    return request.payload;
  } catch (error) {
    return Boom.badImplementation(error);
  }
};

