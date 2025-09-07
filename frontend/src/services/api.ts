import { useAuth } from "../context/AuthContext";

export function useApi() {
  const { accessToken, refreshToken, setTokens } = useAuth();

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    let token = accessToken;

    let res = await fetch(`http://localhost:3000${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 && refreshToken) {
      // tentar renovar token
      const refreshRes = await fetch("http://localhost:3000/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const { accessToken: newToken } = await refreshRes.json();
        setTokens(newToken, refreshToken);

        // refazer requisição original
        res = await fetch(`http://localhost:3000${url}`, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${newToken}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        // refresh falhou → forçar logout
        setTokens(null, null);
        throw new Error("Sessão expirada");
      }
    }


    return res;
  };

  return { apiFetch };
}