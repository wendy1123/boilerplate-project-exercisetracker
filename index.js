require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// -------------------- DATABASE --------------------
const users = {}; // {_id: {username, _id, log: []}}
let userIdCounter = 1;

// -------------------- USERS --------------------

// POST /api/users -> create new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ error: 'Username required' });

  const _id = userIdCounter.toString();
  userIdCounter++;

  users[_id] = { username, _id, log: [] };
  res.json({ username, _id });
});

// GET /api/users -> list all users
app.get('/api/users', (req, res) => {
  const allUsers = Object.values(users).map(u => ({ username: u.username, _id: u._id }));
  res.json(allUsers);
});

// -------------------- EXERCISES --------------------

// POST /api/users/:_id/exercises -> add exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const user = users[_id];
  if (!user) return res.json({ error: 'User not found' });

  const { description, duration, date } = req.body;
  if (!description || !duration) return res.json({ error: 'Description and duration required' });

  const exerciseDate = date ? new Date(date) : new Date();
  const exercise = {
    description: description.toString(),
    duration: parseInt(duration),
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

// GET /api/users/:_id/logs -> get user exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const user = users[_id];
  if (!user) return res.json({ error: 'User not found' });

  let log = user.log.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date
  }));

  // Filter by from/to
  if (from) log = log.filter(e => new Date(e.date) >= new Date(from));
  if (to) log = log.filter(e => new Date(e.date) <= new Date(to));

  // Apply limit
  if (limit) log = log.slice(0, parseInt(limit));

  res.json({
    username: user.username,
    _id: user._id,
    count: log.length,
    log
  });
});

// -------------------- SERVER --------------------
const listener = app.listen(process.env.PORT || 5000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
