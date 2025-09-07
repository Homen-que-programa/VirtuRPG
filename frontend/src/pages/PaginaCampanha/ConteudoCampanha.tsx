import React from 'react';
import type { Campanha } from '../../types';
import './PaginaCampanha.css';

interface Props {
  campanha: Campanha;
  activeSection: string;
}

const ConteudoCampanha: React.FC<Props> = ({ campanha, activeSection }) => {
  return (
    <div className="conteudo-campanha">
      {activeSection === 'informacoes' && (
        <section id="informacoes">
          <h2>{campanha.nome}</h2>
          <p><strong>Mestre:</strong> {campanha.mestre}</p>
          <p><strong>Descrição:</strong> {campanha.descricao}</p>
          <p>
            <strong>Jogadores:</strong> {campanha.jogadores && campanha.jogadores.length > 0 
              ? campanha.jogadores.join(', ') 
              : 'Nenhum jogador'}
          </p>
        </section>
      )}

      {activeSection === 'chat' && (
        <section id="chat">
          <h3>Chat da Campanha</h3>
        </section>
      )}

      {activeSection === 'fichas' && (
        <section id="fichas">
          <h3>Fichas de Personagens</h3>
        </section>
      )}

      {activeSection === 'sessao' && (
        <section id="sessao">
          <h3>Mestra Sessão</h3>
        </section>
      )}

      {activeSection === 'ferramentas' && (
        <section id="ferramentas">
          <h3>Ferramentas de Mestre</h3>
        </section>
      )}
    </div>
  );
};

export default ConteudoCampanha;
