import React from "react";
import { useNavigate, useParams, useLocation ,Link } from "react-router-dom";
import "../styles/Topics.css";


const Topics = () => {
  const navigate = useNavigate();
  const { level } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const language = query.get("lang") || "en";

  
  const topics = [
    { en: "Physics Basics", ta: "இயற்பியல் அடிப்படை" },
    { en: "Chemistry Elements", ta: "வேதியியல் மூலப்பொருட்கள்" },
    { en: "Biology Cells", ta: "உயிரியல் செல்" },
    { en: "Earth Science", ta: "புவி அறிவியல்" },
    { en: "Astronomy", ta: "வானியல்" },
    { en: "Human Body", ta: "மனித உடல்" },
    { en: "Genetics", ta: "மரபியல்" },
    { en: "Electricity", ta: "மின்சாரம்" },
    { en: "Environmental Science", ta: "சுற்றுச்சூழல் அறிவியல்" },
    { en: "Robotics", ta: "ரோபோட்டிக்ஸ்" }
  ];

  return (
    <div className="topics-container">
      <h1>
        
        {language === "en" ? "Select a Topic" : "தலைப்பை தேர்ந்தெடுக்கவும்"}
      </h1>
               {language === "en" ? <Link style={{backgroundColor:" tomato" , padding:"10px" , color:"black" , textDecoration:"none " , fontWeight:"extrabold",fontSize:"20px" , position:"relative" , right:"600px" , borderRadius:"10px" , boxShadow:"5px 5px 10px black"} } to="/levels">◀️ Back</Link> : <Link style={{backgroundColor:" tomato" , padding:"10px" , color:"black" , textDecoration:"none " , fontWeight:"extrabold",fontSize:"20px" , position:"relative" , right:"600px" , borderRadius:"10px" , boxShadow:"5px 5px 10px black"} } to="/levels">◀️ பின் செல்ல</Link> }

      <div className="topics-grid">
        {topics.map((topic, index) => (
          <button
            key={index}
            className="topic-btn"
            onClick={() => navigate(`/questions/${level}/${index}?lang=${language}`)}
          >
            {language === "en" ? topic.en : topic.ta}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Topics;
