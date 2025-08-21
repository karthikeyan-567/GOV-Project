// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = 5000;

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
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
