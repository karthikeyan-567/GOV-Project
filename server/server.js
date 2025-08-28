<<<<<<< HEAD
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Question = require("./models/Question");
=======
// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc

const app = express();
const port = 5000;

<<<<<<< HEAD
app.use(cors());
app.use(express.json());


mongoose
  .connect("mongodb://127.0.0.1:27017/quizDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(" Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB Connection Failed", err));


app.post("/api/questions", async (req, res) => {
  try {
    const newQ = new Question(req.body);
    await newQ.save();
    res.json({ message: "Question added successfully", id: newQ._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error while adding question");
  }
});


app.get("/api/questions", async (req, res) => {
  try {
    const { lang = "en", topic, level, classId } = req.query;

    const query = {};
    if (topic) query.topic = topic;
    if (level) query.difficulty = level;
    if (classId) query.classId = classId;

    const questions = await Question.find(query);

    const response = questions.map((q) => ({
      id: q._id,
      question: q.question_text[lang],
      options: q.options.map((opt) => opt[lang]),
      answer: q.correct_option_index,
      explanation: q.explanation[lang],
=======
app.use(cors()); // Enable CORS to allow calls from your React app

const uri = 'mongodb://localhost:27017/'; // Replace with your MongoDB connection string
const client = new MongoClient(uri);

let questionsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('quizDB');
    questionsCollection = db.collection('questions');
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("DB Connection failed", error);
  }
}

connectDB();

// API to get questions by language, topic, and level (default level = Basic/Easy)
app.get('/api/questions', async (req, res) => {
  try {
    const { lang = 'en', topic = 'Physics', level = 'Easy' } = req.query;

    // Query MongoDB for questions filtering by difficulty and topic
    const query = {
      difficulty: level,
      topic: topic
    };

    // Fetch question list from DB
    const questions = await questionsCollection.find(query).toArray();

    // Format questions to include only requested language fields
    const response = questions.map(q => ({
      id: q.id,
      question: q.question_text[lang],
      options: q.options.map(opt => opt[lang]),
      answer: q.correct_option_index,
      explanation: q.explanation[lang]
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
<<<<<<< HEAD
    res.status(500).send("Server error while fetching questions");
  }
});



app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
=======
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
});
