import { Navigate } from "react-router-dom";

// ProtectedRoute checks if the user is authenticated
function ProtectedRoute({ element }) {
  const isAuth = localStorage.getItem("isAuth");

  // If the user is not authenticated, redirect to the Login page
  if (isAuth !== "true") {
    return <Navigate to="/login" />;
  }

  return element; // If authenticated, render the element (i.e., the protected route component)
}

export default ProtectedRoute;
