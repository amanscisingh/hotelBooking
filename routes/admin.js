const express = require('express');
const adminRoute = express.Router();
const Bookings = require('../models/bookings');

adminRoute.get('/', async (req, res) => {
    try {
        let allBookings = await Bookings.find({}).lean();
        res.render('admin', { allBookings: allBookings, layout: 'blank' });
    } catch (error) {
        console.log(error);
    }
});

module.exports = adminRoute;