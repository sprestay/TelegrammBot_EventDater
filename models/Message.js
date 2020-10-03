const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    from: {
        type: Number,
        required: true,
    },
    to: {
        type: Number,
        required: true,
    }, 
    text: {
        type: String,
        required: true,
    }
}, { timestamps: true });

var Message = mongoose.model('Message', messageSchema);
module.exports = Message;