const express = require('express');
const apiRoute = express.Router();
const Rooms = require('../models/rooms');
const Bookings = require('../models/bookings');
const PastBookings = require('../models/pastBookings');
const RazorPay = require("razorpay");
const nodemailer = require('nodemailer');
const { bookedMail, cancelledMail, checkInMail, checkOutMail } = require('../mailTemplates/bookingMail');
var request = require('request');

apiRoute.get('/rooms/checkAvailability', async (req, res) => {
    try {
        const { checkInDate, checkOutDate, roomId, roomNo, adultNo } = req.query;
        const rooms = await Rooms.find({ _id: roomId }).lean();
        const totalRoomsAvailable = rooms[0].totalRooms;
        const bookings = await Bookings.find({ roomId: roomId }).lean();
        console.log(new Date(checkInDate), new Date(checkOutDate));
        let bookedArray = [];
        let totalBookings = 0;  
        for (let i = 0; i < bookings.length; i++) {

            if (bookings[i].checkIn <= new Date(checkOutDate) && bookings[i].checkOut > new Date(checkInDate)  && (bookings[i].status == 'booked' || bookings[i].status == 'checkedIn')) {
                totalBookings+= bookings[i].noOfRooms;
                console.log(bookings[i].status);
            } else {
                bookedArray.push(bookings[i]);
            }
        };
        // console.log(bookings);
        const totalRoomsBooked = totalRoomsAvailable - totalBookings;
        const roomsAvailable = totalRoomsBooked > 0 ? true : false;
        console.log('Total Rooms Available: ', totalRoomsAvailable);
        console.log('Total Rooms booked in b/w given checkin and checkout date: ', totalBookings);
        
        if (roomsAvailable) {
            res.status(200).json({
                message: 'Room is available',
                description: `Total Rooms Available are: ${totalRoomsBooked}`,
                data: rooms
            });
        } else {
            res.status(200).json({
                message: 'Room is not available',
                description: `Total Rooms Available are: ${totalRoomsBooked}`,
                data: rooms
            });
        }     
    } catch (error) {
        console.log(error);
    }
});

// route to add a booking
apiRoute.post('/booking', async (req, res) => {
    try {
        const { checkInDate, checkOutDate, roomId, roomNo, adultNo, userName, email, mobile, noOfRooms, children } = req.query;
        const booking = new Bookings({
            checkIn: new Date(checkInDate),
            checkOut: new Date(checkOutDate),
            roomId: roomId,
            roomNo: roomNo,
            adults: adultNo,
            userName: userName,
            email: email,
            mobile: mobile,
            status: 'partialBooked',
            noOfRooms: noOfRooms,
            children: children
        });
        // console.log(booking);
        const savedBooking = await booking.save();
        res.status(200).json({
            message: 'Booking added successfully',
            data: savedBooking
        });
    } catch (error) {
        console.log(error);
    }
});


// route for razor pay
const razorpay = new RazorPay({
    key_id: "rzp_test_25WThwSFtdt8wf",
    key_secret: "L3Zq82uskZJJ3thFvBxB4DVL"
});

apiRoute.post('/order/:id', async (req, res) => {
    try {
        console.log('a.order/:id');
        const { id } = req.params;
        const roomData = await Rooms.findById(id).lean();
        var options = {
            amount: roomData.bookingPrice * 100,  // amount in the smallest currency unit  
            currency: "INR",  
            // receipt: "order_rcptid_11"
        };
        console.log(options);
        
        razorpay.orders.create(options, function(err, order) {
            console.log(order);
            res.status(200).json({
                message: 'Order created successfully',
                data: order
            });
        });

    } catch (error) {
        console.log(error);
    }
});

apiRoute.post('/payments/callback', async (req, res) => {
    console.log("Callback hitted....");
    const { bookingId, name, checkIn, checkOut, noOfRooms  } = req.query;
    console.log(bookingId);
    let booking = await Bookings.findById(bookingId);
    let status = 'Partially Booked (Not Paid)'
    razorpay.payments.fetch(req.body.razorpay_payment_id, async function (err, payment) {
        console.log(payment);
        if (payment.captured) {
            console.log('captured');
            status = 'Paid & Confirmed';
            booking.status = 'booked';
            booking.paymentId = payment.id;
            const savedBooking = await booking.save();
        }
        // res.status(200).json({
        //     message: 'Payment fetched successfully',
        //     data: payment
        // });

        let htmlNew = bookedMail( bookingId, name, payment.email, payment.contact, checkIn, checkOut, noOfRooms, payment.amount / 100);
    
        // create reusable transporter object using the default SMTP transport
        // let transporter = nodemailer.createTransport({
        //     host: "smtp.gmail.net",
        //     port: 465,
        //     secure: true, // true for 465, false for other ports
        //     auth: {
        //         user: "hotel@rosalie.in", // generated ethereal user
        //         pass: "Iamrich@7", // generated ethereal password
        //     },
        // });
    
        // // send mail with defined transport object
        // let info = await transporter.sendMail({
        //     from: 'hotel@rosalie.in', // sender address
        //     to: payment.email+ ", hotel@rosalie.in", // list of receivers
        //     subject: "Booking Confirmed at Rosalie Hotel!", // Subject line
        //     text: "Hello world?", // plain text body
        //     html: htmlNew, // html body
        // });

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'orangeskybookings@gmail.com',
                pass:'1234amanscisingh1234'
            }
        })
        
        let mailOptions = {
            from: 'orangeskybookings@gmail.com',
            to: `amanscisingh@gmail.com, ${payment.email}`,
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

        res.render('bookingConfirmed', {data: payment, userName: name, bookingId: bookingId, checkIn: checkIn, checkOut:checkOut, noOfRooms:noOfRooms, amount:payment.amount/100, status:status });
        // console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    
        // Preview only available when sending through an Ethereal account
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    });
    
});


