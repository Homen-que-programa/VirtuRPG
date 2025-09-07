import React from 'react';
import './PaginaCampanha.css';

interface Props {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const SidebarCampanha: React.FC<Props> = ({ activeSection, setActiveSection }) => {
  const sections = [
    { id: 'informacoes', label: 'Informações' },
    { id: 'chat', label: 'Chat' },
    { id: 'fichas', label: 'Fichas de Personagens' },
    { id: 'sessao', label: 'Mestrar Sessão' },
    { id: 'ferramentas', label: 'Ferramentas de Mestre' },
  ];

  return (
    <div className="sidebar-campanha">
      <h3>Veja sua Campanha</h3>
      <ul>
        {sections.map((sec) => (
          <li
            key={sec.id}
            className={activeSection === sec.id ? 'active' : ''}
            onClick={() => setActiveSection(sec.id)}
          >
            {sec.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarCampanha;
