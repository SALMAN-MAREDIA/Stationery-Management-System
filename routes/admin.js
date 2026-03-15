const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/init');

// Middleware to check admin session
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin-login', { title: 'Admin Login – Hotel Oasis', error: null });
});

// Admin login handler
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (admin && bcrypt.compareSync(password, admin.password)) {
    req.session.isAdmin = true;
    req.session.adminId = admin.id;
    return res.redirect('/admin/dashboard');
  }
  res.render('admin-login', { title: 'Admin Login – Hotel Oasis', error: 'Invalid username or password' });
});

// Dashboard
router.get('/dashboard', requireAdmin, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, r.category, r.type, r.occupancy
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    ORDER BY b.created_at DESC
  `).all();

  const rooms = db.prepare('SELECT * FROM rooms').all();
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();

  const stats = {
    totalBookings: bookings.length,
    totalRevenue: bookings
      .filter(b => b.payment_status === 'completed')
      .reduce((sum, b) => sum + b.total_amount, 0),
    totalRooms: rooms.length,
    unreadMessages: contacts.filter(c => !c.is_read).length
  };

  res.render('dashboard', {
    title: 'Dashboard – Hotel Oasis',
    bookings,
    rooms,
    contacts,
    stats
  });
});

// Update booking status
router.post('/booking/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE bookings SET booking_status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Mark contact as read
router.post('/contact/:id/read', requireAdmin, (req, res) => {
  db.prepare('UPDATE contacts SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
