const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'hotel.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    occupancy TEXT NOT NULL,
    price INTEGER NOT NULL,
    ac INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    room_id INTEGER NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    guests INTEGER NOT NULL DEFAULT 1,
    total_amount INTEGER NOT NULL,
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    booking_status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed rooms if empty
const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
if (roomCount.count === 0) {
  const insertRoom = db.prepare(
    'INSERT INTO rooms (category, type, occupancy, price, ac, description) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const seedRooms = db.transaction(() => {
    insertRoom.run('Economy', 'Single', 'Single', 1900, 1, 'A/C Economy single room with modern amenities');
    insertRoom.run('Standard', 'Double', 'Double', 1900, 0, 'Non A/C Standard double room, comfortable and affordable');
    insertRoom.run('Deluxe', 'Single', 'Single', 2200, 1, 'A/C Deluxe single room with premium furnishings');
    insertRoom.run('Deluxe', 'Double', 'Double', 2500, 1, 'A/C Deluxe double room with vibrant décor');
    insertRoom.run('Executive', 'Single', 'Single', 3000, 1, 'A/C Executive single room – top-tier luxury');
    insertRoom.run('Executive', 'Double', 'Double', 3200, 1, 'A/C Executive double room for business travellers');
    insertRoom.run('Executive', 'Triple', 'Triple', 3700, 1, 'A/C Executive triple room – spacious family suite');
  });
  seedRooms();
}

// Seed default admin if none exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
if (adminCount.count === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hash);
}

module.exports = db;
