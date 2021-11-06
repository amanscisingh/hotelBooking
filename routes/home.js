const express = require('express');
const homeRoute = express.Router();
const Rooms = require('../models/rooms');
const Bookings = require('../models/bookings');

homeRoute.get('/', (req, res) => {
    try {
        res.render('index');
        // res.send('Hello World');
    } catch (error) {
        console.log(error);
    }
});

homeRoute.get('/rooms', async (req, res)=> {
    try {
        let allRooms = await Rooms.find({}).lean();
        console.log(allRooms);
        res.render('rooms', { allRooms: allRooms });
    } catch (error) {
        console.log(error);
    }
});

homeRoute.get('/rooms/:id', async (req, res)=> {
    try {
        let room = await Rooms.findById(req.params.id).lean();
        let { checkIn, checkOut, bool, adultNo, roomNo } = req.query;
        console.log(room);
        res.render('singleRoom', { room: room, checkIn: checkIn, checkOut: checkOut, bool: bool, adultNo: adultNo, roomNo: roomNo });
        // res.send(room);
    } catch (error) {
        console.log(error);
    }
});


homeRoute.get('/rooms/bookings/:id', async (req, res)=> {
    try {
        let room = await Rooms.findById(req.params.id).lean();
        let { checkInDate, checkOutDate, bool, adultNo, roomNo, children } = req.query;
        console.log(room);
        res.render('bookingPage', { room: room, checkInDate: checkInDate, checkOutDate: checkOutDate, bool: bool, adultNo: adultNo, roomNo: roomNo, children: children });
        // res.send(room);
    } catch (error) {
        console.log(error);
    }
});

homeRoute.post('/rooms', async (req, res)=> {
    try {
        console.log(req.body);  
        res.send(req.body);
    } catch (error) {
        console.log(error);
    }
});


homeRoute.get('/about', (req, res) => {
    try {
        res.render('about');
    } catch (error) {
        console.log(error);
    }
});


homeRoute.get('/contact', (req, res) => {
    try {
        res.render('contact');
    } catch (error) {
        console.log(error);
    }
})


homeRoute.get('/gallery', (req, res) => {
    try {
        res.render('gallery');
    } catch (error) {
        console.log(error);
    }
});


homeRoute.get('/tnc', (req, res)=>{
    res.render('tnc');
})


homeRoute.get('/checkBookings', async (req, res)=>{
    try {
        let { email } = req.query;
        console.log(email);
        let bookings = await Bookings.find({ email: email, status: { $ne: 'partialBooked' } }).sort({ createdAt: -1 }).lean();
        console.log(bookings);

        res.render('checkBooking', { email: email, allBookings:bookings });
    } catch (error) {
        console.log(error);
    }
})


homeRoute.get('/confirmed/:id', async (req, res) => {
    try {
        let bookingId = req.params.id;
        let booking = await Bookings.findById(bookingId).lean();
        console.log(booking);
        res.render('bookingConfirmed', {email:booking.email, mobile:booking.mobile, userName: booking.userName, bookingId: booking._id, checkIn: booking.checkIn, checkOut:booking.checkOut, noOfRooms:booking.noOfRooms, amount:0, status:booking.status, totalAmount: booking.totalAmount });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
})

module.exports = homeRoute;