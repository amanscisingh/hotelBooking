const express = require('express');
const homeRoute = express.Router();
const Rooms = require('../models/rooms');
const Bookings = require('../models/bookings');
const nodemailer = require('nodemailer');

const { bookedMail } = require('../mailTemplates/bookingMail');

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
        console.log('---', email);
        let bookings = await Bookings.find({ email: email }).sort({ createdAt: -1 }).lean();
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
        let htmlNew = bookedMail( booking._id, booking.userName, booking.email, booking.mobile, booking.checkIn, booking.checkOut, booking.noOfRooms, booking.amountPaid, (booking.totalAmount*100)/100, booking.breakfastAmount);

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'orangeskybookings@gmail.com',
                pass:'1234amanscisingh1234'
            }
        })
        
        let mailOptions = {
            from: 'orangeskybookings@gmail.com',
            to: `orangeskybookings@gmail.com, ${booking.email}`,
            subject: 'Booking Confirmed at Rosalie Hotel!',
            text: 'Greetings & Regards!',
            html: htmlNew
        }

        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
                console.log('Error Occurd!', err)
            } else {
                console.log('email sent...')
            }
        });

        res.render('bookingConfirmed', {email:booking.email, mobile:booking.mobile, userName: booking.userName, bookingId: booking._id, checkIn: booking.checkIn, checkOut:booking.checkOut, noOfRooms:booking.noOfRooms, amount:0, status:booking.status, totalAmount: (booking.totalAmount*100)/100, breakfastAmount: booking.breakfastAmount });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
})

module.exports = homeRoute;