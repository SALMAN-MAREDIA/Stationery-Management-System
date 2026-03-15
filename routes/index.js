const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Home
router.get('/', (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms WHERE available = 1').all();
  res.render('home', { title: 'Hotel Oasis – Welcome', rooms });
});

// Rooms
router.get('/rooms', (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms WHERE available = 1').all();
  res.render('rooms', { title: 'Our Rooms – Hotel Oasis', rooms });
});

// Gallery
router.get('/gallery', (req, res) => {
  res.render('gallery', { title: 'Gallery – Hotel Oasis' });
});

// About Us
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us – Hotel Oasis' });
});

// Contact Us
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us – Hotel Oasis' });
});

// Contact form submission
router.post('/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }
  db.prepare(
    'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, phone || null, subject || null, message);
  res.json({ success: true, message: 'Thank you for contacting us! We will get back to you soon.' });
});

module.exports = router;
