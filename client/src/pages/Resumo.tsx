import { useEffect, useState } from 'react';
import { api, currentMonth, formatBRL, todayISO } from '../api';

interface DayData {
  water_total_ml: number;
  water_goal_ml: number;
  sleep: { hours: string } | null;
  sleep_goal_h: number;
  meals: { id: number }[];
}
interface MonthData {
  totals: { receitas: string; despesas: string };
}
interface StudyCard { id: number; title: string; }
interface Project { id: number; name: string; status: string; tasks: { done: boolean }[]; }

export function Resumo({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [day, setDay] = useState<DayData | null>(null);
  const [month, setMonth] = useState<MonthData | null>(null);
  const [studies, setStudies] = useState<StudyCard[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<DayData>(`/health/day?date=${todayISO()}`),
      api.get<MonthData>(`/finance/month?month=${currentMonth()}`),
      api.get<StudyCard[]>('/studies'),
      api.get<Project[]>('/projects'),
    ])
      .then(([d, m, s, p]) => {
        setDay(d);
        setMonth(m);
        setStudies(s);
        setProjects(p);
      })
      .catch((e) => setError(String(e.message || e)));
  }, []);

  if (error) {
    return (
      <div className="card card-warm" style={{ padding: '2rem' }}>
        <h2>Não consegui falar com o servidor</h2>
        <p className="text-muted" style={{ marginTop: '0.6rem', maxWidth: '65ch' }}>
          Verifique se a API está rodando (pasta <code>server</code>, comando{' '}
          <code>npm run dev</code>) e se a senha do PostgreSQL está correta no arquivo{' '}
          <code>server/.env</code>.
        </p>
      </div>
    );
  }

  if (!day || !month) return <p className="text-muted">Carregando...</p>;

  const waterPct = Math.round((day.water_total_ml / day.water_goal_ml) * 100);
  const sleepH = day.sleep ? Number(day.sleep.hours) : null;
  const saldo = Number(month.totals.receitas) - Number(month.totals.despesas);
  const activeProjects = projects.filter((p) => p.status === 'Em andamento').length;
  const pendingTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => !t.done).length,
    0
  );

  return (
    <div>
      <div className="page-header">
        <h1>
          Bem-vindo de volta<span style={{ color: 'var(--yellow-strong)' }}>.</span>
        </h1>
        <p className="lead">
          Visão rápida do seu dia e do mês — saúde, finanças, estudos e projetos em um só lugar.
        </p>
      </div>

      <div className="grid grid-stats">
        <div className="card card-warm" style={{ cursor: 'pointer' }} onClick={() => onNavigate('saude')}>
          <span className="label">Água hoje</span>
          <div className="stat-value num" style={{ fontSize: '1.9rem', marginTop: '0.4rem' }}>
            {day.water_total_ml} ml
          </div>
          <div className="stat-sub num">
            <strong className={waterPct >= 90 ? 'pct-good' : waterPct >= 50 ? 'pct-mid' : 'pct-low'}>
              {waterPct}%
            </strong>{' '}
            da meta de {day.water_goal_ml} ml
          </div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('saude')}>
          <span className="label">Sono da última noite</span>
          <div className="stat-value num" style={{ fontSize: '1.9rem', marginTop: '0.4rem' }}>
            {sleepH !== null ? `${sleepH}h` : '—'}
          </div>
          <div className="stat-sub num">
            {sleepH !== null
              ? `${Math.round((sleepH / day.sleep_goal_h) * 100)}% da meta de ${day.sleep_goal_h}h`
              : 'ainda não registrado'}
          </div>
        </div>

        <div className="card card-dark" style={{ cursor: 'pointer' }} onClick={() => onNavigate('financas')}>
          <span className="label">Saldo do mês</span>
          <div
            className={`stat-value num ${saldo >= 0 ? 'pct-good' : 'pct-low'}`}
            style={{ fontSize: '1.9rem', marginTop: '0.4rem' }}
          >
            {formatBRL(saldo)}
          </div>
          <div className="stat-sub num">
            {formatBRL(month.totals.receitas)} recebidos · {formatBRL(month.totals.despesas)} gastos
          </div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('projetos')}>
          <span className="label">Projetos</span>
          <div className="stat-value num" style={{ fontSize: '1.9rem', marginTop: '0.4rem' }}>
            {activeProjects}
          </div>
          <div className="stat-sub num">
            em andamento · {pendingTasks} {pendingTasks === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '1rem' }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('estudos')}>
          <div className="card-title">
            <h3>Estudando agora</h3>
            <span className="badge badge-yellow num">{studies.length}</span>
          </div>
          {studies.length === 0 ? (
            <p className="text-faint">Nenhum cartão de estudo criado ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {studies.slice(0, 8).map((s) => (
                <span key={s.id} className="badge badge-outline">{s.title}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card card-dark">
          <div className="card-title">
            <h3 style={{ color: 'var(--text-on-dark)' }}>Sua rotina</h3>
          </div>
          <div className="dark-list-item">Seg–Qui · trabalho 07h às 17h</div>
          <div className="dark-list-item">Sexta · trabalho 07h às 16h</div>
          <div className="dark-list-item">Noite · faculdade de ADS</div>
          <div className="dark-list-item">Salário · até o 5º dia útil</div>
        </div>
      </div>
    </div>
  );
}
