import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfileLogin = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name to continue !");
      return;
    }

    // Save name in localStorage
    localStorage.setItem("playerName", name);

    // Navigate to /start
    navigate("/start");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundImage: "url('/images/quiz-bg.jpg')", //  put your background image path here
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)", // little transparent card
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          padding: "40px",
          width: "350px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "bold",
            color: "#6a1b9a",
            marginBottom: "20px",
          }}
        >
          👤 Profile Login
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "20px",
              outline: "none",
              fontSize: "16px",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "#6a1b9a",
              color: "#fff",
            
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onMouseOver={(e) =>
              (e.target.style.backgroundColor = "#4a0072")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = "#6a1b9a")
            }
          >
            Start Quiz
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileLogin;