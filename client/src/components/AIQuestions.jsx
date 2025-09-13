// AIQuestions.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../styles/Questions.css";
import PuzzleGame, { resetPuzzle } from "./PuzzleGame";
import Leaderboard from "../components/Leaderboard";

/* -------------------------
   Safe env helpers (DO NOT reference bare `import` identifier)
   ------------------------- */
const safeGetImportMeta = (key) => {
  try {
    // Access import.meta.env directly inside try/catch — avoids referencing `import` identifier
    // which can trip some parsers when used with typeof import
    // eslint-disable-next-line no-undef
    return typeof import.meta !== "undefined" ? import.meta.env?.[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const safeGetProcessEnv = (key) => {
  try {
    return typeof process !== "undefined" && process.env ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const API_BASE = safeGetImportMeta("VITE_API_URL") || safeGetProcessEnv("REACT_APP_API_URL") || "http://localhost:5000";
const LEADERBOARD_API = `${API_BASE}/api/leaderboard`;
const GEMINI_API_KEY = safeGetImportMeta("VITE_GEMINI_API_KEY") || safeGetProcessEnv("VITE_GEMINI_API_KEY") || "";

/* -------------------------
   Helpers (unchanged)
   ------------------------- */

const normalizeQuestion = (raw, language = "en") => {
  const qText =
    raw.question ||
    raw.question_text?.[language] ||
    raw.question_text?.en ||
    raw.question_text ||
    raw.questionText ||
    raw.q ||
    "";

  const explanation =
    raw.explanation?.[language] ||
    raw.explanation?.en ||
    raw.explanation ||
    raw.explain ||
    "";

  const rawOptions = raw.options ?? raw.opts ?? raw.choices ?? [];
  const options = Array.isArray(rawOptions)
    ? rawOptions.map((o) => {
        if (typeof o === "string") return o;
        if (typeof o === "object") return o[language] ?? o.en ?? Object.values(o)[0] ?? "";
        return String(o);
      })
    : [];

  const answer =
    typeof raw.answer === "number"
      ? raw.answer
      : typeof raw.correct_option_index === "number"
      ? raw.correct_option_index
      : typeof raw.correct === "number"
      ? raw.correct
      : typeof raw.correctOptionIndex === "number"
      ? raw.correctOptionIndex
      : null;

  return {
    id: raw.id ?? raw._id ?? raw.qid ?? null,
    question: String(qText || ""),
    options,
    answer: typeof answer === "number" ? answer : null,
    explanation: String(explanation || ""),
  };
};

const shuffleOptionsOnce = (q) => {
  if (!q || !Array.isArray(q.options) || q.options.length === 0)
    return { ...q, answer: q.answer ?? 0 };
  const paired = q.options.map((opt, i) => ({ opt, idx: i }));
  for (let i = paired.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [paired[i], paired[j]] = [paired[j], paired[i]];
  }
  const newOptions = paired.map((p) => p.opt);
  const newAnswer = paired.findIndex((p) => p.idx === (q.answer ?? 0));
  return { ...q, options: newOptions, answer: newAnswer >= 0 ? newAnswer : 0 };
};

const ensureN = (arr, fallback, n = 15, language = "en") => {
  const out = arr.slice(0, n);
  if (out.length >= n) return out;
  const need = n - out.length;
  const extras = fallback.slice(0, need).map((r) => {
    const norm = normalizeQuestion(r, language);
    return shuffleOptionsOnce(norm);
  });
  return [...out, ...extras];
};

const tryParseJsonFromText = (text) => {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    const m = text.match(/(\[.*\])/s);
    if (m) {
      try {
        return JSON.parse(m[1]);
      } catch (e2) {
        console.warn("Extracted JSON parse failed:", e2);
        return null;
      }
    }
    return null;
  }
};

/* -------------------------
   Component
   ------------------------- */

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
  const [source, setSource] = useState("");
  const [timeLeft, setTimeLeft] = useState(900);

  // leaderboard UI state:
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [attemptSaved, setAttemptSaved] = useState(false); // prevent double saves

  // store player's name locally for leaderboard entries
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem("playerName") || "";
    } catch (e) {
      return "";
    }
  });

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
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Mars", "Venus", "Jupiter", "Saturn"],
      answer: 0,
      explanation: "Mars is called the Red Planet due to iron oxide dust.",
    },
  ];

  /* -------------------------
     Data loaders
     ------------------------- */

  const fetchDBQuestions = async () => {
    const apiUrl = `${API_BASE}/api/questions?lang=${language}&topic=${encodeURIComponent(
      topicName
    )}&level=${level}`;
    setError(null);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`DB status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("Empty DB response");
      const normalized = data.map((r) => shuffleOptionsOnce(normalizeQuestion(r, language)));
      const final = ensureN(normalized, fallbackQuestions, 15, language);
      try {
        localStorage.setItem(`${progressKey}_cache`, JSON.stringify(final));
      } catch (e) {}
      setSource("Database");
      return final;
    } catch (err) {
      console.warn("DB fetch failed:", err);
      setError((prev) => (prev ? prev + " | DB failed" : `DB fetch failed: ${err.message}`));
      try {
        const cached = localStorage.getItem(`${progressKey}_cache`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length) {
            setSource("DB Cache");
            return parsed;
          }
        }
      } catch (e) {}
      throw err;
    }
  };

  const fetchGeminiQuestions = async () => {
    if (!GEMINI_API_KEY) throw new Error("No Gemini API key configured");
    const prompt = `
Generate exactly 15 multiple-choice questions for Class ${classId}, Level ${level}, Topic ${topicName}.
Return a JSON array of objects: { "question": "...", "options": ["..."], "answer": 0, "explanation": "..." }.
Only return JSON if possible; if extra text included, we will extract the JSON array.
Language: ${language === "en" ? "English" : "Tamil"}.
`;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!resp.ok) throw new Error(`Gemini status ${resp.status}`);
      const json = await resp.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = tryParseJsonFromText(text);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("AI returned no questions");
      const normalized = parsed.map((r) => shuffleOptionsOnce(normalizeQuestion(r, language)));
      const final = ensureN(normalized, fallbackQuestions, 15, language);
      setSource("AI");
      return final;
    } catch (err) {
      console.warn("Gemini fetch failed:", err);
      setError((prev) => (prev ? prev + " | AI failed" : `AI fetch failed: ${err.message}`));
      throw err;
    }
  };

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let setFrom = "Database";
      let final;
      try {
        final = await fetchDBQuestions();
      } catch (dbErr) {
        if (GEMINI_API_KEY) {
          try {
            final = await fetchGeminiQuestions();
            setFrom = "AI";
          } catch (aiErr) {
            final = ensureN([], fallbackQuestions, 15, language);
            setFrom = "Fallback";
          }
        } else {
          final = ensureN([], fallbackQuestions, 15, language);
          setFrom = "Fallback";
        }
      }
      setQuestions(final);
      setSource(setFrom);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------
     On-mount restore or load
     ------------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem(progressKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              const restored = parsed.questions.map((q) => {
                const opts = Array.isArray(q.options) ? q.options : [];
                const ans = typeof q.answer === "number" ? q.answer : 0;
                return {
                  id: q.id ?? null,
                  question: q.question ?? "",
                  options: opts,
                  answer: ans,
                  explanation: q.explanation ?? "",
                };
              });
              if (!mounted) return;
              setQuestions(restored);
              setAnswers(parsed.answers || {});
              setCurrentQ(parsed.currentQ ?? 0);
              setCorrectCount(parsed.correctCount ?? 0);
              setQuizCompleted(parsed.quizCompleted ?? false);
              setFinalScore(parsed.finalScore ?? 0);
              if (typeof parsed.timeLeft === "number") setTimeLeft(parsed.timeLeft);
              setSource(parsed.source ?? "Saved");
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Saved progress parse failed:", e);
          }
        }
        await loadQuestions();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, classId, level, topicId]);

  /* -------------------------
     Persist progress
     ------------------------- */
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    try {
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          questions,
          answers,
          currentQ,
          correctCount,
          quizCompleted,
          finalScore,
          timeLeft,
          source,
        })
      );
    } catch (e) {
      console.warn("Failed to persist progress:", e);
    }
  }, [questions, answers, currentQ, correctCount, quizCompleted, finalScore, timeLeft, source]);

  /* -------------------------
     Timer / quiz logic
     ------------------------- */
  useEffect(() => {
    if (quizCompleted) return;
    if (timeLeft <= 0) {
      finishQuiz();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizCompleted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* -------------------------
     Leaderboard saveAttempt
     ------------------------- */
  const LEADERBOARD_KEY = `${progressKey}_leaderboard`;

  const saveAttempt = async (score) => {
    if (attemptSaved) return { ok: true, note: "already-saved" };
    const payload = {
      name: playerName || localStorage.getItem("playerName") || "Guest",
      score,
      total: questions?.length ?? null,
      classId: classId ?? null,
      level: level ?? null,
      topic: topicName ?? null,
      meta: {
        answers,
        questionIds: questions.map((q) => q.id ?? null),
        source,
        timeLeft,
      },
    };

    try {
      const res = await fetch(LEADERBOARD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();

      try {
        const raw = localStorage.getItem(LEADERBOARD_KEY) || "[]";
        let arr;
        try {
          arr = JSON.parse(raw);
        } catch (e) {
          arr = [];
        }
        if (!Array.isArray(arr)) arr = [];
        arr.push({ ...payload, date: new Date().toISOString(), fromServer: true, serverEntry: json.entry ?? json });
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(arr.slice(-500)));
      } catch (e) {
        console.warn("Local save after server success failed:", e);
      }

      setAttemptSaved(true);
      return { ok: true, source: "server", data: json };
    } catch (err) {
      console.warn("Leaderboard server save failed, falling back to localStorage:", err);
      try {
        const raw = localStorage.getItem(LEADERBOARD_KEY) || "[]";
        let arr;
        try {
          arr = JSON.parse(raw);
        } catch (e) {
          arr = [];
        }
        if (!Array.isArray(arr)) arr = [];
        const entry = { ...payload, date: new Date().toISOString(), fromServer: false };
        arr.push(entry);
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(arr.slice(-500)));
        setAttemptSaved(true);
        return { ok: true, source: "local", entry };
      } catch (e2) {
        console.error("Local fallback save failed:", e2);
        return { ok: false, error: e2 };
      }
    }
  };

  /* -------------------------
     Answer & navigation handlers
     ------------------------- */
  const handleAnswer = (index) => {
    if (answers[currentQ] !== undefined) return;
    const isCorrect = index === questions[currentQ].answer;
    const updatedAnswers = { ...answers, [currentQ]: index };
    setAnswers(updatedAnswers);
    if (isCorrect) setCorrectCount((c) => c + 1);

    const newScore = Object.keys(updatedAnswers).reduce(
      (acc, qIdx) => acc + (questions[qIdx] && updatedAnswers[qIdx] === questions[qIdx].answer ? 1 : 0),
      0
    );
    if (milestones.includes(newScore) && newScore !== milestone) {
      setMilestone(newScore);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 4000);
    }
  };

  const finishQuiz = async () => {
    const score = Object.keys(answers).reduce(
      (acc, qIdx) => acc + (questions[qIdx] && answers[qIdx] === questions[qIdx].answer ? 1 : 0),
      0
    );
    setFinalScore(score);

    try {
      await saveAttempt(score);
    } catch (e) {
      console.warn("Error saving attempt:", e);
    }

    setQuizCompleted(true);
    setShowLeaderboard(true);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) setCurrentQ((s) => s + 1);
    else finishQuiz();
  };
  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ((s) => s - 1);
  };

  /* -------------------------
     Persist player name
     ------------------------- */
  useEffect(() => {
    try {
      if (playerName !== "") localStorage.setItem("playerName", playerName);
    } catch (e) {}
  }, [playerName]);

  /* -------------------------
     Render
     ------------------------- */
  if (isLoading) return <div>Loading questions...</div>;
  if (!questions || questions.length === 0) return <div>{error ?? "No questions available."}</div>;

  const selected = answers[currentQ] ?? null;

  return (
    <div className="questions-container">
      <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <Link
            className="back-btn"
            to={`/ai/topics/${classId}/${level}?lang=${language}`}
            onClick={() => {
              try {
                localStorage.removeItem(progressKey);
              } catch (e) {}
              resetPuzzle();
              setCorrectCount(0);
            }}
          >
            {language === "en" ? "◀️ Back to Topics" : "◀️ தலைப்புகளுக்கு பின் செல்ல"}
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 14 }}>Name:</label>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter name (optional)"
            style={{ padding: "6px 8px", borderRadius: 6 }}
          />
          <button
            className="start-btn"
            onClick={() => setShowLeaderboard(true)}
          >
            🏆 View Leaderboard
          </button>
        </div>
      </div>

      <div className="quiz-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p className="source-label">📌 Source: <strong>{source}</strong></p>
        <p className="timer">⏳ {formatTime(timeLeft)}</p>
      </div>

      {/* congrats/confetti */}
      {showCongrats && (
        <>
          <div className="congrats-overlay" aria-hidden="true" />
          <div className="congrats-popup" role="status" aria-live="polite">
            <div className="congrats-content">
              <h2>
                {language === "en"
                  ? `🎉 Congratulations! You reached ${milestone} correct answers!`
                  : `🎉 வாழ்த்துக்கள்! நீங்கள் ${milestone} சரியான பதில்களை பெற்றுள்ளீர்கள்!`}
              </h2>
            </div>
          </div>
          <div className="full-confetti" aria-hidden="true">
            {Array.from({ length: 80 }).map((_, i) => {
              const emojis = ["🎉","✨","🎊","🎈","🌟","👏","🏆","🥳","🎯","💥"];
              const emoji = emojis[Math.floor(Math.random() * emojis.length)];
              const spawn = Math.random() < 0.6 ? "top" : Math.random() < 0.5 ? "left" : "right";
              const x = Math.random() * 100;
              const delay = (Math.random() * 0.9).toFixed(2) + "s";
              const duration = (2.6 + Math.random() * 1.2).toFixed(2) + "s";
              const tx = (Math.random() * 120 - 60).toFixed(0) + "px";
              const scale = (0.7 + Math.random() * 0.9).toFixed(2);
              const rotate = Math.floor(Math.random() * 720) + "deg";
              const style =
                spawn === "top"
                  ? { left: `${x}%`, animationDelay: delay, animationDuration: duration, transform: `translateY(-20px) rotate(0deg) scale(${scale})`, ["--tx"]: tx, ["--rotateEnd"]: rotate }
                  : spawn === "left"
                  ? { left: `-6%`, top: `${20 + Math.random() * 40}%`, animationDelay: delay, animationDuration: duration, transform: `translateY(0) translateX(0) rotate(0deg) scale(${scale})`, ["--tx"]: (Math.random() * 80 + 60).toFixed(0) + "px", ["--rotateEnd"]: rotate }
                  : { right: `-6%`, top: `${10 + Math.random() * 50}%`, animationDelay: delay, animationDuration: duration, transform: `translateY(0) translateX(0) rotate(0deg) scale(${scale})`, ["--tx"]: -((Math.random() * 80 + 60).toFixed(0)) + "px", ["--rotateEnd"]: rotate };
              return <span key={`conf-${i}-${spawn}`} className={`confetti-piece confetti-${spawn}`} style={style}>{emoji}</span>;
            })}
          </div>
        </>
      )}

      {quizCompleted ? (
        <div className="score-card">
          <h2>
            {language === "en"
              ? `Quiz Completed! Your Score: ${finalScore}/${questions.length}`
              : `வினாடி வினா முடிந்தது! உங்கள் மதிப்பெண்: ${finalScore}/${questions.length}`}
          </h2>

          <div className="score-actions">
            <button
              className="start-btn"
              onClick={() => {
                setQuizCompleted(false);
                setAnswers({});
                setFinalScore(0);
                setCorrectCount(0);
                setCurrentQ(0);
                setAttemptSaved(false);
                loadQuestions();
              }}
            >
              {language === "en" ? "Try Again" : "மீண்டும் முயற்சி செய்"}
            </button>

            <button
              className="reset-btn"
              onClick={() => {
                try {
                  localStorage.removeItem(progressKey);
                } catch (e) {}
                resetPuzzle();
                setCorrectCount(0);
                window.location.href = `/ai/topics/${classId}/${level}?lang=${language}`;
              }}
            >
              {language === "en" ? "Change Settings" : "விருப்பங்களை மாற்று"}
            </button>

            <button className="start-btn" onClick={() => setShowLeaderboard(true)}>
              {language === "en" ? "View Leaderboard" : "முன்னணி பட்டியல்"}
            </button>
          </div>

          <Leaderboard
            storageKey={`${progressKey}_leaderboard`}
            open={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            title={`${topicName} Leaderboard`}
            maxEntries={200}
            allowClear={true}
          />
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
                <button className="prev-btn" onClick={prevQuestion} disabled={currentQ === 0}>
                  {language === "en" ? "⬅️ Previous" : "⬅️ முந்தையது"}
                </button>
                <button className="next-btn" onClick={nextQuestion}>
                  {currentQ === questions.length - 1 ? (language === "en" ? "Finish ✅" : "முடி ✅") : (language === "en" ? "Next ➡️" : "அடுத்தது ➡️")}
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

export default AIQuestions;
