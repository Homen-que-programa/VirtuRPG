import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./HomeLogoff.css";

const HomeLogoff = () => {
  const { accessToken } = useAuth();

  return (
    <div className="home-logoff">

      {/* Hero */}
      <section className="hero">
        <h2>Bem-vindo ao VirtualRPG</h2>
        <p>Conecte-se com mestres e jogadores, crie suas aventuras e mergulhe em histórias épicas de RPG de mesa.</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn primary">Entrar</Link>
          <Link to="/cadastro" className="btn outline">Criar Conta</Link>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>Funcionalidades</h2>
        <div className="feature-cards">
          <div className="card">
            <div className="img-placeholder">📜</div>
            <h3>Criação de Campanhas</h3>
            <p>Monte aventuras customizadas e gerencie cada detalhe da sua história.</p>
          </div>
          <div className="card">
            <div className="img-placeholder">🎲</div>
            <h3>Rolagens de Dados</h3>
            <p>Role dados digitais com histórico, fórmulas e atalhos para acelerar as sessões.</p>
          </div>
          <div className="card">
            <div className="img-placeholder">🧙</div>
            <h3>Perfil de Jogador</h3>
            <p>Gerencie personagens, histórico de jogos e progresso detalhado.</p>
          </div>
          <div className="card">
            <div className="img-placeholder">💬</div>
            <h3>Chat & Voz</h3>
            <p>Converse em tempo real com seu grupo, sem depender de apps externos.</p>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="audience">
        <h2>Feito para Mestres e Jogadores</h2>
        <div className="audience-grid">
          <div className="audience-card">
            <h3>Para Mestres</h3>
            <ul>
              <li>Prepare sessões com NPCs e mapas interativos.</li>
              <li>Controle fichas e recursos narrativos.</li>
              <li>Crie campanhas privadas ou públicas.</li>
            </ul>
          </div>
          <div className="audience-card">
            <h3>Para Jogadores</h3>
            <ul>
              <li>Crie personagens completos.</li>
              <li>Participe de campanhas abertas.</li>
              <li>Receba notificações de sessões e eventos.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery">
        <h2>Um vislumbre das aventuras</h2>
        <div className="gallery-grid">
          <div className="img-box">🎨 Banner Personalizado</div>
          <div className="img-box">📂 Lista de Campanhas</div>
          <div className="img-box">📝 Ficha de Personagem</div>
          <div className="img-box">🗺️ Mesa Virtual</div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2>O que dizem os aventureiros</h2>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <p>"Finalmente encontrei um lugar para jogar com meus amigos à distância!"</p>
            <span>- Lucas</span>
          </div>
          <div className="testimonial-card">
            <p>"Organizar minhas campanhas nunca foi tão simples e divertido."</p>
            <span>- Ana</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <h2>Perguntas Frequentes</h2>
        <ul>
          <li><strong>O VirtualRPG é gratuito?</strong> Sim, totalmente grátis.</li>
          <li><strong>Posso criar campanhas privadas?</strong> Sim, só convidados terão acesso.</li>
          <li><strong>É possível personalizar fichas?</strong> Sim, há suporte completo para fichas customizadas.</li>
        </ul>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Pronto para rolar os dados?</h2>
        <p>Entre agora ou crie sua conta para começar sua próxima grande missão.</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn primary">Entrar</Link>
          <Link to="/cadastro" className="btn outline">Criar Conta</Link>
        </div>
      </section>
    </div>
  );
};

export default HomeLogoff;