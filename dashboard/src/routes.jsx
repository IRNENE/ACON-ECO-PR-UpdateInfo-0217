import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./components/loginPage";

import Final from "./components/final";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/final"
        element={
          <ProtectedRoute>
            <Final />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
