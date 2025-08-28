import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../styles/Questions.css";
<<<<<<< HEAD
import PuzzleGame from "./PuzzleGame";
=======
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc

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
<<<<<<< HEAD
  const [correctCount, setCorrectCount] = useState(0); // puzzle piece count
=======
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc

  const topics = [
    "Physics",
    "Chemistry",
    "Biology",
    "Earth Science",
    "Astronomy",
    "Human Body",
    "Genetics",
    "Environmental Science",
  ];
  const topic = topics[topicId] || "Physics";
<<<<<<< HEAD
  const milestones = [3, 5, 10];


=======

  const milestones = [3, 5, 10];

 
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
  useEffect(() => {
    fetch(
      `http://localhost:5000/api/questions?lang=${language}&topic=${topic}&level=${level}`
    )
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);

<<<<<<< HEAD
        const savedProgress = localStorage.getItem("quizProgress");
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
=======
        // ✅ Restore progress AFTER questions are loaded
        const savedProgress = localStorage.getItem("quizProgress");
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);

          // restore only if it matches this topic/level (optional safety)
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
          setCurrentQ(parsed.currentQ || 0);
          setAnswers(parsed.answers || {});
          setFinalScore(parsed.finalScore || 0);
          setQuizCompleted(parsed.quizCompleted || false);
<<<<<<< HEAD

      
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
=======
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
        }
      })
      .catch((err) => console.error(err));
  }, [language, topic, level]);

<<<<<<< HEAD

=======
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        "quizProgress",
        JSON.stringify({ currentQ, answers, finalScore, quizCompleted })
      );
    }
  }, [currentQ, answers, finalScore, quizCompleted, questions]);

<<<<<<< HEAD
 
  const handleAnswer = (index) => {
    if (answers[currentQ] !== undefined) return; 

    const isCorrect = questions[currentQ] && index === questions[currentQ].answer;

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
=======
  const handleAnswer = (index) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [currentQ]: index };

      const newScore = Object.keys(newAnswers).reduce((acc, qIdx) => {
        return (
          acc +
          (questions[qIdx] && newAnswers[qIdx] === questions[qIdx].answer
            ? 1
            : 0)
        );
      }, 0);

      if (milestones.includes(newScore) && newScore !== milestone) {
        setMilestone(newScore);
        setShowCongrats(true);
        setTimeout(() => setShowCongrats(false), 3000);
      }

      return newAnswers;
    });
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
<<<<<<< HEAD
      const score = Object.keys(answers).reduce(
        (acc, qIdx) =>
          acc +
          (questions[qIdx] && answers[qIdx] === questions[qIdx].answer ? 1 : 0),
        0
      );
=======
      const score = Object.keys(answers).reduce((acc, qIdx) => {
        return (
          acc +
          (questions[qIdx] && answers[qIdx] === questions[qIdx].answer ? 1 : 0)
        );
      }, 0);
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
      setFinalScore(score);
      setQuizCompleted(true);
    }
  };

  const prevQuestion = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  if (questions.length === 0) {
    return <div>Loading questions...</div>;
  }

  const selected = answers[currentQ] ?? null;

  return (
    <div className="questions-container">
<<<<<<< HEAD
=======
     
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
      <div style={{ marginBottom: "15px" }}>
        <Link
          className="back-btn"
          to={`/topics/${classId}/${level}?lang=${language}`}
<<<<<<< HEAD
          onClick={() => localStorage.removeItem("quizProgress")}
=======
          onClick={() => localStorage.removeItem("quizProgress")} // clear when going back
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
        >
          {language === "en" ? "◀️ Back to Topics" : "◀️ தலைப்புகளுக்கு பின் செல்ல"}
        </Link>
      </div>

<<<<<<< HEAD
=======
     
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
      {showCongrats && (
        <div className="congrats-popup">
          <h2>
            {language === "en"
              ? `🎉 Congratulations! You reached ${milestone} correct answers!`
              : `🎉 வாழ்த்துக்கள்! நீங்கள் ${milestone} சரியான பதில்களை பெற்றுள்ளீர்கள்!`}
          </h2>
        </div>
      )}

<<<<<<< HEAD
=======

>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
      {quizCompleted ? (
        <div className="score-card">
          <h2>
            {language === "en"
              ? `Quiz Completed! Your Score: ${finalScore}/${questions.length}`
              : `வினாடி வினா முடிந்தது! உங்கள் மதிப்பெண்: ${finalScore}/${questions.length}`}
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
<<<<<<< HEAD

  
      <PuzzleGame correctCount={correctCount} />
=======
>>>>>>> 98843956f9f3dcbbb7b9714dad0e2a7dfd5e2acc
    </div>
  );
};

export default Questions;
