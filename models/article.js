const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Comment = require('./comment')

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
  version: String,
  comments: {
        type: Schema.ObjectId,
        ref: 'Comment'
    }
});

module.exports = mongoose.model('Article', schema);