apiRoute.get('/data', async (req, res) => {
    try {
        let { room } = req.query;
        const roomData = await Rooms.findById(room).lean();
        res.status(200).json(roomData);      
    } catch (error) {
        console.log(error);        
    }
})

apiRoute.post('/editRoom/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let roomReq = req.body;
        console.log(roomReq);
        const updatedRoom = await Rooms.findByIdAndUpdate(id, roomReq).lean();
        console.log(updatedRoom);
        // res.status(200).json(updatedRoom);
        res.redirect('/admin/rooms')
    } catch (error) {
        console.log(error);
    }
})

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
                status: booking.status,
                noOfRooms: booking.noOfRooms,
                paymentId: booking.paymentId,
            });
            const savedPastBooking = await PastBooking.save();
            console.log(savedPastBooking);
            const deletedBooking = await Bookings.findByIdAndDelete(bookingId);
            res.redirect('/admin');
            // res.status(200).json({
            //     message: 'Booking deleted successfully',
            //     data: deletedBooking
            // });
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

apiRoute.get('/cancelBooking/:id', async (req, res) => {
    try {
        let bookingId = req.params.id;
        let booking = await Bookings.findById(bookingId);
        let roomInfo = await Rooms.findById(booking.roomId);
        let wasBooked = booking.status === 'booked' ? true : false;
        if (booking) {
            booking.status = 'cancelled';
            const savedBooking = await booking.save();

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'orangeskybookings@gmail.com',
                    pass:'1234amanscisingh1234'
                }
            })
            
            let mailOptions = {
                from: 'orangeskybookings@gmail.com',
                to: `amanscisingh@gmail.com, ${booking.email}`,
                subject: 'Booking Cancelled at Orange Sky Inn!',
                text: 'Greetings & Regards!',
                html: cancelledMail(booking._id, booking.userName, booking.email, booking.mobile, booking.noOfRooms, wasBooked ? roomInfo.bookingPrice : "0")
            }
    
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) {
                    console.log('Error Occurd!', err)
                } else {
                    console.log('email sent...')
                }
            });

            // initiate refund
            if (wasBooked) {
                request({
                    method: 'POST',
                    url: `https://${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}@api.razorpay.com/v1/payments/${booking.paymentId}/refund`,
                  }, function (error, response, body) {
                    console.log('Status:', response.statusCode);
                    console.log('Headers:', JSON.stringify(response.headers));
                    console.log('Response:', body);
                  });
            }

            res.redirect('/admin');
            // res.status(200).json({
            //     message: 'Booking cancelled successfully',
            //     data: savedBooking
            // });
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
            booking.checkIn = new Date();
            const savedBooking = await booking.save();

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'orangeskybookings@gmail.com',
                    pass:'1234amanscisingh1234'
                }
            })
            
            let mailOptions = {
                from: 'orangeskybookings@gmail.com',
                to: `${booking.email}`,
                subject: 'Checked In at Orange Sky Inn!',
                text: 'Greetings & Regards!',
                html: checkInMail(booking._id, booking.userName, booking.email, booking.mobile, booking.children, booking.adults, booking.checkIn, booking.checkOut, booking.noOfRooms)
            }
    
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) {
                    console.log('Error Occurd!', err)
                } else {
                    console.log('email sent...')
                }
            });

            res.redirect('/admin');
            // res.status(200).json({
            //     message: 'Booking checked in successfully',
            //     data: savedBooking
            // });
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
            booking.status = 'checkedOut';
            booking.checkOut = new Date();
            const savedBooking = await booking.save();

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'orangeskybookings@gmail.com',
                    pass:'1234amanscisingh1234'
                }
            })
            
            let mailOptions = {
                from: 'orangeskybookings@gmail.com',
                to: `${booking.email}`,
                subject: 'Checked Out from Orange Sky Inn!',
                text: 'Greetings & Regards!',
                html: checkOutMail(booking._id, booking.userName, booking.email, booking.mobile, booking.children, booking.adults, booking.checkIn, booking.checkOut, booking.noOfRooms)
            }
    
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) {
                    console.log('Error Occurd!', err)
                } else {
                    console.log('email sent...')
                }
            });

            res.redirect('/admin');
            // res.status(200).json({
            //     message: 'Booking checked out successfully',
            //     data: savedBooking
            // });
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