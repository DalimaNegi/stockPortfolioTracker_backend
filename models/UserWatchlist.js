const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserWatchlistSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    stocks: {
        type: [String]
    }

});

const UserWatchlistModel = mongoose.model('userWatchlists', UserWatchlistSchema);

module.exports = UserWatchlistModel;
