import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../styles/Questions.css";

const Questions = () => {
  const { level, topicId } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const language = query.get("lang") || "en";

  
  const questionsData = [
    [
      {
        en: "What is the speed of light?",
        ta: "ஒளியின் வேகம் என்ன?",
        options: [
          { en: "300,000 km/s", ta: "300,000 கிமீ/விநா" },
          { en: "150,000 km/s", ta: "150,000 கிமீ/விநா" },
          { en: "450,000 km/s", ta: "450,000 கிமீ/விநா" },
          { en: "600,000 km/s", ta: "600,000 கிமீ/விநா" }
        ],
        answer: 0
      },
      {
        en: "Which law explains gravity?",
        ta: "ஈர்ப்பு விசையை விளக்கும் விதி எது?",
        options: [
          { en: "Newton's Law", ta: "நியூட்டனின் விதி" },
          { en: "Ohm's Law", ta: "ஓமின் விதி" },
          { en: "Boyle's Law", ta: "பாய்லின் விதி" },
          { en: "Hooke's Law", ta: "ஹூக்கின் விதி" }
        ],
        answer: 0
      }
    ],
    [
      {
        en: "What is H2O?",
        ta: "H2O என்ன?",
        options: [
          { en: "Oxygen", ta: "ஆக்சிஜன்" },
          { en: "Water", ta: "தண்ணீர்" },
          { en: "Hydrogen", ta: "ஹைட்ரஜன்" },
          { en: "Carbon Dioxide", ta: "கார்பன் டையாக்சைடு" }
        ],
        answer: 1
      }
    ]
  ];

  const topicQuestions = questionsData[topicId] || [];
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const handleAnswer = (index) => {
    setSelected(index);
    if (index === topicQuestions[currentQ].answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    setCurrentQ(currentQ + 1);
  };

  return (
    <div className="questions-container">
      {currentQ < topicQuestions.length ? (
        <div className="question-card">
          <h2>
            {language === "en"
              ? topicQuestions[currentQ].en
              : topicQuestions[currentQ].ta}
          </h2>
          <div className="options-container">
            {topicQuestions[currentQ].options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${
                  selected === i
                    ? i === topicQuestions[currentQ].answer
                      ? "correct"
                      : "wrong"
                    : ""
                }`}
                onClick={() => handleAnswer(i)}
              >
                {language === "en" ? opt.en : opt.ta}
              </button>
            ))}
          </div>
          {selected !== null && (
            <button className="next-btn" onClick={nextQuestion}>
              {language === "en" ? "Next Question" : "அடுத்த கேள்வி"}
            </button>
          )}
        </div>
      ) : (
        <div className="score-card">
          <h2>
            {language === "en"
              ? `Quiz Completed! Your Score: ${score}/${topicQuestions.length}`
              : `வினாடி வினா முடிந்தது! உங்கள் மதிப்பெண்: ${score}/${topicQuestions.length}`}
          </h2>
        </div>
      )}
    </div>
  );
};

export default Questions;
