require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fakultet_news',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

async function ensureSchema() {
  const createUsers = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`;

  const createNews = `CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`;

  const createMessages = `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`;

  const conn = await pool.getConnection();
  try {
    await conn.query(createUsers);
    await conn.query(createNews);
    await conn.query(createMessages);
  } finally {
    conn.release();
  }
}

async function ensureSampleNews() {
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM news');
  const cnt = rows[0].cnt || 0;
  if (cnt === 0) {
    const sample = [
      { title: 'Fakultet ochildi', content: 'Yangi fakultet rasmiy tarzda ochildi. Qo\'shiling va yangiliklardan xabardor bo\'ling.' },
      { title: 'Talabalar konferensiyasi', content: 'Talabalarimiz xalqaro konferensiyada ishtirok etdilar va sovrinlar qo\'lga kiritildi.' },
      { title: 'Yangilangan o\'quv dasturi', content: 'O\'quv dasturimiz zamonaviylashtirildi — ko\'proq amaliy mashg\'ulotlar.' }
    ];
    const conn = await pool.getConnection();
    try {
      for (const n of sample) {
        await conn.query('INSERT INTO news (title, content) VALUES (?, ?)', [n.title, n.content]);
      }
    } finally {
      conn.release();
    }
    console.log('Inserted sample news');
  }
}

function authRequired(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'unauthorized' });
}

// Auth APIs
app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: 'invalid_input' });
  const password_hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [fullName, email, password_hash]);
    req.session.userId = result.insertId;
    res.json({ id: result.insertId, fullName, email });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email_exists' });
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'invalid_input' });
  try {
    const [rows] = await pool.query('SELECT id, full_name, email, password_hash FROM users WHERE email = ?', [email]);
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'invalid_credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'invalid_credentials' });
    req.session.userId = user.id;
    res.json({ id: user.id, fullName: user.full_name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'logout_failed' });
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const [rows] = await pool.query('SELECT id, full_name, email, created_at FROM users WHERE id = ?', [req.session.userId]);
    if (!rows || rows.length === 0) return res.json({ user: null });
    const u = rows[0];
    res.json({ user: { id: u.id, fullName: u.full_name, email: u.email, created_at: u.created_at } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// News
app.get('/api/news', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, content, created_at FROM news ORDER BY created_at DESC');
    res.json({ news: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Messages
app.post('/api/messages', authRequired, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'invalid_input' });
  try {
    const [result] = await pool.query('INSERT INTO messages (user_id, message_text) VALUES (?, ?)', [req.session.userId, message]);
    res.json({ id: result.insertId, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/api/messages', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT m.id, m.message_text, m.created_at, u.full_name FROM messages m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC');
    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Start server after ensuring schema and sample data
ensureSchema()
  .then(() => ensureSampleNews())
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
