import { Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
    </Routes>
  );
}

export default AppRoutes;
