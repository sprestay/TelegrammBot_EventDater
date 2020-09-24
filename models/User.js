const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    gender: {
        type: Boolean,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    about: {
        type: String,
    },
    event: {
        type: Array, 
    },
    cinema: {
        type: Array,
    },
    place: {
        type: Array
    }
}, {timestamps: true});

var User = mongoose.model('User', UserSchema);

module.exports = User;