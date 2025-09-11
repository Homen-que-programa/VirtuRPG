import { useEffect, useState } from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SidebarCampanha from "./SidebarCampanha";
import type { Campanha } from "../../types";
import "./PaginaCampanha.css";

const PaginaCampanha = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campanha, setCampanha] = useState<Campanha>({
    id: 0,
    nome: '',
    mestre: '',
    descricao: '',
    jogadores: [],
  });
  const [mensagem, setMensagem] = useState("");
  const { accessToken, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Aguarda carregar tokens do sessionStorage
    if (!accessToken) {
      navigate("/homelogoff", { replace: true });
      return;
    }

    const fetchCampanha = async () => {
      try {
        const res = await fetch(`http://localhost:3000/campanha/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();

        if (res.ok) {
          setCampanha(data.campanha);
        } else {
          setMensagem(data.message || "Erro ao carregar a campanha.");
        }
      } catch (err) {
        setMensagem("Erro no servidor.");
      }
    };

    fetchCampanha();
  }, [id, accessToken, loading, navigate]);

  if (loading) return <p>Carregando...</p>;
  if (!campanha) return <p>{mensagem || "Carregando campanha..."}</p>;

  return (
    <div className="pagina-campanha-container">
      <SidebarCampanha />
      {/* Provide campanha via Outlet context to child routes */}
      <Outlet context={{ campanha }} />
    </div>
  );
};

export default PaginaCampanha;