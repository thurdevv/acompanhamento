import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

interface ProjectTask { id: number; title: string; done: boolean; }
interface Project {
  id: number;
  name: string;
  status: string;
  company: string | null;
  repo_url: string | null;
  technologies: string[];
  tasks: ProjectTask[];
}

const STATUSES = ['Ideia', 'Em andamento', 'Pausado', 'Concluído'];

function statusBadge(status: string): string {
  switch (status) {
    case 'Concluído': return 'badge-green';
    case 'Em andamento': return 'badge-yellow';
    case 'Pausado': return 'badge-amber';
    default: return 'badge-outline';
  }
}

export function Projetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTask, setNewTask] = useState('');
  const [techInput, setTechInput] = useState('');

  const load = useCallback(async () => {
    const list = await api.get<Project[]>('/projects');
    setProjects(list);
    setSelected((prev) => (prev ? list.find((p) => p.id === prev.id) || null : null));
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const createProject = async () => {
    if (!newName.trim()) return;
    const p = await api.post<Project>('/projects', { name: newName.trim() });
    setNewName('');
    setCreating(false);
    await load();
    setSelected(p);
    setTechInput('');
  };

  const updateProject = async (patch: Partial<Project>) => {
    if (!selected) return;
    const updated = { ...selected, ...patch };
    await api.put(`/projects/${selected.id}`, {
      name: updated.name,
      status: updated.status,
      company: updated.company,
      repo_url: updated.repo_url,
      technologies: updated.technologies,
    });
    load();
  };

  const addTask = async () => {
    if (!selected || !newTask.trim()) return;
    await api.post(`/projects/${selected.id}/tasks`, { title: newTask.trim() });
    setNewTask('');
    load();
  };

  const openProject = (p: Project) => {
    setSelected(p);
    setTechInput(p.technologies.join(', '));
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Projetos</h1>
          <p className="lead">
            Seus projetos de programação — clique em um cartão para ver e editar os detalhes.
          </p>
        </div>
        <button className="btn btn-yellow" onClick={() => setCreating(true)}>
          + Novo projeto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card card-warm" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>Nenhum projeto ainda</h3>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>
            Cadastre seus projetos com status, tarefas, tecnologias, repositório e empresa.
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {projects.map((p) => {
            const doneCount = p.tasks.filter((t) => t.done).length;
            return (
              <div key={p.id} className="click-card" onClick={() => openProject(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <h3>{p.name}</h3>
                  <span className={`badge ${statusBadge(p.status)}`}>{p.status}</span>
                </div>
                {p.company && <p className="stat-sub">{p.company}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.7rem' }}>
                  {p.technologies.slice(0, 4).map((t) => (
                    <span key={t} className="tech-tag">{t}</span>
                  ))}
                  {p.technologies.length > 4 && (
                    <span className="tech-tag">+{p.technologies.length - 4}</span>
                  )}
                </div>
                <p className="text-faint num" style={{ fontSize: '0.8rem', marginTop: '0.7rem' }}>
                  {p.tasks.length > 0
                    ? `${doneCount}/${p.tasks.length} tarefas concluídas (${Math.round((doneCount / p.tasks.length) * 100)}%)`
                    : 'sem tarefas'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <h2>Novo projeto</h2>
              <button className="btn btn-sm" onClick={() => setCreating(false)}>Fechar</button>
            </div>
            <div className="form-field" style={{ marginBottom: '1rem' }}>
              <span className="label">Nome do projeto</span>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                placeholder="ex: API de conciliação"
              />
            </div>
            <button className="btn btn-primary" onClick={createProject}>Criar</button>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="label">Projeto</span>
                <h2 style={{ marginTop: '0.2rem' }}>{selected.name}</h2>
              </div>
              <button className="btn btn-sm" onClick={() => setSelected(null)}>Fechar</button>
            </div>

            <div className="form-row" style={{ marginBottom: '0.8rem' }}>
              <div className="form-field">
                <span className="label">Status</span>
                <select
                  value={selected.status}
                  onChange={(e) => updateProject({ status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <span className="label">Empresa / cliente</span>
                <input
                  defaultValue={selected.company || ''}
                  placeholder="ex: JFX Engenharia"
                  onBlur={(e) => updateProject({ company: e.target.value.trim() || null })}
                />
              </div>
            </div>

            <div className="form-field" style={{ marginBottom: '0.8rem' }}>
              <span className="label">Repositório</span>
              <input
                defaultValue={selected.repo_url || ''}
                placeholder="https://github.com/..."
                onBlur={(e) => updateProject({ repo_url: e.target.value.trim() || null })}
              />
            </div>
            {selected.repo_url && (
              <p style={{ marginBottom: '0.8rem', fontSize: '0.85rem' }}>
                <a href={selected.repo_url} target="_blank" rel="noreferrer">
                  Abrir repositório ↗
                </a>
              </p>
            )}

            <div className="form-field" style={{ marginBottom: '1rem' }}>
              <span className="label">Tecnologias (separadas por vírgula)</span>
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onBlur={() =>
                  updateProject({
                    technologies: techInput
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="ex: Node.js, React, PostgreSQL"
              />
            </div>
            {selected.technologies.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.1rem' }}>
                {selected.technologies.map((t) => (
                  <span key={t} className="tech-tag">{t}</span>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '1.2rem' }}>
              <span className="label">Tarefas / próximos passos</span>
              <div style={{ marginTop: '0.5rem' }}>
                {selected.tasks.map((t) => (
                  <div key={t.id} className="task-row">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) =>
                        api
                          .put(`/projects/tasks/${t.id}`, { done: e.target.checked })
                          .then(load)
                      }
                    />
                    <span className={`task-title ${t.done ? 'done' : ''}`}>{t.title}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => api.del(`/projects/tasks/${t.id}`).then(load)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="form-row" style={{ marginTop: '0.6rem' }}>
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Nova tarefa..."
                />
                <button className="btn btn-primary btn-sm" onClick={addTask}>
                  Adicionar
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                className="btn btn-ghost"
                onClick={() => api.del(`/projects/${selected.id}`).then(() => { setSelected(null); load(); })}
              >
                Excluir projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
