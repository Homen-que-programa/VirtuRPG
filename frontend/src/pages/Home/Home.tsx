import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CampaignCard from "./CardCampanha";
import "./Home.css";

const Home = () => {
  const { accessToken: token } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [usuariosCampanha, setUsuariosCampanha] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Buscar perfil do usuário
        const resPerfil = await fetch("http://localhost:3000/perfil", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resPerfil.ok) throw new Error("Erro ao buscar perfil");
        const dataPerfil = await resPerfil.json();
        setUser(dataPerfil.user);

        // Buscar campanhas do usuário
        const resC = await fetch("http://localhost:3000/campanhas-do-usuario", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ id: dataPerfil.user.id }),
        });

        if (!resC.ok) throw new Error("Erro ao buscar campanhas");
        const dataC = await resC.json();

        // Buscar usuários de cada campanha
        const campanhasComUsuarios = await Promise.all(
          dataC.rows.map(async (campanha: any) => {
            try {
              const resU = await fetch("http://localhost:3000/usuarios-da-campanha", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id: campanha.id }),
              });

              if (!resU.ok) return { campanha, usuarios: [] };
              const dataU = await resU.json();

              // Buscar dados completos de cada usuário
              const usuarios = await Promise.all(
                dataU.rows.map(async (uc: any) => {
                  if (!uc.id) return null;
                  try {
                    const resUsuario = await fetch("http://localhost:3000/procurar-usuario", {
                      method: "POST",
                      headers: { 
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ id: uc.id }),
                    });

                    if (!resUsuario.ok) return null;
                    const dataUsuario = await resUsuario.json();
                    return dataUsuario.usuario || null;
                  } catch {
                    return null;
                  }
                })
              );

              return { campanha, usuarios: usuarios.filter(Boolean) };
            } catch {
              return { campanha, usuarios: [] };
            }
          })
        );

        setUsuariosCampanha(campanhasComUsuarios);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const handleCreateCampaign = () => navigate("/criarCampanha");

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="home-container">
      <h1>Bem-vindo, {user?.apelido}</h1>
      <button className="create-btn" onClick={handleCreateCampaign}>
        Criar Nova Campanha
      </button>

      <h2>Sua Lista de Campanhas</h2>
      {usuariosCampanha.length === 0 ? (
        <p className="empty-msg">Você ainda não participa de nenhuma campanha.</p>
      ) : (
        <ul className="campaigns-list">
          {usuariosCampanha.map(({ campanha, usuarios }) => (
            <CampaignCard key={campanha.id} campanha={campanha} usuarios={usuarios} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;