import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";

const Questions = () => {
  const { level, topicId } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const language = query.get("lang") || "en";

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  // Map topicId to topic names (example)
  const topics = ["Physics", "Chemistry", "Biology"];
  const topic = topics[topicId] || "Physics";

  useEffect(() => {
    fetch(
      `http://localhost:5000/api/questions?lang=${language}&topic=${topic}&level=${level || "Easy"}`
    )
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
      })
      .catch((err) => console.error(err));
  }, [language, topic, level]);

  const handleAnswer = (index) => {
    setSelected(index);
    if (index === questions[currentQ].answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    setCurrentQ(currentQ + 1);
  };

  if (questions.length === 0) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="questions-container">
      {currentQ < questions.length ? (
        <div className="question-card">
          <h2>{questions[currentQ].question}</h2>
          <div className="options-container">
            {questions[currentQ].options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${
                  selected === i
                    ? i === questions[currentQ].answer
                      ? "correct"
                      : "wrong"
                    : ""
                }`}
                onClick={() => handleAnswer(i)}
              >
                {opt}
              </button>
            ))}
          </div>
          {selected !== null && (
            <button className="next-btn" onClick={nextQuestion}>
              {language === "en" ? "Next Question" : "அடுத்த கேள்வி"}
            </button>
          )}
        </div>
      ) : (
        <div className="score-card">
          <h2>
            {language === "en"
              ? `Quiz Completed! Your Score: ${score}/${questions.length}`
              : `வினாடி வினா முடிந்தது! உங்கள் மதிப்பெண்: ${score}/${questions.length}`}
          </h2>
        </div>
      )}
    </div>
  );
};

export default Questions;
