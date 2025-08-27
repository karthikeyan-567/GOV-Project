import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/ClassSelection.css";

const ClassSelection = () => {
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const [language, setLanguage] = useState(query.get("lang") || "en");

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  const classes = [
    { id: "class6", en: "Class 6", ta: "ஆறாம் வகுப்பு" },
    { id: "class7", en: "Class 7", ta: "ஏழாம் வகுப்பு" },
    { id: "class8", en: "Class 8", ta: "எட்டாம் வகுப்பு" },
    { id: "class9", en: "Class 9", ta: "ஒன்பதாம் வகுப்பு" },
    { id: "class10", en: "Class 10", ta: "பத்தாம் வகுப்பு" },
    { id: "class11", en: "Class 11", ta: "பதினொன்றாம் வகுப்பு" },
    { id: "class12", en: "Class 12", ta: "பதினிரண்டாம் வகுப்பு" }
  ];

  return (
    <div className="class-container">
      <div className="class-header">
        <button className="lang-toggle" onClick={handleLanguageToggle}>
          {language === "en" ? "தமிழ்" : "English"}
        </button>
        <h1>{language === "en" ? "Choose Your Class" : "உங்கள் வகுப்பை தேர்ந்தெடுக்கவும்"}</h1>
      </div>

      <div className="class-buttons">
        {classes.map((cls) => (
          <button
            key={cls.id}
            className="class-btn"
            onClick={() => navigate(`/levels/${cls.id}?lang=${language}`)}
          >
            {language === "en" ? cls.en : cls.ta}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClassSelection;
