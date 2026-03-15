const express = require('express');
const router = express.Router();
const db = require('../database/init');

// Booking page
router.get('/', (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms WHERE available = 1').all();
  res.render('booking', { title: 'Book a Room – Hotel Oasis', rooms });
});

// Create booking
router.post('/', (req, res) => {
  const { guest_name, email, phone, room_id, check_in, check_out, guests } = req.body;

  if (!guest_name || !email || !phone || !room_id || !check_in || !check_out) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Calculate nights
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
  const totalAmount = room.price * nights;

  const result = db.prepare(
    `INSERT INTO bookings (guest_name, email, phone, room_id, check_in, check_out, guests, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(guest_name, email, phone, room_id, check_in, check_out, guests || 1, totalAmount);

  res.json({
    success: true,
    bookingId: result.lastInsertRowid,
    totalAmount,
    nights,
    room: `${room.category} ${room.type}`
  });
});

// Payment simulation endpoint
router.post('/payment', (req, res) => {
  const { booking_id, payment_method } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Simulate payment processing
  const paymentId = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  db.prepare('UPDATE bookings SET payment_id = ?, payment_status = ? WHERE id = ?')
    .run(paymentId, 'completed', booking_id);

  res.json({
    success: true,
    paymentId,
    message: 'Payment successful! Your booking is confirmed.',
    booking: {
      id: booking.id,
      guest_name: booking.guest_name,
      total_amount: booking.total_amount
    }
  });
});

module.exports = router;
