const Boom = require('boom');
const Article = require('../../models/article');
const twitter = require('../../utils/twitter');

const itemsPerPage = 20;

const getAll = async (request) => {
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
    !Number.isNaN(request.query.page) &&
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
};

const get = async request => Article.findById(request.params.id).lean();

const post = async (request, h) => {
  try {
    const article = new Article(request.payload);
    twitter.tweet(article.title, article._id); // eslint-disable-line 
    article.save();

    return h.response(article).created(`/article/${article._id}`); // eslint-disable-line
  } catch (error) {
    return Boom.forbidden(error); // HTTP 403
  }
};

const put = async (request) => {
  try {
    const article = Article.findByIdAndUpdate(request.params.id, request.payload);
    return article;
  } catch (error) {
    return Boom.forbidden(error); // HTTP 403
  }
};

module.exports = {
  getAll,
  get,
  post,
  put
};
