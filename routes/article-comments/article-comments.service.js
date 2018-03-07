const Boom = require('boom');
const Comment = require('../../models/comment');

const get = async (request) => {
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
};

module.exports = {
  get
};
