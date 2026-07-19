const mongoose = require('mongoose')

const Schema = mongoose.Schema

const HoldingSchema = new Schema({
    symbol: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    buyPrice: {
        type: Number,
        required: true
    }
}, { _id: false });

const UserStockSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    stocks: {
        type: [HoldingSchema],
        default: []
    }

});

const UserStockModel = mongoose.model('userStocks', UserStockSchema);

module.exports = UserStockModel;
