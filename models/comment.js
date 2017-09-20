const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  posted: Date,
  text: String,
  parentId: Schema.Types.ObjectId,
  isDeleted: Boolean,
  isEdited: Boolean,
  articleId: Schema.Types.ObjectId,
  slug: String,
  fullSlug: String
});

module.exports = mongoose.model('Comment', schema);
