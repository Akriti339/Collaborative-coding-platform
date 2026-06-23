import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import ProblemsPage from "./pages/ProblemsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/editor/:roomId"
        element={<Editor />}
      />

      <Route
        path="/problems"
        element={<ProblemsPage />}
      />

      <Route
        path="/problem/:id"
        element={<Editor />}
      />
    </Routes>
  );
}

export default App;