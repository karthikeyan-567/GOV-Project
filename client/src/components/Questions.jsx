// src/components/Questions.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../styles/Questions.css";
import PuzzleGame from "./PuzzleGame";
import Leaderboard from "../components/Leaderboard";

const Questions = () => {
  const { classId, level, topicId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const language = query.get("lang") || "en";

  // core state
  const [fetchedQuestions, setFetchedQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [milestone, setMilestone] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [playerName, setPlayerName] = useState("");

  // restoration helper: store found restore key (if any) on mount
  const [restoreKey, setRestoreKey] = useState(null);

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

  // puzzle/local keys used in this app
  const PUZZLE_KEYS = [
    "puzzle_imageIndex",
    "puzzle_progress",
    "puzzle_lastCount",
    "puzzlePiecesState",
    "progress",
    "imageIndex",
    "puzzleProgress",
  ];
  const SAVED_NAME_KEY = "playerName";

  // Utility: shuffle array (Fisher-Yates)
  const shuffleArray = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Build the prefix used for quizProgress keys for this quiz context
  const quizPrefix = `quizProgress_${classId}_${level}_${topicId}_${language}_`;

  // ---------- FIXED: safe API base + leaderboard state ----------
  // NOTE: do NOT use "typeof import" (invalid). We check import.meta safely.
  const getApiBase = () => {
    try {
      // Vite provides import.meta.env at build time. This reference is fine.
      // We only access import.meta inside a try so environments that don't support it won't crash during runtime checks.
      // eslint-disable-next-line no-undef
      if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
    } catch (e) {
      // ignore if import.meta isn't available in this runtime
    }

    // CRA-style fallback
    try {
      if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
    } catch (e) {
      // ignore
    }

    // default
    return "http://localhost:5000";
  };

  const API_BASE = getApiBase();
  const LEADERBOARD_API = `${API_BASE}/api/leaderboard`;
  const LEADERBOARD_KEY = `${quizPrefix}leaderboard`;

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // -------------------------------------------------------

  // -------------------------
  // CLEAR PROGRESS helper
  // -------------------------
  const clearProgress = () => {
    try {
      // Remove any dynamic quizProgress keys matching this quiz context (different totals)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(quizPrefix)) {
          localStorage.removeItem(key);
          // restart scanning since localStorage length changed
          i = -1;
          continue;
        }
      }

      // Remove puzzle keys explicitly
      PUZZLE_KEYS.forEach((k) => {
        if (localStorage.getItem(k) !== null) localStorage.removeItem(k);
      });

      // Additional legacy keys used in other files (defensive)
      const LEGACY = ["quizProgress", "puzzleKey", "puzzlePiecesState", "lastQuizKey"];
      LEGACY.forEach((k) => {
        if (localStorage.getItem(k) !== null) localStorage.removeItem(k);
      });
      // Optionally keep playerName; comment out next line if you want name cleared
      // localStorage.removeItem(SAVED_NAME_KEY);
    } catch (e) {
      console.warn("clearProgress error:", e);
    }
  };

  // -------------------------
  // Detect any saved quiz key for this context (on mount)
  // -------------------------
  useEffect(() => {
    const prefix = quizPrefix;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        setRestoreKey(key);
        // parse totalQuestions from key suffix if present
        const parts = key.split("_");
        const maybeTotal = parts[parts.length - 1];
        const n = Number(maybeTotal);
        if (!Number.isNaN(n) && n > 0) setTotalQuestions(n);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // -------------------------
  // Fetch questions from API
  // -------------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const apiUrl = `${API_BASE}/api/questions?lang=${language}&topic=${encodeURIComponent(
          topic
        )}&level=${level}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (!mounted) return;
        setFetchedQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch questions error:", err);
        setFetchedQuestions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE, language, topic, level, classId, topicId]);

  // -------------------------
  // Load saved player name
  // -------------------------
  useEffect(() => {
    const stored = localStorage.getItem(SAVED_NAME_KEY);
    if (stored) setPlayerName(stored);
  }, []);

  // -------------------------
  // Prepare questions pool OR restore saved quiz after fetch (restoreKey)
  // -------------------------
  useEffect(() => {
    if (!fetchedQuestions || fetchedQuestions.length === 0) {
      setQuestions([]);
      return;
    }

    // If a restoreKey exists, attempt to restore exact saved question order and answers
    if (restoreKey) {
      try {
        const raw = localStorage.getItem(restoreKey);
        if (raw) {
          const payload = JSON.parse(raw);
          const savedIds = Array.isArray(payload.questionIds) ? payload.questionIds : null;
          if (savedIds && savedIds.length > 0) {
            // Map fetched questions by id or qid
            const idToQ = new Map();
            fetchedQuestions.forEach((q) => {
              const id = q.id ?? q.qid ?? q._id ?? null;
              if (id != null) idToQ.set(String(id), q);
            });

            const ordered = [];
            let allFound = true;
            for (const sid of savedIds) {
              const q = idToQ.get(String(sid));
              if (!q) {
                allFound = false;
                break;
              }
              ordered.push(q);
            }

            if (allFound) {
              // Restore exact saved order + metadata
              setQuestions(ordered);
              setStarted(true);
              setCurrentQ(payload.currentQ ?? 0);
              setAnswers(payload.answers ?? {});
              setFinalScore(payload.finalScore ?? 0);
              setQuizCompleted(payload.quizCompleted ?? false);

              // compute correctCount from restored answers
              const savedCorrect = Object.keys(payload.answers || {}).reduce((acc, qIdx) => {
                const idx = Number(qIdx);
                const q = ordered[idx];
                if (!q || payload.answers[qIdx] === undefined) return acc;
                const correctIndex = q.correct_option_index ?? q.correctOptionIndex ?? q.answer ?? q.correct ?? null;
                return acc + (payload.answers[qIdx] === correctIndex ? 1 : 0);
              }, 0);
              setCorrectCount(savedCorrect);
              return; // restored — skip normal prepare
            } else {
              // saved ids didn't match current fetched pool — discard saved key
              try {
                localStorage.removeItem(restoreKey);
              } catch (e) {}
              setRestoreKey(null);
            }
          } else {
            // invalid payload: remove
            try {
              localStorage.removeItem(restoreKey);
            } catch (e) {}
            setRestoreKey(null);
          }
        } else {
          setRestoreKey(null);
        }
      } catch (e) {
        console.error("Error restoring saved quiz:", e);
        try {
          localStorage.removeItem(restoreKey);
        } catch (er) {}
        setRestoreKey(null);
      }
    }

    // Not restored -> prepare new question set (shuffle + slice) only when not started
    if (!started) {
      const shuffled = shuffleArray(fetchedQuestions);
      const sliceCount = Math.min(totalQuestions, shuffled.length);
      setQuestions(shuffled.slice(0, sliceCount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedQuestions, restoreKey]);

  // -------------------------
  // Persist progress (key includes questions.length)
  // -------------------------
  useEffect(() => {
    if (questions.length === 0) return;
    const quizKey = `quizProgress_${classId}_${level}_${topicId}_${language}_${questions.length}`;
    const questionIds = questions.map((q) => q.id ?? q.qid ?? q._id ?? null);
    const payload = {
      currentQ,
      answers,
      finalScore,
      quizCompleted,
      questionIds,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(quizKey, JSON.stringify(payload));
    } catch (e) {
      console.warn("Unable to persist quiz progress", e);
    }
  }, [currentQ, answers, finalScore, quizCompleted, questions, classId, level, topicId, language]);

  // -------------------------
  // Recompute correctCount when answers change
  // -------------------------
  useEffect(() => {
    if (questions.length === 0) return;
    const correct = Object.keys(answers).reduce((acc, qIdx) => {
      const idx = Number(qIdx);
      const q = questions[idx];
      if (!q || answers[qIdx] === undefined) return acc;
      const correctIndex = q.correct_option_index ?? q.correctOptionIndex ?? q.answer ?? q.correct ?? null;
      return acc + (answers[qIdx] === correctIndex ? 1 : 0);
    }, 0);
    setCorrectCount(correct);
  }, [answers, questions]);

  // -------------------------
  // Option text helper (supports string or {en,ta} objects)
  // -------------------------
  const optionText = (opt) => {
    if (opt == null) return "";
    if (typeof opt === "string") return opt;
    if (typeof opt === "object") {
      if (language === "ta" && (opt.ta || opt.tamil)) return opt.ta || opt.tamil;
      return opt.en ?? Object.values(opt)[0];
    }
    return String(opt);
  };

  // -------------------------
  // ADD: saveAttempt (send to server, fallback to localStorage)
  // -------------------------
  const saveAttempt = async (score) => {
    const payload = {
      name: playerName || "Guest",
      score,
      total: questions?.length ?? totalQuestions ?? null,
      classId: classId ?? null,
      level: level ?? null,
      topic: topic ?? null,
      meta: { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown" },
    };

    try {
      const res = await fetch(LEADERBOARD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      console.log("Leaderboard saved to server:", json.entry ?? json);

      // keep a local copy for quick display/offline
      try {
        const raw = localStorage.getItem(LEADERBOARD_KEY) || "[]";
        let arr;
        try { arr = JSON.parse(raw); } catch (e) { arr = []; }
        if (!Array.isArray(arr)) arr = [];
        arr.push({ ...payload, date: new Date().toISOString(), fromServer: true });
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(arr.slice(-500)));
      } catch (e) {
        console.warn("Local save after server success failed:", e);
      }

      return { ok: true, source: "server", data: json };
    } catch (err) {
      console.warn("Leaderboard server save failed, falling back to localStorage:", err);
      try {
        const raw = localStorage.getItem(LEADERBOARD_KEY) || "[]";
        let arr;
        try { arr = JSON.parse(raw); } catch (e) { arr = []; }
        if (!Array.isArray(arr)) arr = [];
        const entry = { ...payload, date: new Date().toISOString(), fromServer: false };
        arr.push(entry);
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(arr.slice(-500)));
        return { ok: true, source: "local", entry };
      } catch (e2) {
        console.error("Local fallback save failed:", e2);
        return { ok: false, error: e2 };
      }
    }
  };
  // -------------------------

  // -------------------------
  // Answer handler
  // -------------------------
  const handleAnswer = (index) => {
    if (answers[currentQ] !== undefined) return;
    const q = questions[currentQ];
    if (!q) return;

    // canonical correct index prop (several variants)
    const correctIndex = q.correct_option_index ?? q.correctOptionIndex ?? q.answer ?? q.correct ?? null;

    setAnswers((prev) => ({ ...prev, [currentQ]: index }));

    const isCorrect = index === correctIndex;
    if (isCorrect) {
      const updated = { ...answers, [currentQ]: index };
      const newScore = Object.keys(updated).reduce((acc, qIdx) => {
        const idx = Number(qIdx);
        const qq = questions[idx];
        if (!qq || updated[qIdx] === undefined) return acc;
        const ci = qq.correct_option_index ?? qq.correctOptionIndex ?? qq.answer ?? qq.correct ?? null;
        return acc + (updated[qIdx] === ci ? 1 : 0);
      }, 0);

      if (milestones.includes(newScore) && newScore !== milestone) {
        setMilestone(newScore);
        setShowCongrats(true);
        // <-- changed to 4 seconds
        setTimeout(() => setShowCongrats(false), 4000);
      }
    }
  };

  // -------------------------
  // Navigation handlers
  // -------------------------
  const nextQuestion = () => {
    if (currentQ < questions.length - 1) setCurrentQ((s) => s + 1);
  };
  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ((s) => s - 1);
  };

  // -------------------------
  // REPLACE: handleSubmit now saves attempt and opens leaderboard
  // -------------------------
  const handleSubmit = async () => {
    const attemptedScore = Object.keys(answers).reduce((acc, qIdx) => {
      const idx = Number(qIdx);
      const q = questions[idx];
      if (!q || answers[qIdx] === undefined) return acc;
      const ci = q.correct_option_index ?? q.correctOptionIndex ?? q.answer ?? q.correct ?? null;
      return acc + (answers[qIdx] === ci ? 1 : 0);
    }, 0);
    setFinalScore(attemptedScore);
    setQuizCompleted(true);

    // save to leaderboard (server first, fallback local)
    try {
      await saveAttempt(attemptedScore);
    } catch (e) {
      console.warn("Error saving attempt:", e);
    }

    // open leaderboard automatically after submit
    setShowLeaderboard(true);
  };
  // -------------------------

  // -------------------------
  // Start / Reset quiz
  // -------------------------
  const handleStart = () => {
    if (!fetchedQuestions || fetchedQuestions.length === 0) return;
    const shuffled = shuffleArray(fetchedQuestions);
    const sliceCount = Math.min(totalQuestions, shuffled.length);
    setQuestions(shuffled.slice(0, sliceCount));
    setStarted(true);
    setCurrentQ(0);
    setAnswers({});
    setFinalScore(0);
    setQuizCompleted(false);
    setMilestone(null);
    setShowCongrats(false);
    if (playerName) localStorage.setItem(SAVED_NAME_KEY, playerName);
  };

  const handleReset = () => {
    setStarted(false);
    setQuestions([]);
    setAnswers({});
    setCurrentQ(0);
    setFinalScore(0);
    setQuizCompleted(false);
    setMilestone(null);
    setShowCongrats(false);
    setCorrectCount(0);
    // remove any saved quizProgress keys for this context
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(quizPrefix)) {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
        i = -1;
      }
    }
    setRestoreKey(null);
  };

  // -------------------------
  // Auto-clear when navigating to topics path (defensive)
  // -------------------------
  useEffect(() => {
    if (location.pathname.includes("/topics/")) {
      // user landed on topics; clear all quiz/puzzle for this context
      clearProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // -------------------------
  // UI: pre-start selection
  // -------------------------
  if (!started) {
    const max = fetchedQuestions.length || 0;
    const optionsArr = [10, 15, 20, 25, 30].filter((n) => n <= max);
    if (max > 0 && !optionsArr.includes(max)) optionsArr.push(max);
    if (optionsArr.length === 0) optionsArr.push(10);

    return (
      <div className="questions-container">
        <div className="top-row">
          <div className="player-input">
            <label>Player:</label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter name (optional)"
            />
          </div>

          <Link
            className="back-btn"
            to={`${
              location.pathname.startsWith("/db") ? "/db" : "/ai"
            }/topics/${classId}/${level}?lang=${language}`}
            onClick={() => {
              // clear progress for this quiz context when user intentionally goes back
              clearProgress();
            }}
          >
            {language === "en" ? "◀ Back to Topics" : "◀ தலைப்புகளுக்கு பின் செல்ல"}
          </Link>
        </div>

        <div className="selection-card">
          <h3>
            {language === "en"
              ? `Choose number of questions (max ${fetchedQuestions.length})`
              : `வினாக்களின் எண்ணிக்கையை தேர்வு செய்க (${fetchedQuestions.length} வரை)`}
          </h3>

          <div className="selection-options">
            {optionsArr.map((opt) => (
              <button
                key={opt}
                className={`select-btn ${totalQuestions === opt ? "active" : ""}`}
                onClick={() => setTotalQuestions(opt)}
              >
                {opt === fetchedQuestions.length ? `${opt} (All)` : opt}
              </button>
            ))}
          </div>

          <div className="selection-actions">
            <button className="start-btn" onClick={handleStart}>
              {language === "en" ? "Start Quiz" : "வினாடி வினா தொடங்கு"}
            </button>
            <button
              className="reset-btn"
              onClick={() => {
                // remove saved progress for this quiz context only
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith(quizPrefix)) {
                    try {
                      localStorage.removeItem(key);
                    } catch (e) {}
                    i = -1;
                  }
                }
                setAnswers({});
                setCurrentQ(0);
              }}
            >
              {language === "en" ? "Reset Saved Progress" : "முந்தைய முன்னேற்றத்தை சுத்தம் செய்க"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------
  // UI: quiz in progress / completed
  // -------------------------
  if (questions.length === 0) return <div className="loading">No questions available.</div>;

  const q = questions[currentQ];
  const correctIndex = q?.correct_option_index ?? q?.correctOptionIndex ?? q?.answer ?? q?.correct ?? null;
  const selected = answers[currentQ] ?? null;

  return (
    <div className="questions-container">
      <div className="top-row">
        <div className="player-info">
          <strong>Player:</strong> {playerName || "Guest"}{" "}
          <span className="progress">
            {" | "}
            {language === "en" ? `Question ${currentQ + 1}/${questions.length}` : `வினா ${currentQ + 1}/${questions.length}`}
          </span>
        </div>

        <Link
          className="back-btn"
          to={`${
            location.pathname.startsWith("/db") ? "/db" : "/ai"
          }/topics/${classId}/${level}?lang=${language}`}
          onClick={() => {
            // user intentionally goes back: clear progress & puzzle keys
            clearProgress();
          }}
        >
          {language === "en" ? "◀ Back to Topics" : "◀ தலைப்புகளுக்கு பின் செல்ல"}
        </Link>
      </div>

      {/* ===== Full-screen confetti + popup (shows when showCongrats=true) ===== */}
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
              const duration = (3.6 + Math.random() * 1.4).toFixed(2) + "s"; // longer to match 4s popup
              const tx = (Math.random() * 160 - 80).toFixed(0) + "px";
              const scale = (0.7 + Math.random() * 1.0).toFixed(2);
              const rotate = Math.floor(Math.random() * 720) + "deg";

              const style =
                spawn === "top"
                  ? {
                      left: `${x}%`,
                      animationDelay: delay,
                      animationDuration: duration,
                      transform: `translateY(-20px) rotate(0deg) scale(${scale})`,
                      ["--tx"]: tx,
                      ["--rotateEnd"]: rotate,
                    }
                  : spawn === "left"
                  ? {
                      left: `-6%`,
                      top: `${20 + Math.random() * 40}%`,
                      animationDelay: delay,
                      animationDuration: duration,
                      transform: `translateY(0) translateX(0) rotate(0deg) scale(${scale})`,
                      ["--tx"]: (Math.random() * 120 + 60).toFixed(0) + "px",
                      ["--rotateEnd"]: rotate,
                    }
                  : {
                      right: `-6%`,
                      top: `${10 + Math.random() * 50}%`,
                      animationDelay: delay,
                      animationDuration: duration,
                      transform: `translateY(0) translateX(0) rotate(0deg) scale(${scale})`,
                      ["--tx"]: -((Math.random() * 120 + 60).toFixed(0)) + "px",
                      ["--rotateEnd"]: rotate,
                    };

              return (
                <span
                  key={`conf-${i}-${spawn}`}
                  className={`confetti-piece confetti-${spawn}`}
                  style={style}
                >
                  {emoji}
                </span>
              );
            })}
          </div>
        </>
      )}

      {quizCompleted ? (
        <div className="score-card">
          <h2>
            {language === "en"
              ? `Quiz Completed! Score: ${finalScore}/${Object.keys(answers).length} attempted`
              : `வினாடி வினா முடிந்தது! உங்கள் மதிப்பெண்: ${finalScore}/${Object.keys(answers).length} முயற்சித்தது`}
          </h2>

          <div className="score-actions">
            <button
              className="start-btn"
              onClick={() => {
                handleReset();
                setTimeout(() => handleStart(), 60);
              }}
            >
              {language === "en" ? "Try Again" : "மீண்டும் முயற்சி செய்"}
            </button>
            <button className="reset-btn" onClick={handleReset}>
              {language === "en" ? "Change Settings" : "விருப்பங்களை மாற்று"}
            </button>

            {/* ADD: View Leaderboard */}
            <button className="start-btn" onClick={() => setShowLeaderboard(true)}>
              {language === "en" ? "View Leaderboard" : "முன்னணி பட்டியல்"}
            </button>
          </div>

          {/* Leaderboard modal */}
          <Leaderboard
            storageKey={LEADERBOARD_KEY}
            open={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            title={`${topic} Leaderboard`}
            maxEntries={20}
            allowClear={true}
          />
        </div>
      ) : (
        <div className="question-card">
          <h2 className="question-text">{q?.question ?? "No question text"}</h2>

          <div className="options-container">
            {(q?.options ?? []).map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${
                  selected !== null ? (i === correctIndex ? "correct" : selected === i ? "wrong" : "") : ""
                }`}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
              >
                {optionText(opt)}
              </button>
            ))}
          </div>

          {selected !== null && (
            <div className="after-answer">
              <p className="explanation">{q?.explanation ?? ""}</p>

              <div className="nav-buttons">
                <button className="prev-btn" onClick={prevQuestion} disabled={currentQ === 0}>
                  {language === "en" ? "⬅ Previous" : "⬅ முந்தையது"}
                </button>

                <button className="submit-btn" onClick={handleSubmit}>
                  {language === "en" ? "Submit 📝" : "சமர்ப்பிக்க 📝"}
                </button>

                <button
                  className="next-btn"
                  onClick={() => {
                    if (currentQ < questions.length - 1) setCurrentQ((s) => s + 1);
                    else {
                      const attemptedScore = Object.keys(answers).reduce((acc, qIdx) => {
                        const idx = Number(qIdx);
                        const qq = questions[idx];
                        if (!qq || answers[qIdx] === undefined) return acc;
                        const ci = qq.correct_option_index ?? qq.correctOptionIndex ?? qq.answer ?? qq.correct ?? null;
                        return acc + (answers[qIdx] === ci ? 1 : 0);
                      }, 0);
                      setFinalScore(attemptedScore);
                      setQuizCompleted(true);

                      // save attempt then open leaderboard
                      saveAttempt(attemptedScore).catch((e) => console.warn("Save attempt error:", e));
                      setShowLeaderboard(true);
                    }
                  }}
                >
                  {currentQ === questions.length - 1 ? (language === "en" ? "Finish ✅" : "முடி ✅") : (language === "en" ? "Next ➡" : "அடுத்தது ➡")}
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
