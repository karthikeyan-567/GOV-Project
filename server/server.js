// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Question = require("./models/Question"); // keep your existing Question model

const app = express();
const port = process.env.PORT || 5000;

// Middleware - allow your React dev server and typical clients
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quizDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(" Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB Connection Failed:", err));

/* -----------------------
   Leaderboard Mongoose model
   ----------------------- */
const leaderboardSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Guest" },
    score: { type: Number, required: true },
    total: { type: Number, default: null }, // marks out of (optional)
    classId: { type: String, default: null },
    level: { type: String, default: null },
    topic: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // flexible metadata
  },
  { timestamps: true, collection: "leaderboard" }
);

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

/* -----------------------
   Question routes (your existing ones)
   ----------------------- */

// Add a new question (create)
app.post("/api/questions", async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).json({ message: "Question added successfully", id: newQuestion._id });
  } catch (err) {
    console.error("POST /api/questions error:", err);
    res.status(500).json({ error: "Server error while adding question" });
  }
});

// Get all questions (optional filters)
app.get("/api/questions", async (req, res) => {
  try {
    const { lang = "en", topic, level, classId } = req.query;

    const query = {};
    if (topic) query.topic = topic;
    if (level) query.difficulty = level;
    if (classId) query.classId = classId;

    const questions = await Question.find(query).lean();

    const response = questions.map((q) => ({
      id: q._id,
      question: q.question_text?.[lang] || q.question_text?.en || "Question not available",
      options: Array.isArray(q.options)
        ? q.options.map((opt) => (opt?.[lang] || opt?.en || "Option not available"))
        : [],
      answer: q.correct_option_index,
      explanation: q.explanation?.[lang] || q.explanation?.en || "",
      // include any metadata you want to return
      classId: q.classId ?? null,
      level: q.difficulty ?? null,
      topic: q.topic ?? null,
    }));

    res.json(response);
  } catch (err) {
    console.error("GET /api/questions error:", err);
    res.status(500).json({ error: "Server error while fetching questions" });
  }
});

// Get 1 random question (filtered by classId/level/topic)
app.get("/api/quiz/random/:classId/:level/:topicId", async (req, res) => {
  try {
    const { classId, level, topicId } = req.params;
    const lang = req.query.lang || "en";

    const aggMatch = { };
    if (classId) aggMatch.classId = classId;
    if (level) aggMatch.difficulty = level;
    if (topicId) aggMatch.topic = topicId;

    const question = await Question.aggregate([{ $match: aggMatch }, { $sample: { size: 1 } }]);

    if (!question || question.length === 0) {
      return res.status(404).json({ error: "No questions found" });
    }

    const q = question[0];
    const response = {
      id: q._id,
      question: q.question_text?.[lang] || q.question_text?.en || "Question not available",
      options: Array.isArray(q.options) ? q.options.map((opt) => (opt?.[lang] || opt?.en || "Option not available")) : [],
      answer: q.correct_option_index,
      explanation: q.explanation?.[lang] || q.explanation?.en || "",
      classId: q.classId ?? null,
      level: q.difficulty ?? null,
      topic: q.topic ?? null,
    };

    res.json(response);
  } catch (err) {
    console.error("GET /api/quiz/random error:", err);
    res.status(500).json({ error: "Failed to fetch random question" });
  }
});

/* -----------------------
   Leaderboard API
   ----------------------- */

/**
 * POST /api/leaderboard
 * Body: { name, score (number), total (number optional), classId, level, topic, meta (optional) }
 */
app.post("/api/leaderboard", async (req, res) => {
  try {
    const { name = "Guest", score, total = null, classId = null, level = null, topic = null, meta = {} } = req.body;
    if (typeof score !== "number" || Number.isNaN(score)) {
      return res.status(400).json({ error: "score (number) is required" });
    }
    const entry = new Leaderboard({ name, score, total, classId, level, topic, meta });
    await entry.save();
    return res.status(201).json({ success: true, entry });
  } catch (err) {
    console.error("POST /api/leaderboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/leaderboard
 * Query params: classId, level, topic, limit (default 50), sortBy (score|date), order (desc|asc)
 * Returns: array of leaderboard entries
 */
app.get("/api/leaderboard", async (req, res) => {
  try {
    const { classId, level, topic, limit = 50, sortBy = "score", order = "desc" } = req.query;
    const q = {};
    if (classId) q.classId = classId;
    if (level) q.level = level;
    if (topic) q.topic = topic;

    const sortField = sortBy === "date" ? "createdAt" : "score";
    const sortOrder = order === "asc" ? 1 : -1;

    const entries = await Leaderboard.find(q)
      .sort({ [sortField]: sortOrder, createdAt: -1 })
      .limit(Math.min(200, Number(limit)))
      .lean();

    return res.json(
      entries.map((e) => ({
        id: e._id,
        name: e.name,
        score: e.score,
        total: e.total,
        classId: e.classId,
        level: e.level,
        topic: e.topic,
        meta: e.meta || {},
        date: e.createdAt,
      }))
    );
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/leaderboard/clear
 * Dangerous: clears all leaderboard entries.
 * In production, protect this route (API key / auth).
 */
app.delete("/api/leaderboard/clear", async (req, res) => {
  try {
    await Leaderboard.deleteMany({});
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/leaderboard/clear error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------
   Start server
   ----------------------- */
app.listen(port, "0.0.0.0", () => {
  console.log(` Server running at http://localhost:${port}`);
});

// optional export if you want to import Leaderboard elsewhere
module.exports = { Leaderboard };
