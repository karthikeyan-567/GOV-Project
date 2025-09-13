// src/components/Leaderboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

/** API base helper (supports Vite/Cra fallback)
 *  NOTE: avoid `typeof import` — that triggers parser errors.
 */
const getApiBase = () => {
  try {
    // Safe access to import.meta — wrap in try so environments without it won't crash parse/runtime.
    // eslint-disable-next-line no-undef
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {
    // ignore if import.meta isn't present
  }

  try {
    if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
  } catch (e) {
    // ignore
  }

  return "http://localhost:5000";
};

export default function Leaderboard({
  storageKey,
  open = false,
  onClose = () => {},
  title = "Leaderboard",
  maxEntries = 100,
  allowClear = true,
  serverUrl = getApiBase() + "/api/leaderboard",
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useServer, setUseServer] = useState(true);

  // filter controls
  const [filterClass, setFilterClass] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [limit, setLimit] = useState(50);
  const limitOptions = [10, 20, 50, 100, 200];

  // load from server (supports optional filters)
  const loadServer = async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(params).toString();
      const url = serverUrl + (qs ? `?${qs}` : "");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();

      // normalize incoming data
      const normalized = (Array.isArray(data) ? data : []).map((d) => ({
        id: d.id ?? d._id ?? null,
        name: d.name || "Guest",
        score: typeof d.score === "number" ? d.score : Number(d.score) || 0,
        total: d.total ?? null,
        classId: d.classId ?? d.class ?? d.class_id ?? null,
        level: d.level ?? null,
        topic: d.topic ?? null,
        meta: d.meta ?? {},
        date: d.date ? new Date(d.date) : d.createdAt ? new Date(d.createdAt) : new Date(),
        raw: d,
      }));

      setEntries(normalized.slice(0, maxEntries));
      setUseServer(true);
    } catch (err) {
      console.warn("Leaderboard server fetch failed:", err);
      setUseServer(false);
      loadLocal(); // fallback
    } finally {
      setLoading(false);
    }
  };

  // load from localStorage fallback key
  const loadLocal = () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey || "fallback_leaderboard") || "[]";
      const parsed = JSON.parse(raw);
      const normalized = Array.isArray(parsed)
        ? parsed.map((p) => ({
            id: p.id ?? null,
            name: p.name || "Guest",
            score: typeof p.score === "number" ? p.score : Number(p.score) || 0,
            total: p.total ?? null,
            classId: p.classId ?? null,
            level: p.level ?? null,
            topic: p.topic ?? null,
            meta: p.meta ?? {},
            date: p.date ? new Date(p.date) : new Date(),
            raw: p,
          }))
        : [];
      normalized.sort((a, b) => (b.score - a.score) || (b.date - a.date));
      setEntries(normalized.slice(0, maxEntries));
    } catch (err) {
      console.error("Local leaderboard parse error:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // initial / open effect — load server
  useEffect(() => {
    if (!open) return;
    // pass current filter params if set
    const params = {};
    if (filterClass) params.classId = filterClass;
    if (filterLevel) params.level = filterLevel;
    if (filterTopic) params.topic = filterTopic;
    if (limit) params.limit = limit;
    loadServer(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filterClass, filterLevel, filterTopic, limit]);

  // compute unique filter options from entries (client-side)
  const { classes, levels, topics } = useMemo(() => {
    const setC = new Set();
    const setL = new Set();
    const setT = new Set();
    entries.forEach((e) => {
      if (e.classId) setC.add(String(e.classId));
      if (e.level) setL.add(String(e.level));
      if (e.topic) setT.add(String(e.topic));
    });
    return {
      classes: Array.from(setC).sort(),
      levels: Array.from(setL).sort(),
      topics: Array.from(setT).sort(),
    };
  }, [entries]);

  const handleRefresh = () => {
    const params = {};
    if (filterClass) params.classId = filterClass;
    if (filterLevel) params.level = filterLevel;
    if (filterTopic) params.topic = filterTopic;
    if (limit) params.limit = limit;
    loadServer(params);
  };

  const handleClear = async () => {
    if (!allowClear) return;
    if (!window.confirm("Clear leaderboard? This will delete all server entries.")) return;
    setLoading(true);
    try {
      // prefer server clear
      const res = await fetch(getApiBase() + "/api/leaderboard/clear", { method: "DELETE" });
      if (!res.ok) throw new Error("Server clear failed");
      // cleared
      setEntries([]);
      // also clear local fallback key
      try { localStorage.removeItem(storageKey || "fallback_leaderboard"); } catch (e) {}
      setUseServer(true);
    } catch (err) {
      console.warn("Server clear failed, clearing local fallback:", err);
      try {
        localStorage.removeItem(storageKey || "fallback_leaderboard");
      } catch (e) {}
      setEntries([]);
      setUseServer(false);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!entries || entries.length === 0) return;
    const header = ["Rank","Name","Score","OutOf","Class","Level","Topic","Date"];
    const rows = entries.map((e, idx) => [
      idx + 1,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      e.score,
      e.total ?? "",
      `"${String(e.classId ?? "").replace(/"/g, '""')}"`,
      `"${String(e.level ?? "").replace(/"/g, '""')}"`,
      `"${String(e.topic ?? "").replace(/"/g, '""')}"`,
      `"${(e.date && e.date.toISOString()) || ""}"`,
    ]);
    const csv = [header.join(",")].concat(rows.map(r => r.join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leaderboard.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="leaderboard-modal" role="dialog" aria-modal="true">
      <div className="leaderboard-inner" style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13 }}>Limit:</label>
            <select value={String(limit)} onChange={(e) => setLimit(Number(e.target.value))}>
              {limitOptions.map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>

            <button onClick={handleRefresh} title="Refresh">↻</button>
            <button onClick={exportCsv} title="Download CSV">⤓</button>
            {allowClear && <button onClick={handleClear} title="Clear leaderboard">Clear</button>}
            <button onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <label style={{ fontSize: 13 }}>Class:</label>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="">All</option>
              {classes.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <label style={{ fontSize: 13 }}>Level:</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">All</option>
              {levels.map((l) => (<option key={l} value={l}>{l}</option>))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <label style={{ fontSize: 13 }}>Topic:</label>
            <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
              <option value="">All</option>
              {topics.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>

          <div style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
            {loading ? "Loading..." : `${entries.length} entries`} {useServer ? "(server)" : "(local)"}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <p>Loading leaderboard…</p>
          ) : entries.length === 0 ? (
            <p>No attempts yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: 8 }}>#</th>
                    <th style={{ padding: 8 }}>Name</th>
                    <th style={{ padding: 8 }}>Class</th>
                    <th style={{ padding: 8 }}>Level</th>
                    <th style={{ padding: 8 }}>Topic</th>
                    <th style={{ padding: 8 }}>Score</th>
                    <th style={{ padding: 8 }}>Out Of</th>
                    <th style={{ padding: 8 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id ?? i} style={{ borderBottom: "1px solid #f1f1f1" }}>
                      <td style={{ padding: 8, width: 40, fontWeight: 700, color: "#ab47bc" }}>#{i + 1}</td>
                      <td style={{ padding: 8 }}>{e.name}</td>
                      <td style={{ padding: 8 }}>{e.classId ?? "-"}</td>
                      <td style={{ padding: 8 }}>{e.level ?? "-"}</td>
                      <td style={{ padding: 8 }}>{e.topic ?? "-"}</td>
                      <td style={{ padding: 8, fontWeight: 700, color: "#2e7d32" }}>{e.score}</td>
                      <td style={{ padding: 8 }}>{e.total ?? "-"}</td>
                      <td style={{ padding: 8 }}>{e.date instanceof Date && !isNaN(e.date) ? e.date.toLocaleString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Leaderboard.propTypes = {
  storageKey: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  maxEntries: PropTypes.number,
  allowClear: PropTypes.bool,
  serverUrl: PropTypes.string,
};
