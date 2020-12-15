var mongoose = require('mongoose');
Schema = mongoose.Schema

const Order = mongoose.model("Order", {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    room: String,
    date: String, 
    time: String, 
    persons: Number,
    table: String,
    additional: String
})
 
module.exports = Order