// src/pages/StartPage.jsx  (or src/components/StartPage.jsx depending on your structure)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";

const tryFetchLeaderboard = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    // propagate so caller can try fallback
    throw err;
  }
};

const normalizeServerEntry = (e) => ({
  id: e.id ?? e._id ?? null,
  name: e.name ?? "Guest",
  score: typeof e.score === "number" ? e.score : Number(e.score) || 0,
  total: e.total ?? null,
  classId: e.classId ?? e.class ?? e.class_id ?? null,
  level: e.level ?? null,
  topic: e.topic ?? null,
  meta: e.meta ?? {},
  date: e.date ? new Date(e.date) : e.createdAt ? new Date(e.createdAt) : new Date(),
  source: "server",
  raw: e,
});

const normalizeLocalEntry = (p, sourceKey) => ({
  id: p.id ?? null,
  name: p.name ?? p.player ?? "Guest",
  score: typeof p.score === "number" ? p.score : Number(p.score) || 0,
  total: p.total ?? null,
  classId: p.classId ?? null,
  level: p.level ?? null,
  topic: p.topic ?? null,
  meta: p.meta ?? {},
  date: p.date ? new Date(p.date) : new Date(0),
  source: sourceKey,
  raw: p,
});

const API_FALLBACK = "http://localhost:5000";

