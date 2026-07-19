const mongoose = require('mongoose')

const Schema = mongoose.Schema

const RefTokenSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    refreshToken: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800
    }

});

const RefTokenModel = mongoose.model('refTokens', RefTokenSchema);

module.exports = RefTokenModel;
