var mongoose = require('mongoose');

const UserModel = mongoose.model('User',{
    username: String,
    password: String,
    email: String,
    phone: String
});
 
module.exports = UserModel