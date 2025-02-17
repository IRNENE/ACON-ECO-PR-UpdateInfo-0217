import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const phone = useSelector((state) => state.user.phone);
  const license = useSelector((state) => state.user.license);

  if (!phone || !license) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
