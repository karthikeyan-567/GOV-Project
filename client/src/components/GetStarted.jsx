import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GetStarted.css";

const GetStarted = () => {
  const navigate = useNavigate();

  return (
    <div className="get-started-page">
      <div className="get-started-page-1">
        <h1>Welcome to Science Quiz</h1>
        <button
          className="get-started-btn"
          onClick={() => navigate("/login")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default GetStarted;
