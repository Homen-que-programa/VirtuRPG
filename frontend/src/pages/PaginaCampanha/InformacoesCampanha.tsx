import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Campanha } from '../../types';
import { useAuth } from '../../context/AuthContext';

const InformacoesCampanha = () => {
  const { campanha } = useOutletContext<{ campanha: Campanha }>();
  const { accessToken, user } = useAuth();

  const [nome, setNome] = useState<string>(campanha.nome || '');
  const [descricao, setDescricao] = useState<string>(campanha.descricao || '');
  const [sistemaId, setSistemaId] = useState<number | null>(campanha.sistema_id ?? null);
  const [status, setStatus] = useState<string>(campanha.status || '');
  const [imagemUrl, setImagemUrl] = useState<string>(campanha.imagem_url || '');

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [sistemaProprio, setSistemaProprio] = useState(false);
  const [sistemaProprioNome, setSistemaProprioNome] = useState('');

  const [sistemas, setSistemas] = useState<Array<{id:number,nome:string}>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/sistemas')
      .then(r => r.json())
      .then(d => setSistemas(d.sistemas || []))
      .catch(() => setSistemas([]));
  }, []);

  useEffect(() => {
    setNome(campanha.nome || '');
    setDescricao(campanha.descricao || '');
    setSistemaId(campanha.sistema_id ?? null);
    setStatus(campanha.status || '');
    setSelectedTags(campanha.tags ? campanha.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const hasCustomSistema = (campanha.sistema && (campanha.sistema_id == null || campanha.sistema_id === undefined));
    setSistemaProprio(!!hasCustomSistema);
    setSistemaProprioNome(hasCustomSistema ? (campanha.sistema as string) : '');
    setImagemUrl(campanha.imagem_url || '');
  }, [campanha]);

  const isMestreOrAdmin = user && (user.nome === campanha.mestre); // quick front check; backend enforces

  const salvar = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: any = { nome, descricao, status, tags: (selectedTags.join(',')), imagem_url: imagemUrl };
      if (sistemaProprio && sistemaProprioNome.trim()) {
        body.sistema = sistemaProprioNome.trim();
        body.sistema_id = null;
      } else if (sistemaId !== null) {
        body.sistema_id = sistemaId;
      }

      const res = await fetch(`http://localhost:3000/campanha/${campanha.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Erro ao salvar campanha');
      }
      return true;
    } catch (err: any) {
      setError(err.message || String(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sistemaNome = sistemas.find(s => s.id === (sistemaId ?? campanha.sistema_id))?.nome || '';
  const sistemaDisplayNome = isEditing
    ? (sistemaProprio ? sistemaProprioNome : sistemaNome)
    : (campanha.sistema || sistemaNome || '');

  return (
  <section id="informacoes" className="config-page">
      <div className="informacoes-header">
        <h2>Informações da Campanha</h2>

        {isMestreOrAdmin ? (
          !isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn edit-btn-top">Editar</button>
          ) : (
            <div className="edit-actions">
              <button onClick={async () => { const ok = await salvar(); if (ok) setIsEditing(false); }} disabled={saving} className="btn">{saving ? 'Salvando...' : 'Salvar'}</button>
              <button onClick={() => {
                // revert local edits
                setNome(campanha.nome || '');
                setDescricao(campanha.descricao || '');
                setSistemaId(campanha.sistema_id ?? null);
                setStatus(campanha.status || '');
                setSelectedTags(campanha.tags ? campanha.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
                const hasCustomSistema = (campanha.sistema && (campanha.sistema_id == null || campanha.sistema_id === undefined));
                setSistemaProprio(!!hasCustomSistema);
                setSistemaProprioNome(hasCustomSistema ? (campanha.sistema as string) : '');
                setImagemUrl(campanha.imagem_url || '');
                setError(null);
                setIsEditing(false);
              }} disabled={saving} className="btn" style={{ marginLeft: 8 }}>Cancelar</button>
            </div>
          )
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Apenas o mestre/administrador pode editar.</div>
        )}
      </div>

      <div className="config-container">
        <div className="config-section">
          <h3>Geral</h3>
          <div className="info-grid">
            <div className="info-row">
              <div className="info-label">Nome</div>
              <div className="info-value">{isEditing ? <input value={nome} onChange={e => setNome(e.target.value)} /> : (nome || '—')}</div>
            </div>

            <div className="info-row">
              <div className="info-label">Mestre</div>
              <div className="info-value">{campanha.mestre || '—'}</div>
            </div>

            <div className="info-row">
              <div className="info-label">Descrição</div>
              <div className="info-value">{isEditing ? <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} /> : (descricao || '—')}</div>
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>Sistema & Aparência</h3>
          <div className="info-grid">
            <div className="info-row">
              <div className="info-label">Sistema</div>
              <div className="info-value">
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={sistemaProprio ? '' : (sistemaId ?? '')} onChange={e => setSistemaId(e.target.value ? Number(e.target.value) : null)} disabled={sistemaProprio}>
                      <option value="">— Selecionar —</option>
                      {sistemas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                      <input type="checkbox" checked={sistemaProprio} onChange={e => setSistemaProprio(e.target.checked)} /> Sistema próprio
                    </label>
                    {sistemaProprio && <input placeholder="Nome do sistema" value={sistemaProprioNome} onChange={e => setSistemaProprioNome(e.target.value)} />}
                  </div>
                ) : (sistemaDisplayNome || '—')}
              </div>
            </div>

            <div className="info-row">
              <div className="info-label">Imagem</div>
              <div className="info-value image-cell">
                {isEditing ? (
                  <input value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} />
                ) : (
                  imagemUrl ? <img src={imagemUrl} alt="capa" className="info-img" /> : '—'
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>Metadados</h3>
          <div className="info-grid">
            <div className="info-row">
              <div className="info-label">Status</div>
              <div className="info-value">{isEditing ? <input value={status} onChange={e => setStatus(e.target.value)} /> : (status || '—')}</div>
            </div>

            <div className="info-row">
              <div className="info-label">Tags</div>
              <div className="info-value">
                {isEditing ? (
                  <div>
                    <div className="tag-list">
                      {selectedTags.map(t => (
                        <span key={t} className="tag-badge">{t} <button type="button" className="tag-remove" onClick={() => setSelectedTags(prev => prev.filter(x => x !== t))}>✕</button></span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input placeholder="Adicionar tag" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = tagInput.trim(); if (v && !selectedTags.includes(v)) { setSelectedTags(prev => [...prev, v]); setTagInput(''); } } }} />
                      <button className="btn" onClick={() => { const v = tagInput.trim(); if (v && !selectedTags.includes(v)) { setSelectedTags(prev => [...prev, v]); setTagInput(''); } }}>Adicionar</button>
                    </div>
                    <div className="tag-suggestions" style={{ marginTop: 8 }}>
                      {/* small suggestions - could be fetched from API */}
                      {['fantasia','mistério','horror','investigação','aventura longa'].map(sug => (
                        <button key={sug} type="button" className="btn" style={{ marginRight: 6, marginTop: 6 }} onClick={() => { if (!selectedTags.includes(sug)) setSelectedTags(prev => [...prev, sug]); }}>{sug}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  selectedTags.length ? selectedTags.map(t => <span key={t} className="tag-badge">{t}</span>) : '—'
                )}
              </div>
            </div>

            <div className="info-row">
              <div className="info-label">Criada em</div>
              <div className="info-value">{campanha.criado_em ? new Date(campanha.criado_em).toLocaleString() : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--accent-red-light)', marginTop: 8 }}>{error}</div>}
    </section>
  );
};

export default InformacoesCampanha;
