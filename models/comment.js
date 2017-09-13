const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const User = require('./user');

var schema = new Schema({
  submittedBy: Schema.Types.ObjectId,
  submittedDate: Date,
  text: String,
  isDeleted: Boolean,
  articleId: Schema.Types.ObjectId,
  replies: [Comment]
});

module.exports = mongoose.model('Comment', schema);
