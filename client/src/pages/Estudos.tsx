import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

interface Section { label: string; value: string; }
interface StudyCard {
  id: number;
  title: string;
  subtitle: string | null;
  color: string;
  sections: Section[];
}

const COLORS = ['#f2d24b', '#1c1b17', '#4d9e5f', '#cf5a4e', '#c98a2c', '#5b7fd4'];

const EMPTY: Omit<StudyCard, 'id'> = { title: '', subtitle: '', color: COLORS[0], sections: [] };

export function Estudos() {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [editing, setEditing] = useState<StudyCard | (typeof EMPTY & { id?: number }) | null>(null);

  const load = useCallback(async () => {
    setCards(await api.get<StudyCard[]>('/studies'));
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const save = async () => {
    if (!editing || !editing.title.trim()) return;
    const payload = {
      title: editing.title.trim(),
      subtitle: editing.subtitle?.trim() || null,
      color: editing.color,
      sections: editing.sections.filter((s) => s.label.trim() || s.value.trim()),
    };
    if ('id' in editing && editing.id) {
      await api.put(`/studies/${editing.id}`, payload);
    } else {
      await api.post('/studies', payload);
    }
    setEditing(null);
    load();
  };

  const remove = async (id: number) => {
    await api.del(`/studies/${id}`);
    setEditing(null);
    load();
  };

  const setSection = (idx: number, patch: Partial<Section>) => {
    if (!editing) return;
    const sections = editing.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setEditing({ ...editing, sections });
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Estudos</h1>
          <p className="lead">
            Cartões livres do que você está estudando — organize o conteúdo do seu jeito.
          </p>
        </div>
        <button className="btn btn-yellow" onClick={() => setEditing({ ...EMPTY, sections: [{ label: 'Anotações', value: '' }] })}>
          + Novo cartão
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="card card-warm" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>Nenhum cartão ainda</h3>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>
            Crie um cartão para cada assunto que estiver estudando: uma matéria da faculdade, um
            curso, uma tecnologia nova...
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {cards.map((c) => (
            <div key={c.id} className="click-card" onClick={() => setEditing(c)}>
              <div className="accent-bar" style={{ background: c.color }} />
              <h3>{c.title}</h3>
              {c.subtitle && (
                <p className="stat-sub" style={{ marginTop: '0.2rem' }}>{c.subtitle}</p>
              )}
              <p className="text-faint" style={{ fontSize: '0.8rem', marginTop: '0.7rem' }}>
                {c.sections.length} {c.sections.length === 1 ? 'seção' : 'seções'} — clique para
                abrir
              </p>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{'id' in editing && editing.id ? 'Editar cartão' : 'Novo cartão'}</h2>
              <button className="btn btn-sm" onClick={() => setEditing(null)}>
                Fechar
              </button>
            </div>

            <div className="form-row" style={{ marginBottom: '0.8rem' }}>
              <div className="form-field" style={{ flex: 2 }}>
                <span className="label">Título</span>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="ex: Estrutura de Dados"
                />
              </div>
              <div className="form-field">
                <span className="label">Subtítulo</span>
                <input
                  value={editing.subtitle || ''}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  placeholder="opcional"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span className="label">Cor do cartão</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditing({ ...editing, color })}
                    style={{
                      width: '1.8rem',
                      height: '1.8rem',
                      borderRadius: '50%',
                      background: color,
                      border: editing.color === color ? '3px solid var(--text)' : '2px solid var(--border-strong)',
                      cursor: 'pointer',
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="label">Seções de conteúdo</span>
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    setEditing({ ...editing, sections: [...editing.sections, { label: '', value: '' }] })
                  }
                >
                  + Seção
                </button>
              </div>
              {editing.sections.length === 0 && (
                <p className="text-faint" style={{ fontSize: '0.85rem' }}>
                  Adicione seções personalizadas: anotações, links, capítulos, exercícios...
                </p>
              )}
              {editing.sections.map((s, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{ padding: '0.9rem 1rem', marginBottom: '0.6rem', background: '#fff' }}
                >
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <input
                      value={s.label}
                      onChange={(e) => setSection(idx, { label: e.target.value })}
                      placeholder="Nome da seção (ex: Links úteis)"
                      style={{ fontWeight: 600 }}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() =>
                      setEditing({ ...editing, sections: editing.sections.filter((_, i) => i !== idx) })
                    }>
                      Remover
                    </button>
                  </div>
                  <textarea
                    value={s.value}
                    onChange={(e) => setSection(idx, { value: e.target.value })}
                    placeholder="Conteúdo da seção..."
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
              {'id' in editing && editing.id ? (
                <button className="btn btn-ghost" onClick={() => remove(editing.id!)}>
                  Excluir cartão
                </button>
              ) : (
                <span />
              )}
              <button className="btn btn-primary" onClick={save}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
