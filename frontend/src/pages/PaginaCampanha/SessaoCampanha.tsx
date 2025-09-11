import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Campanha } from '../../types';
import { useAuth } from '../../context/AuthContext';

const SessaoCampanha = () => {
  const { campanha } = useOutletContext<{ campanha: Campanha }>();
  const { accessToken, user } = useAuth();

  const [datetime, setDatetime] = useState<string | null>(campanha.next_session_datetime || '');
  const [local, setLocal] = useState<string>(campanha.next_session_local || '');
  const [link, setLink] = useState<string>(campanha.next_session_link || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setDatetime(campanha.next_session_datetime || '');
    setLocal(campanha.next_session_local || '');
    setLink(campanha.next_session_link || '');
  }, [campanha.next_session_datetime, campanha.next_session_local, campanha.next_session_link]);

  const isAuthorized = user && (user.nome === campanha.mestre); // front-side quick check; server enforces properly

  const saveNextSession = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`http://localhost:3000/campanha/${campanha.id}/next-session`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ datetime: datetime || null, local: local || null, link: link || null }),
      });
      if (!res.ok) throw new Error('Erro ao salvar próxima sessão');
  await res.json();
  setMsg('Próxima sessão salva');
    } catch (err: any) {
      setMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="sessao">
      <h3>Mestra Sessão</h3>
      <p>Campanha: {campanha.nome}</p>

      <div style={{ marginTop: 12 }}>
        <h4>Próxima Sessão</h4>
        <p><strong>Data/Hora:</strong> {campanha.next_session_datetime ? new Date(campanha.next_session_datetime).toLocaleString() : '—'}</p>
        <p><strong>Local:</strong> {campanha.next_session_local || '—'}</p>
        <p><strong>Link:</strong> {campanha.next_session_link ? <a href={campanha.next_session_link}>{campanha.next_session_link}</a> : '—'}</p>
      </div>

      {isAuthorized ? (
        <div style={{ marginTop: 12 }}>
          <h4>Agendar/Editar Próxima Sessão</h4>
          <label>
            Data/Hora
            <input type="datetime-local" value={datetime || ''} onChange={e => setDatetime(e.target.value)} />
          </label>
          <br />
          <label>
            Local
            <input type="text" value={local} onChange={e => setLocal(e.target.value)} style={{ width: '100%' }} />
          </label>
          <br />
          <label>
            Link de convite
            <input type="url" value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%' }} />
          </label>
          <div style={{ marginTop: 8 }}>
            <button onClick={saveNextSession} disabled={loading} className="btn">{loading ? 'Salvando...' : 'Salvar próxima sessão'}</button>
            {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
          </div>
        </div>
      ) : (
        <p style={{ marginTop: 12 }}>Apenas o mestre / equipe pode agendar a próxima sessão.</p>
      )}
    </section>
  );
};

export default SessaoCampanha;
