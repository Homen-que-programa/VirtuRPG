import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ConteudoCampanha from "./ConteudoCampanha";
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
  const [activeSection, setActiveSection] = useState("informacoes"); const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      navigate("/"); // ou "/homelogoff"
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
  }, [id, accessToken, navigate]);

  if (!campanha) return <p>{mensagem || "Carregando campanha..."}</p>;

  return (
    <div className="pagina-campanha-container">
      <SidebarCampanha
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <ConteudoCampanha campanha={campanha} activeSection={activeSection} />
    </div>
  );
};

export default PaginaCampanha;
