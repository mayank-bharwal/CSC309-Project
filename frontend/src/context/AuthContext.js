import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API_URL = process.env.REACT_APP_API_URL || '';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          setUser(data);
        }
      } else {
        localStorage.removeItem("authToken");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("authToken");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (utorid, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utorid, password }),
      });

      const text = await res.text();
      
      if (!text) {
        throw new Error("Server returned empty response. Is the backend running?");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error("Invalid server response. Is the backend running?");
      }

      if (!res.ok) {
        // Special case: User needs to set password
        if (res.status === 403 && data.needsPasswordSetup) {
          const error = new Error(data.message || "Please set your password to activate your account");
          error.needsPasswordSetup = true;
          error.resetToken = data.resetToken;
          error.expiresAt = data.expiresAt;
          throw error;
        }
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("authToken", data.token);
      setToken(data.token);

      // Fetch user after login
      const userRes = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      if (userRes.ok) {
        const userText = await userRes.text();
        if (userText) {
          const userData = JSON.parse(userText);
          setUser(userData);
        }
      }

      return data;
    } catch (error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error("Cannot connect to server. Please make sure the backend is running.");
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  const isManager = () => {
    return user?.role === "manager" || user?.role === "superuser";
  };

  const isCashier = () => {
    return user?.role === "cashier" || isManager();
  };

  const isSuperuser = () => {
    return user?.role === "superuser";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isManager,
        isCashier,
        isSuperuser,
        refreshUser: fetchUser,
        setToken,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
