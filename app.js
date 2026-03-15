const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'hotel-oasis-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

// Make session data available in templates
app.use((req, res, next) => {
  res.locals.isAdmin = req.session && req.session.isAdmin;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/booking', require('./routes/booking'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 – Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`Hotel Oasis server running on http://localhost:${PORT}`);
});

module.exports = app;
