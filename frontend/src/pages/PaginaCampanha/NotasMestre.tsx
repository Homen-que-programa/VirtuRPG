import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Campanha } from '../../types';
import { useAuth } from '../../context/AuthContext';

const NotasMestre = () => {
  const { campanha } = useOutletContext<{ campanha: Campanha }>();
  const { user } = useAuth();

  const [notas, setNotas] = useState<string>(campanha.notas || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isMestre = user && campanha.mestres?.includes(user.nome);

  useEffect(() => {
    setNotas(campanha.notas || '');
  }, [campanha.notas]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`http://localhost:3000/campanha/${campanha.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas }),
      });
      if (!res.ok) throw new Error('Erro ao salvar notas');
      setMsg('Notas salvas');
    } catch (err: any) {
      setMsg(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2>Notas do Mestre</h2>
      {isMestre ? (
        <div>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={10} style={{ width: '100%' }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={save} disabled={saving} className="btn">{saving ? 'Salvando...' : 'Salvar'}</button>
            {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
          </div>
        </div>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', padding: 8, background: '#f6f6f6' }}>{campanha.notas || 'Sem notas do mestre.'}</div>
      )}
    </section>
  );
};

export default NotasMestre;
