import { useCallback, useEffect, useState } from 'react';
import { api, todayISO, formatDateBR } from '../api';

interface WaterLog { id: number; amount_ml: number; }
interface Meal { id: number; meal_type: string; description: string; healthy: boolean; }
interface DayData {
  date: string;
  water_total_ml: number;
  water_goal_ml: number;
  water_logs: WaterLog[];
  sleep: { id: number; hours: string; quality: string | null } | null;
  sleep_goal_h: number;
  meals: Meal[];
}
interface HistoryRow {
  date: string;
  water_ml: number;
  sleep_hours: string | null;
  meals_count: number;
  healthy_meals: number;
}

function pctClass(pct: number): string {
  if (pct >= 90) return 'pct-good';
  if (pct >= 50) return 'pct-mid';
  return 'pct-low';
}

export function Saude() {
  const [date, setDate] = useState(todayISO());
  const [day, setDay] = useState<DayData | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('Boa');
  const [mealType, setMealType] = useState('Almoço');
  const [mealDesc, setMealDesc] = useState('');
  const [mealHealthy, setMealHealthy] = useState(true);
  const [customWater, setCustomWater] = useState('');

  const load = useCallback(async () => {
    const [d, h] = await Promise.all([
      api.get<DayData>(`/health/day?date=${date}`),
      api.get<HistoryRow[]>('/health/history?days=7'),
    ]);
    setDay(d);
    setHistory(h);
    setSleepHours(d.sleep ? String(Number(d.sleep.hours)) : '');
    setSleepQuality(d.sleep?.quality || 'Boa');
  }, [date]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  if (!day) return <p className="text-muted">Carregando...</p>;

  const waterPct = Math.round((day.water_total_ml / day.water_goal_ml) * 100);
  const sleepH = day.sleep ? Number(day.sleep.hours) : 0;
  const sleepPct = Math.round((sleepH / day.sleep_goal_h) * 100);
  const healthyCount = day.meals.filter((m) => m.healthy).length;

  const addWater = async (ml: number) => {
    if (!ml || ml <= 0) return;
    await api.post('/health/water', { date, amount_ml: ml });
    setCustomWater('');
    load();
  };

  const saveSleep = async () => {
    if (!sleepHours) return;
    await api.put('/health/sleep', { date, hours: Number(sleepHours), quality: sleepQuality });
    load();
  };

  const addMeal = async () => {
    if (!mealDesc.trim()) return;
    await api.post('/health/meals', {
      date,
      meal_type: mealType,
      description: mealDesc.trim(),
      healthy: mealHealthy,
    });
    setMealDesc('');
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Saúde</h1>
        <p className="lead">Água, sono e alimentação do dia — acompanhe suas metas em números.</p>
      </div>

      <div className="form-row" style={{ marginBottom: '1.2rem', maxWidth: 220 }}>
        <div className="form-field">
          <span className="label">Dia</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: '1rem' }}>
        <div className="card card-warm">
          <span className="label">Água</span>
          <div className="stat-value num" style={{ marginTop: '0.4rem' }}>
            {day.water_total_ml} <span style={{ fontSize: '1rem' }}>ml</span>
          </div>
          <div className="stat-sub num">
            Meta: {day.water_goal_ml} ml —{' '}
            <strong className={pctClass(waterPct)}>{waterPct}% atingido</strong>
          </div>
        </div>

        <div className="card card-dark">
          <span className="label">Sono</span>
          <div className="stat-value num" style={{ marginTop: '0.4rem' }}>
            {day.sleep ? `${sleepH}h` : '—'}
          </div>
          <div className="stat-sub num">
            Meta: {day.sleep_goal_h}h —{' '}
            {day.sleep ? (
              <strong className={pctClass(sleepPct)}>{sleepPct}% da meta</strong>
            ) : (
              'não registrado'
            )}
            {day.sleep?.quality ? ` · qualidade ${day.sleep.quality.toLowerCase()}` : ''}
          </div>
        </div>

        <div className="card">
          <span className="label">Refeições</span>
          <div className="stat-value num" style={{ marginTop: '0.4rem' }}>
            {day.meals.length}
          </div>
          <div className="stat-sub num">
            {day.meals.length > 0 ? (
              <>
                <strong className={pctClass(Math.round((healthyCount / day.meals.length) * 100))}>
                  {Math.round((healthyCount / day.meals.length) * 100)}% saudáveis
                </strong>{' '}
                ({healthyCount} de {day.meals.length})
              </>
            ) : (
              'nenhuma registrada hoje'
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <div className="card-title">
            <h3>Registrar água</h3>
            <span className="badge badge-yellow num">+{day.water_logs.length} registros</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem' }}>
            {[200, 250, 300, 500].map((ml) => (
              <button key={ml} className="chip-btn num" onClick={() => addWater(ml)}>
                +{ml} ml
              </button>
            ))}
          </div>
          <div className="form-row">
            <div className="form-field" style={{ maxWidth: 160 }}>
              <span className="label">Outro valor (ml)</span>
              <input
                type="number"
                min={1}
                value={customWater}
                onChange={(e) => setCustomWater(e.target.value)}
                placeholder="ex: 350"
              />
            </div>
            <button className="btn btn-primary" onClick={() => addWater(Number(customWater))}>
              Adicionar
            </button>
          </div>
          {day.water_logs.length > 0 && (
            <div style={{ marginTop: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {day.water_logs.map((w) => (
                <span key={w.id} className="badge badge-outline num">
                  {w.amount_ml} ml{' '}
                  <button
                    className="btn-ghost btn-sm"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4 }}
                    onClick={() => api.del(`/health/water/${w.id}`).then(load)}
                    title="Remover"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <h3>Registrar sono</h3>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ maxWidth: 120 }}>
              <span className="label">Horas</span>
              <input
                type="number"
                step="0.5"
                min={0}
                max={24}
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="ex: 7.5"
              />
            </div>
            <div className="form-field" style={{ maxWidth: 160 }}>
              <span className="label">Qualidade</span>
              <select value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)}>
                <option>Ótima</option>
                <option>Boa</option>
                <option>Regular</option>
                <option>Ruim</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={saveSleep}>
              Salvar
            </button>
          </div>
          <p className="stat-sub" style={{ marginTop: '0.8rem' }}>
            Com a rotina de 07h às 17h + faculdade à noite, o ideal é dormir entre 23h e 06h para
            manter 7h+ de sono.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">
          <h3>Alimentação do dia</h3>
        </div>
        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div className="form-field" style={{ maxWidth: 150 }}>
            <span className="label">Refeição</span>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option>Café da manhã</option>
              <option>Almoço</option>
              <option>Lanche</option>
              <option>Jantar</option>
              <option>Ceia</option>
            </select>
          </div>
          <div className="form-field" style={{ flex: 2 }}>
            <span className="label">O que você comeu</span>
            <input
              value={mealDesc}
              onChange={(e) => setMealDesc(e.target.value)}
              placeholder="ex: arroz, feijão, frango grelhado e salada"
              onKeyDown={(e) => e.key === 'Enter' && addMeal()}
            />
          </div>
          <div className="form-field" style={{ maxWidth: 130 }}>
            <span className="label">Saudável?</span>
            <select
              value={mealHealthy ? 'sim' : 'nao'}
              onChange={(e) => setMealHealthy(e.target.value === 'sim')}
            >
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>
          <button className="btn btn-yellow" onClick={addMeal}>
            Adicionar
          </button>
        </div>
        {day.meals.length === 0 ? (
          <p className="text-faint">Nenhuma refeição registrada neste dia.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Refeição</th>
                  <th>Descrição</th>
                  <th>Saudável</th>
                  <th className="right"></th>
                </tr>
              </thead>
              <tbody>
                {day.meals.map((m) => (
                  <tr key={m.id}>
                    <td>{m.meal_type}</td>
                    <td>{m.description}</td>
                    <td>
                      <span className={`badge ${m.healthy ? 'badge-green' : 'badge-amber'}`}>
                        {m.healthy ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="right">
                      <button
                        className="btn-ghost btn-sm btn"
                        onClick={() => api.del(`/health/meals/${m.id}`).then(load)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h3>Últimos 7 dias</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th className="right">Água</th>
                <th className="right">% da meta</th>
                <th className="right">Sono</th>
                <th className="right">Refeições</th>
                <th className="right">Saudáveis</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => {
                const wPct = Math.round((row.water_ml / day.water_goal_ml) * 100);
                return (
                  <tr key={row.date}>
                    <td className="num">{formatDateBR(row.date)}</td>
                    <td className="right num">{row.water_ml} ml</td>
                    <td className={`right num ${pctClass(wPct)}`}>{wPct}%</td>
                    <td className="right num">
                      {row.sleep_hours ? `${Number(row.sleep_hours)}h` : '—'}
                    </td>
                    <td className="right num">{row.meals_count}</td>
                    <td className="right num">{row.healthy_meals}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
