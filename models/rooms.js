const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    totalRooms: {
        type: Number,
        required: true
    },
    actualPrice: {
        type: Number,
        required: true
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    bookingPrice: {
        type: Number,
        required: true
    },
    breakfastPrice: {
        type: Number,
        required: true
    },
    extraBedPrice: {
        type: Number,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Rooms', roomSchema);