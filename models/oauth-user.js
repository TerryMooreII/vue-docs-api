const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  id: String,
});

module.exports = mongoose.model('OauthUser', schema);
