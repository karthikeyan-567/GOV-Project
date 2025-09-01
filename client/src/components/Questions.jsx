import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../styles/Questions.css";
import PuzzleGame from "./PuzzleGame";

const Questions = () => {
  const { classId, level, topicId } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const language = query.get("lang") || "en";

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [milestone, setMilestone] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const topics = [
    "Physics",
    "Chemistry",
    "Biology",
    "General Knowledge",
    "Astronomy",
    "Human Body",
    "Genetics",
    "Environmental Science",
  ];
  const topic = topics[topicId] || "Physics";
  const milestones = [3, 5, 10];

  // Fetch questions from API
  useEffect(() => {
    fetch(
      `http://192.168.1.35:5000/api/questions?lang=${language}&topic=${topic}&level=${level}`
    )
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);

        const savedProgress = localStorage.getItem("quizProgress");
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          setCurrentQ(parsed.currentQ || 0);
          setAnswers(parsed.answers || {});
          setFinalScore(parsed.finalScore || 0);
          setQuizCompleted(parsed.quizCompleted || false);

          const savedCorrect = Object.keys(parsed.answers || {}).reduce(
            (acc, qIdx) =>
              acc +
              (data[qIdx] &&
              parsed.answers[qIdx] === data[qIdx].answer
                ? 1
                : 0),
            0
          );
          setCorrectCount(savedCorrect);
        }
      })
      .catch((err) => console.error(err));
  }, [language, topic, level]);

  // Save progress
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        "quizProgress",
        JSON.stringify({ currentQ, answers, finalScore, quizCompleted })
      );
    }
  }, [currentQ, answers, finalScore, quizCompleted, questions]);

  // Handle answer selection
  const handleAnswer = (index) => {
    if (answers[currentQ] !== undefined) return;

    const isCorrect =
      questions[currentQ] && index === questions[currentQ].answer;

    setAnswers((prev) => ({ ...prev, [currentQ]: index }));

    if (isCorrect) {
      setCorrectCount((prevCount) => prevCount + 1);
    }

    const newScore = Object.keys({ ...answers, [currentQ]: index }).reduce(
      (acc, qIdx) =>
        acc +
        (questions[qIdx] &&
        { ...answers, [currentQ]: index }[qIdx] === questions[qIdx].answer
          ? 1
          : 0),
      0
    );

    if (milestones.includes(newScore) && newScore !== milestone) {
      setMilestone(newScore);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
    }
  };

  // Navigation
  const nextQuestion = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };
  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  // Submit handler: calculates score only for attempted questions
  const handleSubmit = () => {
    const attemptedScore = Object.keys(answers).reduce((acc, qIdx) => {
      if (questions[qIdx] && answers[qIdx] !== undefined) {
        return acc + (answers[qIdx] === questions[qIdx].answer ? 1 : 0);
      }
      return acc;
    }, 0);

    setFinalScore(attemptedScore);
    setQuizCompleted(true);
  };

  if (questions.length === 0) return <div>Loading questions...</div>;

  const selected = answers[currentQ] ?? null;

  return (
    <div className="questions-container">
      <div style={{ marginBottom: "15px" }}>
        <Link
          className="back-btn"
          to={`${
            location.pathname.startsWith("/db") ? "/db" : "/ai"
          }/topics/${classId}/${level}?lang=${language}`}
          onClick={() => {
            localStorage.removeItem("quizProgress");
            localStorage.removeItem("puzzle_imageIndex");
            localStorage.removeItem("puzzle_progress");
            localStorage.removeItem("puzzle_lastCount");
          }}
        >
          {language === "en"
            ? "◀️ Back to Topics"
            : "◀️ தலைப்புகளுக்கு பின் செல்ல"}
        </Link>
      </div>

      {showCongrats && (
        <div className="congrats-popup">
          <h2>
            {language === "en"
              ? `🎉 Congratulations! You reached ${milestone} correct answers!`
              : `🎉 வாழ்த்துக்கள்! நீங்கள் ${milestone} சரியான பதில்களை பெற்றுள்ளீர்கள்!`}
          </h2>
        </div>
      )}

      {quizCompleted ? (
        <div className="score-card">
          <h2>
            {language === "en"
              ? `Quiz Completed! Score: ${finalScore}/${Object.keys(answers).length} attempted`
              : `வினாடி வினா முடிந்தது! உங்கள் மதிப்பெண்: ${finalScore}/${Object.keys(answers).length} முயற்சித்தது`}
          </h2>
        </div>
      ) : (
        <div className="question-card">
          <h2>{questions[currentQ].question}</h2>

          <div className="options-container">
            {questions[currentQ].options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${
                  selected !== null
                    ? i === questions[currentQ].answer
                      ? "correct"
                      : selected === i
                      ? "wrong"
                      : ""
                    : ""
                }`}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
              >
                {opt}
              </button>
            ))}
          </div>

          {selected !== null && (
            <div>
              <p className="explanation">{questions[currentQ].explanation}</p>
              <div className="nav-buttons">
                <button
                  className="prev-btn"
                  onClick={prevQuestion}
                  disabled={currentQ === 0}
                >
                  {language === "en" ? "⬅️ Previous" : "⬅️ முந்தையது"}
                </button>

                <button className="submit-btn" onClick={handleSubmit}>
                  {language === "en" ? "Submit 📝" : "சமர்ப்பிக்க 📝"}
                </button>

                <button className="next-btn" onClick={nextQuestion}>
                  {currentQ === questions.length - 1
                    ? language === "en"
                      ? "Finish ✅"
                      : "முடி ✅"
                    : language === "en"
                    ? "Next ➡️"
                    : "அடுத்தது ➡️"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <PuzzleGame correctCount={correctCount} />
    </div>
  );
};

export default Questions;
