import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LevelSelection.css";

const LevelSelection = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en");

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  const levels = [
    { id: "easy", en: "easy", ta: "தொடக்கநிலை" },
    { id: "intermediate", en: "Intermediate", ta: "இடைநிலை" },
    { id: "advanced", en: "Advanced", ta: "மேம்பட்ட" }
  ];

  return (

    <div className="level-container">
       <div className="level-container_1">
      <button className="lang-toggle" onClick={handleLanguageToggle}>
        {language === "en" ? "தமிழ்" : "English"}
      </button>
      <h1>{language === "en" ? "Choose Level" : "நிலை தேர்வு"}</h1>
      <div className="level-buttons">
        {levels.map((level) => (
          <button
            key={level.id}
            className="level-btn"
            onClick={() => navigate(`/topics/${level.id}?lang=${language}`)}
          >
            {language === "en" ? level.en : level.ta}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
};

export default LevelSelection;
