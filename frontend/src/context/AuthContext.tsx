import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  id: number;
  nome: string;
  email?: string;
  // outros campos que seu JWT tiver
}

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  user: User | null;
  setTokens: (accessToken: string | null, refreshToken?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  refreshToken: null,
  loading: true,
  user: null,
  setTokens: () => { },
  logout: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedAccessToken = sessionStorage.getItem("accessToken");
    const savedRefreshToken = sessionStorage.getItem("refreshToken");

    setAccessToken(savedAccessToken);
    setRefreshToken(savedRefreshToken);

    if (savedAccessToken) {
      try {
        const decoded: any = jwtDecode(savedAccessToken);
        setUser({
          id: decoded.id,
          nome: decoded.nome,
          email: decoded.email,
        });
      } catch (err) {
        console.error("Erro ao decodificar token:", err);
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const setTokens = (newAccessToken: string | null, newRefreshToken?: string | null) => {
    if (newAccessToken) {
      sessionStorage.setItem("accessToken", newAccessToken); // ✅ aqui
      setAccessToken(newAccessToken);

      try {
        const decoded: any = jwtDecode(newAccessToken);
        setUser({
          id: decoded.id,
          nome: decoded.nome,
          email: decoded.email,
        });
      } catch (err) {
        setUser(null);
      }
    } else {
      sessionStorage.removeItem("accessToken"); // ✅ aqui
      setAccessToken(null);
      setUser(null);
    }

    if (newRefreshToken !== undefined) {
      if (newRefreshToken) {
        sessionStorage.setItem("refreshToken", newRefreshToken); // ✅ aqui
        setRefreshToken(newRefreshToken);
      } else {
        sessionStorage.removeItem("refreshToken"); // ✅ aqui
        setRefreshToken(null);
      }
    }
  };

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, loading, user, setTokens, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);