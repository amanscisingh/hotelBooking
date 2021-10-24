const express = require('express');
const apiRoute = express.Router();
const Rooms = require('../models/rooms');
const Bookings = require('../models/bookings');
const PastBookings = require('../models/pastBookings');
const RazorPay = require("razorpay");
const nodemailer = require('nodemailer');

apiRoute.get('/rooms/checkAvailability', async (req, res) => {
    try {
        const { checkInDate, checkOutDate, roomId, roomNo, adultNo } = req.query;
        const rooms = await Rooms.find({ _id: roomId }).lean();
        const totalRoomsAvailable = rooms[0].totalRooms;
        const bookings = await Bookings.find({ roomId: roomId }).lean();
        let bookedArray = [];
        let totalBookings = 0;  
        for (let i = 0; i < bookings.length; i++) {

            if (bookings[i].checkIn <= new Date(checkOutDate) && bookings[i].checkOut > new Date(checkInDate)) {
                totalBookings+= bookings[i].noOfRooms;
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
        const { checkInDate, checkOutDate, roomId, roomNo, adultNo, userName, email, mobile, noOfRooms } = req.query;
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
            noOfRooms: noOfRooms
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

apiRoute.post('/order', async (req, res) => {
    try {
        var options = {
            amount: 700 * 100,  // amount in the smallest currency unit  
            currency: "INR",  
            // receipt: "order_rcptid_11"
    };
    
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
    let html;
    razorpay.payments.fetch(req.body.razorpay_payment_id, async function (err, payment) {
        console.log(payment);
        if (payment.status === 'captured') {
            console.log('captured');
            let booking = await Bookings.findById(bookingId);
            booking.status = 'booked';
            const savedBooking = await booking.save();
        }
        res.status(200).json({
            message: 'Payment fetched successfully',
            data: payment
        });
        html = `
            <h1>Booking Details</h1>
            <li>Booking Id: ${bookingId}</li>
            <li>Booking Status: Paid & Confirmed</li>
            <li>Amount Paid: ${payment.amount / 100}</li>
            <li>Name: ${name}</li>
            <li>Email: ${payment.email}</li>
            <li>Mobile: ${payment.contact}</li>
            <li>Check In Date: ${checkIn}</li>
            <li>Check Out Date: ${checkOut}</li>
            <li>No. Of Rooms Booked: ${noOfRooms}</li>
            <br>
            <h2>Thank You for Booking with us</h2>
            <br>
            <p>Address: Ourem-Palolem Beach, 
            Canacona, Goa | 8572081747 </p>
            
        `;

        let htmlNew = `
        <!DOCTYPE html>
        <html>
        
        <head>
            <title></title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <style type="text/css">
                body,
                table,
                td,
                a {
                    -webkit-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                }
        
                table,
                td {
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                }
        
                img {
                    -ms-interpolation-mode: bicubic;
                }
        
                img {
                    border: 0;
                    height: auto;
                    line-height: 100%;
                    outline: none;
                    text-decoration: none;
                }
        
                table {
                    border-collapse: collapse !important;
                }
        
                body {
                    height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                }
        
                a[x-apple-data-detectors] {
                    color: inherit !important;
                    text-decoration: none !important;
                    font-size: inherit !important;
                    font-family: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                }
        
                @media screen and (max-width: 480px) {
                    .mobile-hide {
                        display: none !important;
                    }
        
                    .mobile-center {
                        text-align: center !important;
                    }
                }
        
                div[style*="margin: 16px 0;"] {
                    margin: 0 !important;
                }
            </style>
        
        <body style="margin: 0 !important; padding: 0 !important; background-color: #eeeeee;" bgcolor="#eeeeee">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="background-color: #eeeeee;" bgcolor="#eeeeee">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                            <tr>
                                <td align="center" valign="top" style="font-size:0; padding: 35px;" bgcolor="#F44336">
                                    <div style="display:inline-block; max-width:50%; min-width:100px; vertical-align:top; width:100%;">
                                        <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                            <tr>
                                                <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 800; line-height: 48px;" class="mobile-center">
                                                    <h1 style="font-size: 36px; font-weight: 800; margin: 0; color: #ffffff;">The Rosalie Hotels</h1>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div style="display:inline-block; max-width:50%; min-width:100px; vertical-align:top; width:100%;" class="mobile-hide">
                                        <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                            <tr>
                                                <td align="right" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; line-height: 48px;">
                                                    <table cellspacing="0" cellpadding="0" border="0" align="right">
                                                        <tr>
                                                            <td style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400;">
                                                                <p style="font-size: 18px; font-weight: 400; margin: 0; color: #ffffff;"><a href="#" target="_blank" style="color: #ffffff; text-decoration: none;">Shop &nbsp;</a></p>
                                                            </td>
                                                            <td style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 24px;"> <a href="#" target="_blank" style="color: #ffffff; text-decoration: none;"><img src="https://img.icons8.com/color/48/000000/small-business.png" width="27" height="23" style="display: block; border: 0px;" /></a> </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 35px 35px 20px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                        <tr>
                                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;"> <img src="https://img.icons8.com/carbon-copy/100/000000/checked-checkbox.png" width="125" height="120" style="display: block; border: 0px;" /><br>
                                                <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;"> Thank You For Your Order! </h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 10px;">
                                                <p style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777;"> This Mail is to inform you that booking has beeen confirmed. You will recieve a call from our Representative shortly!!! </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="left" style="padding-top: 20px;">
                                                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                    <tr>
                                                        <td width="75%" align="left" bgcolor="#eeeeee" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;"> Order Confirmation # ${bookingId}</td>
                                                        <td width="25%" align="left" bgcolor="#eeeeee" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;"> 2345678 </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;"> Booking Status </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;"> Paid & Confirmed </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> Name </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> ${name} </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> Email </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> ${payment.email} </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> Mobile </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> ${payment.contact} </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> Check In  </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> ${checkIn} </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> Check Out </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> ${checkOut} </td>
                                                    </tr>
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> No. Of Rooms </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> ${noOfRooms} </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="left" style="padding-top: 20px;">
                                                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                    <tr>
                                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;"> TOTAL </td>
                                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;"> ${payment.amount / 100} ₹ </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" height="100%" valign="top" width="100%" style="padding: 0 35px 35px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px;">
                                        <tr>
                                            <td align="center" valign="top" style="font-size:0;">
                                                <div style="display:inline-block; max-width:50%; min-width:240px; vertical-align:top; width:100%;">
                                                    <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                                        <tr>
                                                            <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px;">
                                                                <p style="font-weight: 800;">Address</p>
                                                                <p>Ourem-Palolem Beach,<br>Canacona, Goa<br>Pin Code - 403702<br>8572081747, 8950890302<br>hotel@rosalie.in </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </div>
                    
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style=" padding: 35px; background-color: #ff7361;" bgcolor="#1b9ba3">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                        <tr>
                                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;">
                                                <h2 style="font-size: 24px; font-weight: 800; line-height: 30px; color: #ffffff; margin: 0;"> We hope you will enjoy your stay!!! </h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="padding: 25px 0 15px 0;">
                                                <table border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td align="center" style="border-radius: 5px;" bgcolor="#66b3b7"> <a href="https://www.rosalie.in/" target="_blank" style="font-size: 18px; font-family: Open Sans, Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; background-color: #F44336; padding: 15px 30px; border: 1px solid #F44336; display: block;">Shop Again</a> </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                        <tr>
                                            <td align="center"> <img src="logo-footer.png" width="37" height="37" style="display: block; border: 0px;" /> </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 24px; padding: 5px 0 10px 0;">
                                                <p style="font-size: 14px; font-weight: 800; line-height: 18px; color: #333333;"> 675 Parko Avenue<br> LA, CA 02232 </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 24px;">
                                                <p style="font-size: 14px; font-weight: 400; line-height: 20px; color: #777777;"> If you didn't create an account using this email address, please ignore this email or <a href="#" target="_blank" style="color: #777777;">unsusbscribe</a>. </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        
        </html>
        `;
    
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
            user: "office@pdcbhu.in", // generated ethereal user
            pass: "Shivshambhu@1234", // generated ethereal password
            },
        });
    
        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: 'office@pdcbhu.in', // sender address
            to: payment.email+ ", amanscisingh@gmail.com", // list of receivers
            subject: "Booking Confirmed!", // Subject line
            text: "Hello world?", // plain text body
            html: htmlNew, // html body
        });
    
        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
        res.status(200).json(updatedRoom);
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

apiRoute.get('/cancleBooking/:id', async (req, res) => {
    try {
        let bookingId = req.params.id;
        let booking = await Bookings.findById(bookingId);
        if (booking) {
            booking.status = 'cancelled';
            const savedBooking = await booking.save();
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
            const savedBooking = await booking.save();
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
            booking.status = 'checkOut';
            const savedBooking = await booking.save();
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