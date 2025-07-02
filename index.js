const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// In-memory storage
const users = [];
const exercises = {};
const { v4: uuidv4 } = require("uuid");

// 1. POST /api/users - create a new user
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  if (!username) return res.status(400).json({ error: "Username is required" });
  const _id = uuidv4();
  const user = { username, _id };
  users.push(user);
  exercises[_id] = [];
  res.json(user);
});

// 2. GET /api/users - list all users
app.get("/api/users", (req, res) => {
  res.json(users);
});

// 3. POST /api/users/:_id/exercises - add exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  const user = users.find((u) => u._id === _id);
  if (!user) return res.status(400).json({ error: "User not found" });
  const { description, duration, date } = req.body;
  if (!description || !duration)
    return res
      .status(400)
      .json({ error: "Description and duration are required" });
  const exerciseDate = date ? new Date(date) : new Date();
  const exercise = {
    description: String(description),
    duration: Number(duration),
    date: exerciseDate.toDateString(),
  };
  exercises[_id].push({ ...exercise, rawDate: exerciseDate });
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id,
  });
});

// 4. GET /api/users/:_id/logs - get exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const user = users.find((u) => u._id === _id);
  if (!user) return res.status(400).json({ error: "User not found" });
  let log = (exercises[_id] || []).map((e) => ({
    description: e.description,
    duration: e.duration,
    date: e.date,
  }));
  // Filtering
  const { from, to, limit } = req.query;
  if (from) {
    const fromDate = new Date(from);
    log = log.filter((e) => new Date(e.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    log = log.filter((e) => new Date(e.date) <= toDate);
  }
  if (limit) {
    log = log.slice(0, Number(limit));
  }
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
