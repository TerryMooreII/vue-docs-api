const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const User = require('./user');

var schema = new Schema({
  submittedBy: Schema.Types.ObjectId,
  submittedDate: Date,
  text: String,
  articleId: Schema.Types.ObjectId,
  parentId: Schema.Types.ObjectId
});

module.exports = mongoose.model('Comment', schema);
