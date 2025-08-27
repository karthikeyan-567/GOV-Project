import React, { useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import "../styles/LevelSelection.css";

const LevelSelection = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const [language, setLanguage] = useState(query.get("lang") || "en");

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  const levels = [
    { id: "Easy", en: "Easy", ta: "தொடக்கநிலை" },
    { id: "Intermediate", en: "Intermediate", ta: "இடைநிலை" },
    { id: "Advanced", en: "Advanced", ta: "மேம்பட்ட" }
  ];

  return (
    <div className="level-container">
      
    <div style={{ marginBottom: "15px" }}>
  <Link className="back-btn" to={`/classes?lang=${language}`}>
    {language === "en" ? "◀️ Back to Classes" : "◀️ வகுப்புகளுக்கு பின் செல்ல"}
  </Link>
</div>


      <button className="lang-toggle" onClick={handleLanguageToggle}>
        {language === "en" ? "தமிழ்" : "English"}
      </button>
      <h1 className="level-card">{language === "en" ? "Choose Level" : "நிலை தேர்வு"}</h1>

      <div className="level-buttons">
        {levels.map((level) => (
          <button
            key={level.id}
            className="level-btn"
            onClick={() =>
              navigate(`/topics/${classId}/${level.id}?lang=${language}`)
            }
          >
            {language === "en" ? level.en : level.ta}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LevelSelection;
