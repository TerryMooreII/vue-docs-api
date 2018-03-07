const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  posted: Date,
  text: String,
  parentId: Schema.Types.ObjectId,
  isDeleted: Boolean,
  isEdited: Boolean,
  articleId: { type: Schema.Types.ObjectId, ref: 'Article' },
  slug: String,
  fullSlug: String,
});

module.exports = mongoose.model('Comment', schema);
