var mongoose = require('mongoose');
Schema = mongoose.Schema

const User = mongoose.model('User',{
    _id: Schema.Types.ObjectId,
    username: String,
    password: String,
    email: String,
    phone: String,
    reservedTables: [],
});
 
module.exports = User