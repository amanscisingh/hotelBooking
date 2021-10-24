const express = require('express');
const homeRoute = express.Router();
const Rooms = require('../models/rooms');

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
        console.log(room);
        res.render('singleRoom', { room: room });
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
})
module.exports = homeRoute;