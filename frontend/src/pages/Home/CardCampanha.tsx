import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import type { User, Campanha } from "../../types";
import UserList from "./UserList";
import "./CardCampanha.css";

interface CardCampanhaProps {
  campanha: Campanha;
  usuarios: User[];
  onClick?: () => void;
}

const CardCampanha: React.FC<CardCampanhaProps> = ({ campanha, usuarios, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate(); // hook para navegar

  const handleClick = () => {
    setExpanded(!expanded);
    if (onClick) onClick();
  };

  const handleEnterSession = (e: React.MouseEvent) => {
    e.stopPropagation(); // evita expandir o card
    navigate(`/campanha/${campanha.id}`); // redireciona para a página da campanha
  };

  return (
    <li
      className={`card-campanha ${expanded ? "expanded" : ""}`}
      onClick={handleClick}
    >
      <div className="card-header">
        <div className="campaign-name">{campanha.nome}</div>
        <div className="campaign-mestre">Mestres: {campanha.mestres}</div>
      </div>

      <div className="card-content">
        <p className="campaign-description">{campanha.descricao}</p>
        <h4>Jogadores:</h4>
        <UserList usuarios={usuarios} />
        <div className="card-actions">
          <button onClick={handleEnterSession}>
            Entrar na Sessão
          </button>
          <button onClick={(e) => { e.stopPropagation(); alert("Visualizando perfil..."); }}>
            Ver Perfil
          </button>
        </div>
      </div>
    </li>
  );
};

export default CardCampanha;
