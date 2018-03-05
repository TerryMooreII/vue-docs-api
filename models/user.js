const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var schema = new Schema({
    first: String,
    last: String,
    email: String,
    username: String,
    displayName: String,
    profileImage: String,
    password: { type: String, select: false },
    createdDate: Date,
    scope:Array,
    inActive: Boolean
    //http://stackoverflow.com/questions/12096262/how-to-protect-the-password-field-in-mongoose-mongodb-so-it-wont-return-in-a-qu
});

module.exports = mongoose.model('User', schema);
