const mongoose = require('mongoose');

const pastBookingsSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    mobile:{
        type: Number,
        required: true
    },
    adults: {
        type: Number,
        required: true,
    },
    children: {
        type: Number,
        required: true,
        default: 0
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rooms',
        required: true
    },
    noOfRooms: {
        type: Number,
        required: true
    },
    status: { // booked, cancelled, checkedIn, checkedOut, partialBooked
        type: String,
        required: true
    },
    paymentId: {
        type: String,
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    breakfastAmount: {
        type: Number
    },
    noOfBreakfast: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        // required: true
    },
    extraBedCharges: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('PastBookings', pastBookingsSchema);