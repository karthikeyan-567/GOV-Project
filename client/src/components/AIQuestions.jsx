import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../styles/Questions.css";
import PuzzleGame, { resetPuzzle } from "./PuzzleGame";


const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  "AIzaSyBRXlbxodcdlDdu53QPcvEcYpqZIzFThkI"; 

const AIQuestions = () => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const topicName = topics[Number(topicId)] || "Science";
  const milestones = [3, 5, 10];

  const progressKey = `quizAI_${classId}_${level}_${topicId}_${language}`;

 
  const fallbackQuestions = [
    {
      question: "Where does the Sun rise?",
      options: ["East", "West", "North", "South"],
      answer: 0,
      explanation: "The Sun always rises in the East.",
    },
    {
      question: "What is H2O commonly known as?",
      options: ["Water", "Oxygen", "Hydrogen", "Carbon Dioxide"],
      answer: 0,
      explanation: "H2O is the chemical formula for water.",
    },
  ];


  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(progressKey);
      if (savedProgress) {
        const { currentQ, answers, finalScore, quizCompleted, correctCount } =
          JSON.parse(savedProgress);
        setCurrentQ(currentQ);
        setAnswers(answers);
        setFinalScore(finalScore);
        setQuizCompleted(quizCompleted);
        setCorrectCount(correctCount);
      }
    } catch (e) {
      console.error("Error restoring quiz progress:", e);
    }
  }, []);

  
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          currentQ,
          answers,
          finalScore,
          quizCompleted,
          correctCount,
        })
      );
    }
  }, [currentQ, answers, finalScore, quizCompleted, questions, correctCount]);


  const fetchGeminiQuestions = async (strictTamil = false) => {
    setIsLoading(true);
    setError(null);

    const basePrompt = `
Generate exactly 10 multiple-choice quiz questions for Class ${classId}, 
Level: ${level}, Topic: ${topicName}.
Output language = ${language === "en" ? "English" : "Tamil"}.

${
  language === "ta" || strictTamil
    ? `⚠️ STRICT: ALL content must be in Tamil.
JSON example:
[{"question":"சூரியன் எங்கே உதயமாகிறது?","options":["கிழக்கு","மேற்கு","வடக்கு","தெற்கு"],"answer":0,"explanation":"சூரியன் எப்போதும் கிழக்கில் உதயமாகிறது."}]`
    : `English JSON example:
[{"question":"Where does the Sun rise?","options":["East","West","North","South"],"answer":0,"explanation":"The Sun always rises in the East."}]`
}

Only return a valid JSON array. No Markdown or code fences.
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: basePrompt }] }] }),
        }
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if ((language === "ta" || strictTamil) && /[a-zA-Z]/.test(JSON.stringify(parsed))) {
        if (!strictTamil) return fetchGeminiQuestions(true);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setQuestions(fallbackQuestions);
      } else {
        setQuestions(parsed);
        localStorage.setItem(progressKey, JSON.stringify(parsed));
      }
    } catch (err) {
      console.error("Gemini fetch error:", err);
      setError("⚠️ Using fallback questions due to API issue.");
      setQuestions(fallbackQuestions);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGeminiQuestions();
  }, [language, classId, level, topicId]);

  
  const handleAnswer = (index) => {
    if (answers[currentQ] !== undefined) return;
    const isCorrect = questions[currentQ] && index === questions[currentQ].answer;

    setAnswers((prev) => ({ ...prev, [currentQ]: index }));
    if (isCorrect) setCorrectCount((prev) => prev + 1);

    const updatedAnswers = { ...answers, [currentQ]: index };
    const newScore = Object.keys(updatedAnswers).reduce(
      (acc, qIdx) =>
        acc +
        (questions[qIdx] && updatedAnswers[qIdx] === questions[qIdx].answer ? 1 : 0),
      0
    );

    if (milestones.includes(newScore) && newScore !== milestone) {
      setMilestone(newScore);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
    }
  };

  
  const nextQuestion = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
    else {
      const score = Object.keys(answers).reduce(
        (acc, qIdx) =>
          acc + (questions[qIdx] && answers[qIdx] === questions[qIdx].answer ? 1 : 0),
        0
      );
      setFinalScore(score);
      setQuizCompleted(true);
    }
  };

  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  if (isLoading) return <div>Loading AI-generated questions...</div>;
  if (error && questions.length === 0)
    return <div className="error-message">{error}</div>;
  if (questions.length === 0) return <div>No questions available.</div>;

  const selected = answers[currentQ] ?? null;

  return (
    <div className="questions-container">
     
      <div style={{ marginBottom: "15px" }}>
        <Link
          className="back-btn"
          to={`/ai/topics/${classId}/${level}?lang=${language}`}
          onClick={() => {
            localStorage.removeItem(progressKey); 
            resetPuzzle();
            setCorrectCount(0);
          }}
        >
          {language === "en" ? "◀️ Back to Topics" : "◀️ தலைப்புகளுக்கு பின் செல்ல"}
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

      {/* Puzzle */}
      <PuzzleGame correctCount={correctCount} />
    </div>
  );
};

export default AIQuestions;
