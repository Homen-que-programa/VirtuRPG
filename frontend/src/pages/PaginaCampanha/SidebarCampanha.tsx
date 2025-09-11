import { NavLink, useParams } from 'react-router-dom';
import './PaginaCampanha.css';

const SidebarCampanha = () => {
  const { id } = useParams<{ id: string }>();
  const sections = [
    { id: 'informacoes', label: 'Informações' },
    { id: 'chat', label: 'Chat' },
    { id: 'fichas', label: 'Fichas de Personagens' },
  { id: 'sessao', label: 'Mestrar Sessão' },
    { id: 'ferramentas', label: 'Ferramentas de Mestre' },
  { id: 'notas', label: 'Notas do Mestre' },
  ];

  return (
    <div className="sidebar-campanha">
      <h3>Veja sua Campanha</h3>
      <ul>
        {sections.map((sec) => (
          <li key={sec.id}>
            <NavLink
              to={id ? (sec.id === 'informacoes' ? `/campanha/${id}` : `/campanha/${id}/${sec.id}`) : '#'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={sec.id === 'informacoes'}
            >
              {sec.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarCampanha;
