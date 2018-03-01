const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  id: String
});

module.exports = mongoose.model('OauthUser', schema);