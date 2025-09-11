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
  const [showStatusModal, setShowStatusModal] = useState(false);

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

  const statusOptions = [
    { value: 'ativa', label: 'Ativa', color: '#2ecc71' },
    { value: 'recrutamento', label: 'Recrutamento', color: '#f1c40f' },
    { value: 'pausada', label: 'Pausada', color: '#95a5a6' },
    { value: 'concluida', label: 'Concluída', color: '#3498db' },
    { value: 'privada', label: 'Privada', color: '#9b59b6' }
  ];

  const salvarStatus = async (novoStatus: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/campanha/${campanha.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Erro ao salvar status');
      }
      setStatus(novoStatus);
      setShowStatusModal(false);
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

  // Nova informação sumarizada para mostrar ao usuário
  const playersCount = (campanha.jogadores && campanha.jogadores.length) ? campanha.jogadores.length : 0;
  const tagsCount = selectedTags.length;
  const shortDescription = descricao ? (descricao.length > 220 ? descricao.slice(0, 217) + '...' : descricao) : 'Sem descrição disponível.';
  const criadoEm = campanha.criado_em ? new Date(campanha.criado_em).toLocaleDateString() : '—';

  return (
    <section id="informacoes" className="config-page">
      <div className="campanha-header">
        <div className="titulo-e-status">
          <h1 className="campanha-titulo">{nome || 'Campanha sem nome'}</h1>
          <div className="status-display">
            <span className={`status-badge status-${status || 'nao-definido'}`}>
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Sem status'}
            </span>
            {isMestreOrAdmin && (
              <button onClick={() => setShowStatusModal(true)} className="btn-status-definir">
                Definir Status
              </button>
            )}
          </div>
        </div>
        {isMestreOrAdmin && (
          !isEditing ? (
            <button onClick={() => setIsEditing(true)} className="edit-btn-discreto">Editar</button>
          ) : (
            <div className="edit-actions">
              <button onClick={async () => { const ok = await salvar(); if (ok) setIsEditing(false); }} disabled={saving} className="btn-salvar">{saving ? 'Salvando...' : 'Salvar'}</button>
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
              }} disabled={saving} className="btn-cancelar">Cancelar</button>
            </div>
          )
        )}
      </div>

      {/* Linha de resumo com cards que ocupam mais espaço visual */}
      <div className="resumo-row">
        <div className="resumo-card">
          <div className="resumo-title">Jogadores</div>
          <div className="resumo-value">{playersCount}</div>
          <div className="resumo-note">Participantes ativos na campanha</div>
        </div>

        <div className="resumo-card">
          <div className="resumo-title">Status</div>
          <div className="resumo-value">{status || '—'}</div>
          <div className="resumo-note">Estado atual e disponibilidade</div>
        </div>

        <div className="resumo-card">
          <div className="resumo-title">Tags</div>
          <div className="resumo-value">{tagsCount}</div>
          <div className="resumo-note">Categorias breves que descrevem a campanha</div>
        </div>

        <div className="resumo-card">
          <div className="resumo-title">Criada em</div>
          <div className="resumo-value">{criadoEm}</div>
          <div className="resumo-note">Data de criação</div>
        </div>
      </div>

      {descricao && (
        <div className="campanha-intro">
          {isEditing ? (
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} placeholder="Descrição da campanha..." />
          ) : (
            <p>{shortDescription}</p>
          )}
        </div>
      )}

      <div className="info-secao">
        <h3>Detalhes da Campanha</h3>
        <div className="info-item">
          <div className="info-label">Mestre</div>
          <div className="info-value">{campanha.mestre || '—'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Status</div>
          <div className="info-value">
            {isEditing ? (
              <select value={status} onChange={e => setStatus(e.target.value)} className="status-select">
                <option value="">— Selecionar status —</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`status-badge status-${status || 'nao-definido'}`}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Sem status'}
              </span>
            )}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Criada em</div>
          <div className="info-value">{campanha.criado_em ? new Date(campanha.criado_em).toLocaleString() : '—'}</div>
        </div>
      </div>

      <div className="info-secao">
        <h3>Sistema de Jogo</h3>
        <div className="info-item">
          <div className="info-label">Sistema</div>
          <div className="info-value">
            {isEditing ? (
              <div className="sistema-controls">
                <div className="sistema-row">
                  <select value={sistemaProprio ? '' : (sistemaId ?? '')} onChange={e => setSistemaId(e.target.value ? Number(e.target.value) : null)} disabled={sistemaProprio}>
                    <option value="">— Selecionar sistema —</option>
                    {sistemas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <input type="checkbox" checked={sistemaProprio} onChange={e => setSistemaProprio(e.target.checked)} /> Sistema próprio
                  </label>
                </div>
                {sistemaProprio && (
                  <input placeholder="Nome do sistema próprio" value={sistemaProprioNome} onChange={e => setSistemaProprioNome(e.target.value)} />
                )}
              </div>
            ) : (sistemaDisplayNome || '—')}
          </div>
        </div>
      </div>

      <div className="info-secao">
        <h3>Visual</h3>
        <div className="info-item">
          <div className="info-label">Imagem de Capa</div>
          <div className="info-value image-cell">
            {isEditing ? (
              <input value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} placeholder="URL da imagem" />
            ) : (
              imagemUrl ? <img src={imagemUrl} alt="Capa da campanha" className="info-img" /> : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Nenhuma imagem definida</span>
            )}
          </div>
        </div>
      </div>

      <div className="info-secao">
        <h3>Categorias</h3>
        <div className="info-item">
          <div className="info-label">Tags</div>
          <div className="info-value">
            {isEditing ? (
              <div>
                <div className="tag-list">
                  {selectedTags.map(t => (
                    <span key={t} className="tag-badge">{t} <button type="button" className="tag-remove" onClick={() => setSelectedTags(prev => prev.filter(x => x !== t))}>×</button></span>
                  ))}
                </div>
                <div className="tag-input-group">
                  <input placeholder="Adicionar tag" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = tagInput.trim(); if (v && !selectedTags.includes(v)) { setSelectedTags(prev => [...prev, v]); setTagInput(''); } } }} />
                  <button className="btn" onClick={() => { const v = tagInput.trim(); if (v && !selectedTags.includes(v)) { setSelectedTags(prev => [...prev, v]); setTagInput(''); } }}>Adicionar</button>
                </div>
                <div className="tag-suggestions">
                  <div style={{ marginBottom: 12, fontSize: '0.9rem', opacity: 0.8 }}>Sugestões:</div>
                  {['fantasia','mistério','horror','investigação','aventura longa'].map(sug => (
                    <button key={sug} type="button" className="btn" onClick={() => { if (!selectedTags.includes(sug)) setSelectedTags(prev => [...prev, sug]); }}>{sug}</button>
                  ))}
                </div>
              </div>
            ) : (
              selectedTags.length ? (
                <div className="tag-list">
                  {selectedTags.map(t => <span key={t} className="tag-badge">{t}</span>)}
                </div>
              ) : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Nenhuma tag definida</span>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Modal de seleção rápida de status */}
      {showStatusModal && (
        <div className="status-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="status-modal" onClick={e => e.stopPropagation()}>
            <h3>Definir Status da Campanha</h3>
            <div className="status-options">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  className="status-option-btn"
                  style={{ borderColor: option.color }}
                  onClick={() => salvarStatus(option.value)}
                  disabled={saving}
                >
                  <div className="status-color" style={{ backgroundColor: option.color }}></div>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowStatusModal(false)} className="btn-cancelar" style={{ marginTop: 16 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default InformacoesCampanha;
