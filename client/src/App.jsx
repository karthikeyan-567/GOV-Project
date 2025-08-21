import React from "react";
import { Routes, Route } from "react-router-dom";
import GetStarted from "./components/GetStarted";
import LevelSelection from "./components/LevelSelection";
import Topics from "./components/Topics";
import Questions from "./components/Questions";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<GetStarted />} />
      <Route path="/levels" element={<LevelSelection />} />
      <Route path="/topics/:level" element={<Topics />} />
      <Route path="/questions/:level/:topicId" element={<Questions />} />
    </Routes>
  );
}

export default App;
