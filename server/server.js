const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Question = require("./models/Question");

const app = express();
const port = 5000;


app.use(cors());
app.use(express.json());


mongoose.connect("mongodb://127.0.0.1:27017/quizDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(" Connected to MongoDB"))
.catch((err) => console.error(" MongoDB Connection Failed:", err));

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
    }));

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error while fetching questions");
  }
});

app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
