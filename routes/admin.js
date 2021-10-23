const express = require('express');
const adminRoute = express.Router();
const Bookings = require('../models/bookings');
const Rooms = require('../models/rooms');

adminRoute.get('/', async (req, res) => {
    try {
        let allBookings = await Bookings.find({}).lean();
        res.render('admin', { allBookings: allBookings, layout: 'blank' });
    } catch (error) {
        console.log(error);
    }
});

adminRoute.get('/rooms', async (req, res) => {
    try {
        let allRooms = await Rooms.find({}).lean();
        res.render('adminRoom', { allRooms: allRooms, layout: 'blank' });
    } catch (error) {
        console.log(error);
    }
})

module.exports = adminRoute;