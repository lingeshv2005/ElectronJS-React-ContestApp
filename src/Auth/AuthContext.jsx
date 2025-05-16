import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedIsAuth = localStorage.getItem("isAuth") === "true";
    
    // Ensure values are valid
    if (storedIsAuth && storedUsername) {
      setUsername(storedUsername);
      setIsAuth(storedIsAuth);
    }
  }, []);

  const login = (username, loginData) => {
    if (!loginData?.token || !loginData?.userId) {
      console.error("Invalid login data");
      return; // Prevent invalid login if data is incomplete
    }
    
    localStorage.setItem("username", username);
    localStorage.setItem("isAuth", true);
    localStorage.setItem("token", loginData.token);
    localStorage.setItem("userId", loginData.userId);
    
    setUsername(username);
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("isAuth");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    setUsername(null);
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuth, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
