const express = require('express');
const apiRoute = express.Router();
const Rooms = require('../models/rooms');
const Bookings = require('../models/bookings');
const PastBookings = require('../models/pastBookings');

apiRoute.get('/rooms/checkAvailability', async (req, res) => {
    try {
        const { checkInDate, checkOutDate, roomId, roomNo, adultNo } = req.query;
        const rooms = await Rooms.find({ _id: roomId }).lean();
        const totalRoomsAvailable = rooms[0].totalRooms;
        const bookings = await Bookings.find({ roomId: roomId }).lean();
        let bookedArray = [];
        let totalBookings = 0;  
        for (let i = 0; i < bookings.length; i++) {
            console.log(bookings[i].checkIn);
            console.log(new Date(checkOutDate));

            if (bookings[i].checkIn <= new Date(checkOutDate) && bookings[i].checkOut >= new Date(checkInDate)) {
                totalBookings++;
            } else {
                bookedArray.push(bookings[i]);
            }
        };
        console.log(bookings);
        const totalRoomsBooked = totalRoomsAvailable - totalBookings;
        const roomsAvailable = totalRoomsBooked > 0 ? true : false;
        console.log('Total Rooms Available: ', totalRoomsAvailable);
        console.log('Total Rooms booked in b/w given checkin and checkout date: ', totalBookings);
        
        if (roomsAvailable) {
            res.status(200).json({
                message: 'Room is available',
                data: rooms
            });
        } else {
            res.status(200).json({
                message: 'Room is not available',
                data: rooms
            });
        }     
    } catch (error) {
        console.log(error);
    }
});

// route to add a booking
apiRoute.get('/booking', async (req, res) => {
    try {
        const { checkInDate, checkOutDate, roomId, roomNo, adultNo, userName, email, mobile } = req.query;
        const booking = new Bookings({
            checkIn: new Date(checkInDate),
            checkOut: new Date(checkOutDate),
            roomId: roomId,
            roomNo: roomNo,
            adults: adultNo,
            userName: userName,
            email: email,
            mobile: mobile,
            status: 'partialBooked'
        });
        console.log(booking);
        const savedBooking = await booking.save();
        res.status(200).json({
            message: 'Booking added successfully',
            data: savedBooking
        });
    } catch (error) {
        console.log(error);
    }
});


// route to handle booking status
apiRoute.get('/deleteBooking/:id', async (req, res) => {
    try {
        let bookingId = req.params.id;
        const booking = await Bookings.findById(bookingId);
        if (booking) {
            const PastBooking = new PastBookings({
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                roomId: booking.roomId,
                roomNo: booking.roomNo,
                adults: booking.adults,
                userName: booking.userName,
                email: booking.email,
                mobile: booking.mobile,
                status: booking.status
            });
            const savedPastBooking = await PastBooking.save();
            console.log(savedPastBooking);
            const deletedBooking = await Bookings.findByIdAndDelete(bookingId);
            res.status(200).json({
                message: 'Booking deleted successfully',
                data: deletedBooking
            });
        } else {
            res.status(200).json({
                message: 'Booking not found',
                data: booking
            });
        }
    } catch (error) {
        console.log(error);
    }
});

apiRoute.get('/cancleBooking/:id', async (req, res) => {
    try {
        let bookingId = req.params.id;
        let booking = await Bookings.findById(bookingId);
        if (booking) {
            booking.status = 'cancelled';
            const savedBooking = await booking.save();
            res.status(200).json({
                message: 'Booking cancelled successfully',
                data: savedBooking
            });
        } else {
            res.status(200).json({
                message: 'Booking not found',
                data: booking
            });
        }

    } catch (error) {
        console.log(error);
    }
});

apiRoute.get('/markCheckIn/:id', async (req, res) => {
    try {
        let bookingId = req.params.id;
        let booking = await Bookings.findById(bookingId);
        if (booking) {
            booking.status = 'checkedIn';
            const savedBooking = await booking.save();
            res.status(200).json({
                message: 'Booking checked in successfully',
                data: savedBooking
            });
        } else {
            res.status(200).json({
                message: 'Booking not found',
                data: booking
            });
        }

    } catch (error) {
        console.log(error);
    }
});

apiRoute.get('/markCheckOut/:id', async (req, res) => {
    try {
        let bookingId = req.params.id;
        let booking = await Bookings.findById(bookingId);
        if (booking) {
            booking.status = 'checkOut';
            const savedBooking = await booking.save();
            res.status(200).json({
                message: 'Booking checked out successfully',
                data: savedBooking
            });
        } else {
            res.status(200).json({
                message: 'Booking not found',
                data: booking
            });
        }

    } catch (error) {
        console.log(error);
    }
});

module.exports = apiRoute;