import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import type { Campanha } from '../../types';

interface Sala {
  id: number;
  nome: string;
  campanha_id: number;
  criado_por: number;
  criada_em: string;
}

interface Mensagem {
  id: number;
  sala_id: number;
  usuario_id: number;
  mensagem: string;
  enviada_em: string;
  nome: string;
  apelido: string;
}

const ChatCampanha = () => {
  const { campanha } = useOutletContext<{ campanha: Campanha }>();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [salaAtiva, setSalaAtiva] = useState<number | null>(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [nomeNovaSala, setNomeNovaSala] = useState('');
  const { accessToken, user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useSocket('http://localhost:3000', { token: accessToken }, { enabled: Boolean(accessToken) });

  useEffect(() => {
    fetchSalas();
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;
    if (salaAtiva) {
      fetchMensagens(salaAtiva);
      socket.emit('entrarSalaChat', salaAtiva);
    }

    return () => {
      if (salaAtiva) {
        socket.emit('sairSalaChat', salaAtiva);
      }
    };
  }, [salaAtiva, socket]);

  useEffect(() => {
    if (!socket) return;
    const handler = (mensagem: Mensagem) => setMensagens(prev => [...prev, mensagem]);
    socket.on('novaMensagem', handler);
    return () => {
      socket.off('novaMensagem', handler);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const fetchSalas = async () => {
    try {
      const res = await fetch(`http://localhost:3000/campanhas/${campanha.id}/salas`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setSalas(data);
      if (data.length > 0 && !salaAtiva) {
        setSalaAtiva(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar salas:', err);
    }
  };

  const fetchMensagens = async (salaId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/salas/${salaId}/mensagens`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setMensagens(data);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  };

  const criarSala = async () => {
    if (!nomeNovaSala.trim()) return;

    try {
      const res = await fetch(`http://localhost:3000/campanhas/${campanha.id}/salas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ nome: nomeNovaSala, usuarioId: user?.id })
      });

      if (res.ok) {
        setNomeNovaSala('');
        fetchSalas();
      }
    } catch (err) {
      console.error('Erro ao criar sala:', err);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !salaAtiva) return;

    try {
      const res = await fetch(`http://localhost:3000/salas/${salaAtiva}/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ mensagem: novaMensagem, usuarioId: user?.id })
      });

      if (res.ok) {
        setNovaMensagem('');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      enviarMensagem();
    }
  };

  return (
    <section id="chat">
      <div className="chat-container">
        <div className="chat-sidebar">
          <h4>Salas de Chat</h4>
          <div className="create-room-section">
            <input
              type="text"
              placeholder="Nome da nova sala"
              value={nomeNovaSala}
              onChange={(e) => setNomeNovaSala(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && criarSala()}
            />
            <button className="btn btn-create-room" onClick={criarSala}>Criar</button>
          </div>
          <ul className="rooms-list">
            {salas.map((sala) => (
              <li
                key={sala.id}
                className={`room-item ${salaAtiva === sala.id ? 'active' : ''}`}
                onClick={() => setSalaAtiva(sala.id)}
              >
                {sala.nome}
              </li>
            ))}
          </ul>
        </div>
        <div className="chat-main">
          {salaAtiva ? (
            <>
              <div className="chat-messages">
                {mensagens.map((msg) => (
                  <div key={msg.id} className="message">
                    <strong>{msg.apelido || msg.nome}:</strong> {msg.mensagem}
                    <div className="message-time">
                      {new Date(msg.enviada_em).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button className="btn" onClick={enviarMensagem}>Enviar</button>
              </div>
            </>
          ) : (
            <div className="no-room-selected">
              <p>Selecione uma sala para começar a conversar.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ChatCampanha;
