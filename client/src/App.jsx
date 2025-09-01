import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GetStarted from "./components/GetStarted";
import StartPage from "./components/StartPage";
import ClassSelection from "./components/ClassSelection";
import LevelSelection from "./components/LevelSelection";
import Topics from "./components/Topics";
import Questions from "./components/Questions";
import AIQuestions from "./components/AIQuestions"; // Import the AIQuestions component
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<GetStarted />} />
        <Route path="/start" element={<StartPage />} />

      
        <Route path="/db/classes" element={<ClassSelection />} />
        <Route path="/db/levels/:classId" element={<LevelSelection />} />
        <Route path="/db/topics/:classId/:level" element={<Topics />} />
        <Route path="/db/questions/:classId/:level/:topicId" element={<Questions />} />

        <Route path="/ai/classes" element={<ClassSelection />} />
        <Route path="/ai/levels/:classId" element={<LevelSelection />} />
        <Route path="/ai/topics/:classId/:level" element={<Topics />} />
       
        <Route path="/ai/questions/:classId/:level/:topicId" element={<AIQuestions />} />
      </Routes>
    </Router>
  );
}

export default App;
