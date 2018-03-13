const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  author: String,
  publishedDate: Date,
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  submittedDate: Date,
  type: String,
  tags: Array,
  votesDown: Number,
  votesUp: Number,
  votes: Object,
  title: String,
  url: String,
  text: String,
  version: String,
  commentCount: Number,
  isDeleted: Boolean,
});

module.exports = mongoose.model('Article', schema);
