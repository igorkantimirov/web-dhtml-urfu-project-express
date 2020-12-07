var mongoose = require('mongoose');

const User = mongoose.model('User',{
    username: String,
    password: String,
    email: String,
    phone: String,
    reservedTables: [],
});
 
module.exports = User