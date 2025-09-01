import React from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import "../styles/Topics.css";

const Topics = () => {
  const navigate = useNavigate();
  const { classId, level } = useParams();
  const location = useLocation();

  // detect DB or AI flow
  const isDb = location.pathname.startsWith("/db");
  const basePath = isDb ? "/db" : "/ai";

  const query = new URLSearchParams(location.search);
  const language = query.get("lang") || "en";

  const topics = [
    { en: "Physics", ta: "இயற்பியல்" },
    { en: "Chemistry", ta: "வேதியியல்" },
    { en: "Biology", ta: "உயிரியல்" },
    { en: "General Knowledge", ta: "பொது அறிவு" },
    { en: "Astronomy", ta: "வானியல்" },
    { en: "Human Body", ta: "மனித உடல்" },
    { en: "Genetics", ta: "மரபியல்" },
    { en: "Environmental Science", ta: "சுற்றுச்சூழல் அறிவியல்" }
  ];

  return (
    <div className="topics-container">
      <h1>{language === "en" ? "Select a Topic" : "தலைப்பை தேர்ந்தெடுக்கவும்"}</h1>

      <div style={{ marginBottom: "15px" }}>
        <Link className="back-btn" to={`${basePath}/levels/${classId}?lang=${language}`}>
          {language === "en" ? "◀️ Back to Levels" : "◀️ நிலைக்கு பின் செல்ல"}
        </Link>
      </div>

      <div className="topics-grid">
        {topics.map((topic, index) => (
          <button
            key={index}
            className="topic-btn"
            onClick={() =>
              navigate(`${basePath}/questions/${classId}/${level}/${index}?lang=${language}`)
            }
          >
            {language === "en" ? topic.en : topic.ta}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Topics;
