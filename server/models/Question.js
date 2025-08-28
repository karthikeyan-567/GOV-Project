const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  classId: String,
  topic: String,
  difficulty: String,
  question_text: {
    en: String,
    ta: String
  },
  options: [
    {
      en: String,
      ta: String
    }
  ],
  correct_option_index: Number,
  explanation: {
    en: String,
    ta: String
  }
});

module.exports = mongoose.model("Question", questionSchema);
