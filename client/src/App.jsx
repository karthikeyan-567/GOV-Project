import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GetStarted from "./components/GetStarted";
import ClassSelection from "./components/ClassSelection";
import LevelSelection from "./components/LevelSelection";
import Topics from "./components/Topics";
import Questions from "./components/Questions";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GetStarted />} />
        <Route path="/classes" element={<ClassSelection />} />
        <Route path="/levels/:classId" element={<LevelSelection />} />
        <Route path="/topics/:classId/:level" element={<Topics />} />
        <Route path="/questions/:classId/:level/:topicId" element={<Questions />} />
      </Routes>
    </Router>
  );
}

export default App;
