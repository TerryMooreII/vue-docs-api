const Boom = require('boom');
const Comment = require('../../models/comment');
const Article = require('../../models/article');

const itemsPerPage = 20;

const getSlug = (count = 4) => Math.random().toString(36).substr(-count);

const prependZero = val => (val < 10 ? `0${val}` : val);

const getDateSlug = () => {
  const date = new Date();
  return `${date.getFullYear()}.${prependZero(date.getMonth() + 1)}.${prependZero(date.getDate())}.${prependZero(date.getHours())}.${prependZero(date.getMinutes())}.${prependZero(date.getSeconds())}`;
};

const getAll = async (request) => {
  const page = request.query.page &&
  !Number.isNaN(request.query.page) &&
  request.query.page > 1 ? request.query.page - 1 : 0;

  return Comment.find({})
    .skip(page * itemsPerPage)
    .limit(request.query.count || itemsPerPage)
    .populate('articleId')
    .populate('author')
    .sort('-posted');
};

const get = async request => Comment.findById(request.params.id);

const post = async (request, h) => {
  const { parentId } = request.payload;
  const slugPart = getSlug(4);
  const fullSlugPart = `${getDateSlug()}:${slugPart}`;


  try {
    const parent = Comment.findById(parentId);
    let slugs;
    if (parentId) {
      slugs = {
        slug: `${parent.slug}/${slugPart}`,
        fullSlug: `${parent.fullSlug}/${fullSlugPart}`,
      };
    } else {
      slugs = {
        slug: slugPart,
        fullSlug: fullSlugPart,
      };
    }

    // Update Comment count
    Article.findByIdAndUpdate(request.payload.articleId, {
      $inc: {
        commentCount: 1,
      },
    });

    const comment = request.payload;
    comment.slug = slugs.slug;
    comment.fullSlug = slugs.fullSlug;
    comment.posted = Date.now();

    const saved = new Comment(comment);
    saved.save(comment);

    return h.response(comment).code(201);
  } catch (error) {
    return Boom.forbidden(error);
  }
};

const put = async (request) => {
  try {
    if (request.auth.credentials._id !== request.payload.author._id) { // eslint-disable-line
      return Boom.forbidden();
    }

    const updated = request.payload;
    updated.isEdited = true;

    const comment = Comment.findByIdAndUpdate(request.params.id, updated);
    return comment;
  } catch (error) {
    return Boom.forbidden(error);
  }
};

const remove = async (request) => {
  if (request.auth.scope === 'user' && request.auth.credentials._id !== request.payload.author._id) { // eslint-disable-line
    return Boom.forbidden(); // HTTP 403
  }
  try {
    const comment = Comment.findByIdAndUpdate(request.params.id, {
      text: '[DELETED]',
      isDeleted: true,
    });
    return comment;
  } catch (error) {
    return Boom.forbidden(error);
  }
};

module.exports = {
  getAll,
  get,
  post,
  put,
  remove
};
