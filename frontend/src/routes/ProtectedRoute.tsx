import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactElement;
}

export const PrivateRoute = ({ children }: Props) => {
  const { accessToken, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;

  return accessToken ? children : <Navigate to="/homelogoff" replace />;
};

export const PublicRoute = ({ children }: Props) => {
  const { accessToken, loading } = useAuth();

  if (loading) return null;
  return accessToken ? <Navigate to="/" /> : children;
};