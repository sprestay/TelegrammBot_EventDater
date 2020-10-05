const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
    from: {
        type: Number,
        required: true,
    },
    feedback: {
        type: String,
    }
}, { timestamps: true });

var Feedback = mongoose.model('Feedback', FeedbackSchema);
module.exports = Feedback;