const StartPage = () => {
  const navigate = useNavigate();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [loadingLb, setLoadingLb] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // load and merge server + local leaderboard entries
  const loadMergedLeaderboard = async () => {
    setLoadingLb(true);
    try {
      let merged = [];

      // 1) Try server: first try a relative URL (works if you proxy), otherwise fallback to localhost:5000
      let serverEntries = [];
      try {
        // request a generous limit
        serverEntries = await tryFetchLeaderboard("/api/leaderboard?limit=200");
      } catch (err1) {
        try {
          serverEntries = await tryFetchLeaderboard(`${API_FALLBACK}/api/leaderboard?limit=200`);
        } catch (err2) {
          // server unavailable — continue, we'll still read local
          serverEntries = [];
          // console.warn("Server leaderboard fetch failed:", err2);
        }
      }

      // normalize server results
      if (serverEntries.length > 0) {
        const norm = serverEntries.map(normalizeServerEntry);
        merged = merged.concat(norm);
      }

      // 2) Scan localStorage for any keys that look like leaderboards and merge them
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.toLowerCase().includes("leaderboard")) {
          try {
            const raw = localStorage.getItem(key);
            const parsed = JSON.parse(raw || "[]");
            if (Array.isArray(parsed)) {
              parsed.forEach((p) => {
                if (!p) return;
                merged.push(normalizeLocalEntry(p, key));
              });
            } else if (typeof parsed === "object" && parsed !== null && parsed.entries) {
              // some storage shapes might wrap entries
              const arr = Array.isArray(parsed.entries) ? parsed.entries : [];
              arr.forEach((p) => merged.push(normalizeLocalEntry(p, key)));
            }
          } catch (e) {
            // ignore malformed local leaderboard
            // console.warn("Malformed local leaderboard", key, e);
          }
        }
      }

      // 3) Deduplicate lightly: keep all but prioritize server entries when exact match found
      // We'll dedupe by name+score+date-string to avoid duplicates
      const seen = new Set();
      const deduped = [];
      merged.forEach((m) => {
        const signature = `${m.name}::${m.score}::${m.date ? m.date.toISOString() : ""}::${m.classId ?? ""}`;
        if (!seen.has(signature)) {
          seen.add(signature);
          deduped.push(m);
        }
      });

      // 4) Sort by date desc (most recent first), then score desc
      deduped.sort((a, b) => {
        const ta = a.date ? a.date.getTime() : 0;
        const tb = b.date ? b.date.getTime() : 0;
        if (tb !== ta) return tb - ta;
        return (b.score || 0) - (a.score || 0);
      });

      // limit to top 500 to keep UI snappy
      setLeaderboardEntries(deduped.slice(0, 500));
    } catch (err) {
      console.error("Failed to load merged leaderboard", err);
      setLeaderboardEntries([]);
    } finally {
      setLoadingLb(false);
    }
  };

  // reload when opening the modal
  useEffect(() => {
    if (showLeaderboard) {
      loadMergedLeaderboard();
    } else {
      setExpandedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLeaderboard]);

  const topCount = leaderboardEntries.length;

  return (
    <div className="start-container">
      <h1 className="title">🚀 Welcome to the Quiz Portal</h1>
      <p className="subtitle">Choose how you want to play:</p>

      <div className="button-group">
        <button className="start-btn db-btn" onClick={() => navigate("/db/classes")}>
          📘 Science Quiz (Database)
        </button>

        <button className="start-btn ai-btn" onClick={() => navigate("/ai/classes")}>
          🤖 AI Quiz (Generated)
        </button>
      </div>

      <div className="extra-actions">
        <button className="start-btn leaderboard-btn" onClick={() => setShowLeaderboard(true)}>
          🏆 View Leaderboard
        </button>

        <button className="start-btn back-btn" onClick={() => navigate("/login")}>
          🔙 Back to Login
        </button>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="lb-modal" role="dialog" aria-modal="true">
          <div className="lb-backdrop" onClick={() => setShowLeaderboard(false)} />
          <div className="lb-panel" role="document" aria-label="Leaderboard">
            <div className="lb-header">
              <h2>Leaderboard / Attempt History</h2>
              <div className="lb-controls">
                <button className="lb-refresh" onClick={loadMergedLeaderboard} title="Refresh">
                  ↻
                </button>
                <button className="lb-close" onClick={() => setShowLeaderboard(false)} title="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="lb-meta">
              <span>{loadingLb ? "Loading..." : `${topCount} entries found`}</span>
            </div>

            <div className="lb-list-wrap">
              {loadingLb ? (
                <div className="lb-loading">Loading leaderboard…</div>
              ) : leaderboardEntries.length === 0 ? (
                <div className="lb-empty">No leaderboard entries yet.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="lb-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                        <th style={{ padding: 8, width: 50 }}>#</th>
                        <th style={{ padding: 8 }}>Player</th>
                        <th style={{ padding: 8 }}>Class</th>
                        <th style={{ padding: 8 }}>Level</th>
                        <th style={{ padding: 8 }}>Topic</th>
                        <th style={{ padding: 8 }}>Score</th>
                        <th style={{ padding: 8 }}>Out Of</th>
                        <th style={{ padding: 8 }}>Date</th>
                        <th style={{ padding: 8 }}>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardEntries.map((e, idx) => {
                        const key = e.id ?? `${e.source}-${idx}`;
                        return (
                          <React.Fragment key={key}>
                            <tr
                              onClick={() => setExpandedId(expandedId === key ? null : key)}
                              style={{
                                cursor: "pointer",
                                background: expandedId === key ? "#faf7ff" : "transparent",
                                borderBottom: "1px solid #f1f1f1",
                              }}
                            >
                              <td style={{ padding: 8, fontWeight: 700, color: "#ab47bc" }}>#{idx + 1}</td>
                              <td style={{ padding: 8 }}>{e.name}</td>
                              <td style={{ padding: 8 }}>{e.classId ?? "-"}</td>
                              <td style={{ padding: 8 }}>{e.level ?? "-"}</td>
                              <td style={{ padding: 8 }}>{e.topic ?? "-"}</td>
                              <td style={{ padding: 8, fontWeight: 700, color: "#2e7d32" }}>{e.score}</td>
                              <td style={{ padding: 8 }}>{e.total ?? "-"}</td>
                              <td style={{ padding: 8 }}>{e.date instanceof Date && !isNaN(e.date) ? e.date.toLocaleString() : ""}</td>
                              <td style={{ padding: 8, fontSize: 12, color: "#666" }}>{e.source}</td>
                            </tr>

                            {expandedId === key && (
                              <tr>
                                <td colSpan={9} style={{ padding: 12, background: "#fff", fontSize: 13 }}>
                                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    <div style={{ minWidth: 200 }}>
                                      <strong>Player:</strong> {e.name}
                                      <br />
                                      <strong>Class:</strong> {e.classId ?? "-"}
                                      <br />
                                      <strong>Level:</strong> {e.level ?? "-"}
                                      <br />
                                      <strong>Topic:</strong> {e.topic ?? "-"}
                                    </div>

                                    <div style={{ minWidth: 180 }}>
                                      <strong>Score:</strong> {e.score} {e.total ? ` / ${e.total}` : ""}
                                      <br />
                                      <strong>Date:</strong>{" "}
                                      {e.date instanceof Date && !isNaN(e.date) ? e.date.toLocaleString() : ""}
                                      <br />
                                      <strong>Source:</strong> {e.source}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 240 }}>
                                      <strong>Meta / Raw:</strong>
                                      <pre style={{ whiteSpace: "pre-wrap", marginTop: 6, background: "#f7f7f7", padding: 8, borderRadius: 6 }}>
                                        {JSON.stringify(e.raw ?? e.meta ?? {}, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lb-actions" style={{ marginTop: 12 }}>
              <button
                className="start-btn"
                onClick={() => {
                  setShowLeaderboard(false);
                  navigate("/db/classes");
                }}
              >
                Start Database Quiz
              </button>

              <button
                className="start-btn"
                onClick={() => {
                  setShowLeaderboard(false);
                  navigate("/ai/classes");
                }}
              >
                Start AI Quiz
              </button>

              <button
                className="reset-btn"
                onClick={() => {
                  if (!window.confirm("Clear all leaderboard-like keys from localStorage? This cannot be undone.")) return;
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.toLowerCase().includes("leaderboard")) {
                      try {
                        localStorage.removeItem(key);
                      } catch (e) {}
                      i = -1;
                    }
                  }
                  setLeaderboardEntries([]);
                }}
              >
                Clear Leaderboards (local)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartPage;
