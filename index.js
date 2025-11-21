require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// -------------------- IN-MEMORY DATABASE --------------------
const users = {}; // {_id: { username, _id, log: [] }}
let nextUserId = 1;

// -------------------- USERS --------------------

// POST /api/users → Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) return res.json({ error: 'Username required' });

  const _id = nextUserId.toString();
  nextUserId++;

  users[_id] = { username, _id, log: [] };
  res.json({ username, _id });
});

// GET /api/users → List all users
app.get('/api/users', (req, res) => {
  const userList = Object.values(users).map(u => ({ username: u.username, _id: u._id }));
  res.json(userList);
});

// -------------------- EXERCISES --------------------

// POST /api/users/:_id/exercises → Add exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params._id;
  const user = users[_id];
  if (!user) return res.json({ error: 'User not found' });

  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.json({ error: 'Description and duration required' });
  }

  const exerciseDate = date ? new Date(date) : new Date();
  const exercise = {
    description: description.toString(),
    duration: Number(duration),
    date: exerciseDate.toDateString()
  };

  user.log.push(exercise);

  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// GET /api/users/:_id/logs → Get full exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id;
  const user = users[_id];
  if (!user) return res.json({ error: 'User not found' });

  let log = [...user.log];

  // Optional query parameters
  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    log = log.filter(e => new Date(e.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    log = log.filter(e => new Date(e.date) <= toDate);
  }
  if (limit) {
    log = log.slice(0, Number(limit));
  }

  res.json({
    username: user.username,
    _id: user._id,
    count: log.length,
    log: log.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date
    }))
  });
});

// -------------------- SERVER --------------------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
