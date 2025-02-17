import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  // 從 localStorage 檢查登入狀態
  const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";
  // 如果未登入，重定向到登入頁面
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
