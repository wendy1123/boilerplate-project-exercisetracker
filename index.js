const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Database Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// --- MODELS ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// --- API ROUTES ---

// Create User
app.post('/api/users', async (req, res) => {
  const newUser = new User({ username: req.body.username });
  try {
    const user = await newUser.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Get All Users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('username _id');
  res.json(users);
});

// Add Exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const id = req.params._id;

  try {
    const user = await User.findById(id);
    if (!user) return res.json({ error: "User not found" });

    const exercise = new Exercise({
      userId: id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });

    const savedExercise = await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString()
    });
  } catch (err) {
    res.json({ error: "Could not save exercise" });
  }
});

// Get User Log
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  
  try {
    const user = await User.findById(id);
    if (!user) return res.json({ error: "User not found" });

    // Build Date Filter
    let dateFilter = {};
    if (from) dateFilter["$gte"] = new Date(from);
    if (to) dateFilter["$lte"] = new Date(to);

    let query = { userId: id };
    if (from || to) query.date = dateFilter;

    // Fetch exercises
    let exercises = await Exercise.find(query).limit(+limit || 500);

    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    });
  } catch (err) {
    res.json({ error: "Error fetching logs" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
