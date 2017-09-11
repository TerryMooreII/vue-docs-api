const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var schema = new Schema({
  author: String,
  publishedDate: Date,
  submittedBy: String,
  submittedDate: Date,
  type: String,
  tags: Array,
  thumbsDown: Number,
  thumbsUp: Number,
  votes: Object,
  title: String,
  url: String,
  version: String
});

module.exports = mongoose.model('Article', schema);
