import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";

const StartPage = () => {
  const navigate = useNavigate();

  return (
    <div className="start-container">
      <h1 className="title">🚀 Welcome to the Quiz Portal</h1>
      <p className="subtitle">Choose how you want to play:</p>

      <div className="button-group">
        <button
          className="start-btn db-btn"
          onClick={() => navigate("/db/classes")}
        >
          📘 Science Quiz (Database)
        </button>

        <button
          className="start-btn ai-btn"
          onClick={() => navigate("/ai/classes")}
        >
          🤖 AI Quiz (Generated)
        </button>
      </div>
    </div>
  );
};

export default StartPage;
