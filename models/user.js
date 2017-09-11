const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var schema = new Schema({
    first: String,
    last: String,
    email: String,
    username: String,
    password: { type: String, select: false },
    scope:Array,
    //http://stackoverflow.com/questions/12096262/how-to-protect-the-password-field-in-mongoose-mongodb-so-it-wont-return-in-a-qu
});

module.exports = mongoose.model('User', schema);
