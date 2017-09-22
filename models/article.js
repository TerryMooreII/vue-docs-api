const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var schema = new Schema({
  author: String,
  publishedDate: Date,
  submittedBy: String,
  submittedDate: Date,
  type: String,
  tags: Array,
  votesDown: Number,
  votesUp: Number,
  votes: Object,
  title: String,
  url: String,
  version: String,
  commentCount: Number,
  isDeleted: Boolean
});

module.exports = mongoose.model('Article', schema);
