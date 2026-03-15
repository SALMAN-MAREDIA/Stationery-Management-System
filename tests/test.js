const http = require('http');
const path = require('path');

// Remove any existing test database
const fs = require('fs');
const dbPath = path.join(__dirname, '..', 'database', 'hotel.db');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Hotel Oasis Management System – Tests\n');

  // Test database initialization
  console.log('Database Tests:');
  const db = require('../database/init');
  const rooms = db.prepare('SELECT * FROM rooms').all();
  assert(rooms.length === 7, 'Database has 7 seeded rooms');

  const admins = db.prepare('SELECT * FROM admins').all();
  assert(admins.length >= 1, 'Database has at least 1 admin');
  assert(admins[0].username === 'admin', 'Default admin username is "admin"');

  // Check room data
  const economy = rooms.find(r => r.category === 'Economy');
  assert(economy && economy.price === 1900, 'Economy room price is ₹1900');

  const executive = rooms.find(r => r.category === 'Executive' && r.occupancy === 'Triple');
  assert(executive && executive.price === 3700, 'Executive Triple room price is ₹3700');

  // Start server for HTTP tests
  const app = require('../app');
  const server = app.listen(0); // random port
  const port = server.address().port;
  const baseOpts = { hostname: 'localhost', port };

  console.log('\nPage Tests:');

  // Test Home page
  const home = await request({ ...baseOpts, path: '/', method: 'GET' });
  assert(home.status === 200, 'Home page returns 200');
  assert(home.body.includes('Hotel Oasis'), 'Home page contains "Hotel Oasis"');

  // Test Rooms page
  const roomsPage = await request({ ...baseOpts, path: '/rooms', method: 'GET' });
  assert(roomsPage.status === 200, 'Rooms page returns 200');
  assert(roomsPage.body.includes('Our Rooms'), 'Rooms page contains "Our Rooms"');

  // Test Gallery page
  const gallery = await request({ ...baseOpts, path: '/gallery', method: 'GET' });
  assert(gallery.status === 200, 'Gallery page returns 200');
  assert(gallery.body.includes('Gallery'), 'Gallery page contains "Gallery"');

  // Test About page
  const about = await request({ ...baseOpts, path: '/about', method: 'GET' });
  assert(about.status === 200, 'About page returns 200');
  assert(about.body.includes('1985'), 'About page mentions founding year 1985');

  // Test Contact page
  const contact = await request({ ...baseOpts, path: '/contact', method: 'GET' });
  assert(contact.status === 200, 'Contact page returns 200');
  assert(contact.body.includes('+91-22-3022 7886'), 'Contact page has phone number');
  assert(contact.body.includes('info@hoteloasisindia.in'), 'Contact page has email');

  // Test Booking page
  const bookingPage = await request({ ...baseOpts, path: '/booking', method: 'GET' });
  assert(bookingPage.status === 200, 'Booking page returns 200');

  // Test Admin Login page
  const loginPage = await request({ ...baseOpts, path: '/admin/login', method: 'GET' });
  assert(loginPage.status === 200, 'Admin login page returns 200');

  // Test 404
  const notFound = await request({ ...baseOpts, path: '/nonexistent', method: 'GET' });
  assert(notFound.status === 404, '404 page returns 404 for unknown routes');

  console.log('\nAPI Tests:');

  // Test contact form submission
  const contactData = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    phone: '+91-12345 67890',
    subject: 'Test Subject',
    message: 'This is a test message'
  });
  const contactRes = await request({
    ...baseOpts,
    path: '/contact',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(contactData) }
  }, contactData);
  assert(contactRes.status === 200, 'Contact form submission returns 200');
  const contactJson = JSON.parse(contactRes.body);
  assert(contactJson.success === true, 'Contact form returns success');

  // Test booking creation
  const bookingData = JSON.stringify({
    guest_name: 'John Doe',
    email: 'john@example.com',
    phone: '+91-98765 43210',
    room_id: 1,
    check_in: '2026-04-01',
    check_out: '2026-04-03',
    guests: 2
  });
  const bookingRes = await request({
    ...baseOpts,
    path: '/booking',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bookingData) }
  }, bookingData);
  assert(bookingRes.status === 200, 'Booking creation returns 200');
  const bookingJson = JSON.parse(bookingRes.body);
  assert(bookingJson.success === true, 'Booking returns success');
  assert(bookingJson.nights === 2, 'Booking calculates 2 nights');
  assert(bookingJson.totalAmount === 3800, 'Booking total is ₹3800 (1900 × 2)');

  // Test payment
  const paymentData = JSON.stringify({
    booking_id: bookingJson.bookingId,
    payment_method: 'card'
  });
  const paymentRes = await request({
    ...baseOpts,
    path: '/booking/payment',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(paymentData) }
  }, paymentData);
  assert(paymentRes.status === 200, 'Payment returns 200');
  const paymentJson = JSON.parse(paymentRes.body);
  assert(paymentJson.success === true, 'Payment returns success');
  assert(paymentJson.paymentId.startsWith('PAY_'), 'Payment ID starts with PAY_');

  // Verify booking in database
  const dbBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingJson.bookingId);
  assert(dbBooking.payment_status === 'completed', 'Booking payment status updated to completed');

  // Test WhatsApp link
  assert(home.body.includes('wa.me/918286470877'), 'Home page has WhatsApp link');

  // Test tariff data on home page
  assert(home.body.includes('1,900'), 'Home page shows ₹1,900 tariff');
  assert(home.body.includes('3,700'), 'Home page shows ₹3,700 tariff');

  // Cleanup
  server.close();

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
