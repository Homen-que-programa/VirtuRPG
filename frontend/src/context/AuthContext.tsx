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

    const checkAndRefreshToken = async () => {
      if (savedAccessToken) {
        try {
          const decoded: any = jwtDecode(savedAccessToken);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            // Token expirado, tentar refresh
            if (savedRefreshToken) {
              try {
                const response = await fetch('http://localhost:3000/refresh-token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken: savedRefreshToken }),
                });
                if (response.ok) {
                  const data = await response.json();
                  sessionStorage.setItem("accessToken", data.accessToken);
                  sessionStorage.setItem("refreshToken", data.refreshToken);
                  setAccessToken(data.accessToken);
                  setRefreshToken(data.refreshToken);
                  const newDecoded: any = jwtDecode(data.accessToken);
                  setUser({
                    id: newDecoded.id,
                    nome: newDecoded.nome,
                    email: newDecoded.email,
                  });
                } else {
                  // Refresh falhou, logout
                  sessionStorage.removeItem("accessToken");
                  sessionStorage.removeItem("refreshToken");
                  setAccessToken(null);
                  setRefreshToken(null);
                  setUser(null);
                }
              } catch (err) {
                console.error("Erro ao refresh token:", err);
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("refreshToken");
                setAccessToken(null);
                setRefreshToken(null);
                setUser(null);
              }
            } else {
              // Sem refresh token, logout
              sessionStorage.removeItem("accessToken");
              setAccessToken(null);
              setUser(null);
            }
          } else {
            setAccessToken(savedAccessToken);
            setUser({
              id: decoded.id,
              nome: decoded.nome,
              email: decoded.email,
            });
          }
        } catch (err) {
          console.error("Erro ao decodificar token:", err);
          sessionStorage.removeItem("accessToken");
          setAccessToken(null);
          setUser(null);
        }
      }
      setRefreshToken(savedRefreshToken);
      setLoading(false);
    };

    checkAndRefreshToken();
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