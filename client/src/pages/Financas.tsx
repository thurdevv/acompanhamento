import { useCallback, useEffect, useState } from 'react';
import { api, currentMonth, formatBRL, formatDateBR, todayISO } from '../api';

interface Tx {
  id: number;
  date: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string | null;
  amount: string;
}
interface CategoryRow { type: string; category: string; total: string; count: number; }
interface MonthData {
  month: string;
  transactions: Tx[];
  by_category: CategoryRow[];
  totals: { receitas: string; despesas: string };
}
interface Goal {
  id: number;
  name: string;
  target_amount: string;
  saved_amount: string;
  deadline: string | null;
}
interface Investment {
  id: number;
  name: string;
  type: string;
  institution: string | null;
  amount: string;
  notes: string | null;
}

const EXPENSE_CATEGORIES = ['Moradia', 'Mercado', 'Transporte', 'Alimentação fora', 'Faculdade', 'Lazer', 'Saúde', 'Assinaturas', 'Outros'];
const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Rendimentos', 'Outros'];

export function Financas() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<MonthData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  const [txDate, setTxDate] = useState(todayISO());
  const [txType, setTxType] = useState<'receita' | 'despesa'>('despesa');
  const [txCategory, setTxCategory] = useState('Mercado');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const [invName, setInvName] = useState('');
  const [invType, setInvType] = useState('CDB');
  const [invInstitution, setInvInstitution] = useState('');
  const [invAmount, setInvAmount] = useState('');

  const load = useCallback(async () => {
    const [m, g, i] = await Promise.all([
      api.get<MonthData>(`/finance/month?month=${month}`),
      api.get<Goal[]>('/finance/goals'),
      api.get<Investment[]>('/finance/investments'),
    ]);
    setData(m);
    setGoals(g);
    setInvestments(i);
  }, [month]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  if (!data) return <p className="text-muted">Carregando...</p>;

  const receitas = Number(data.totals.receitas);
  const despesas = Number(data.totals.despesas);
  const saldo = receitas - despesas;
  const totalInvested = investments.reduce((acc, i) => acc + Number(i.amount), 0);

  const addTx = async () => {
    if (!txAmount || !txCategory) return;
    await api.post('/finance/transactions', {
      date: txDate,
      type: txType,
      category: txCategory,
      description: txDesc.trim() || null,
      amount: Number(txAmount),
    });
    setTxDesc('');
    setTxAmount('');
    load();
  };

  const addGoal = async () => {
    if (!goalName.trim() || !goalTarget) return;
    await api.post('/finance/goals', { name: goalName.trim(), target_amount: Number(goalTarget) });
    setGoalName('');
    setGoalTarget('');
    load();
  };

  const updateGoalSaved = async (goal: Goal, saved: string) => {
    await api.put(`/finance/goals/${goal.id}`, {
      name: goal.name,
      target_amount: goal.target_amount,
      saved_amount: Number(saved || 0),
      deadline: goal.deadline,
    });
    load();
  };

  const addInvestment = async () => {
    if (!invName.trim() || !invAmount) return;
    await api.post('/finance/investments', {
      name: invName.trim(),
      type: invType,
      institution: invInstitution.trim() || null,
      amount: Number(invAmount),
    });
    setInvName('');
    setInvInstitution('');
    setInvAmount('');
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Finanças</h1>
        <p className="lead">
          Receitas, despesas, metas e investimentos. Salário entra até o 5º dia útil.
        </p>
      </div>

      <div className="form-row" style={{ marginBottom: '1.2rem', maxWidth: 220 }}>
        <div className="form-field">
          <span className="label">Mês</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <span className="label">Receitas do mês</span>
          <div className="stat-value num text-green" style={{ fontSize: '1.7rem', marginTop: '0.4rem' }}>
            {formatBRL(receitas)}
          </div>
        </div>
        <div className="card">
          <span className="label">Despesas do mês</span>
          <div className="stat-value num text-red" style={{ fontSize: '1.7rem', marginTop: '0.4rem' }}>
            {formatBRL(despesas)}
          </div>
        </div>
        <div className="card card-dark">
          <span className="label">Saldo</span>
          <div
            className={`stat-value num ${saldo >= 0 ? 'pct-good' : 'pct-low'}`}
            style={{ fontSize: '1.7rem', marginTop: '0.4rem' }}
          >
            {formatBRL(saldo)}
          </div>
          <div className="stat-sub num">
            {receitas > 0
              ? `${Math.round((despesas / receitas) * 100)}% da receita comprometida`
              : 'sem receitas no mês'}
          </div>
        </div>
        <div className="card card-warm">
          <span className="label">Total investido</span>
          <div className="stat-value num" style={{ fontSize: '1.7rem', marginTop: '0.4rem' }}>
            {formatBRL(totalInvested)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">
          <h3>Nova transação</h3>
        </div>
        <div className="form-row">
          <div className="form-field" style={{ maxWidth: 160 }}>
            <span className="label">Data</span>
            <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
          </div>
          <div className="form-field" style={{ maxWidth: 130 }}>
            <span className="label">Tipo</span>
            <select
              value={txType}
              onChange={(e) => {
                const t = e.target.value as 'receita' | 'despesa';
                setTxType(t);
                setTxCategory(t === 'receita' ? 'Salário' : 'Mercado');
              }}
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          <div className="form-field" style={{ maxWidth: 180 }}>
            <span className="label">Categoria</span>
            <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)}>
              {(txType === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ flex: 2 }}>
            <span className="label">Descrição</span>
            <input
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              placeholder="opcional"
            />
          </div>
          <div className="form-field" style={{ maxWidth: 140 }}>
            <span className="label">Valor (R$)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="0,00"
              onKeyDown={(e) => e.key === 'Enter' && addTx()}
            />
          </div>
          <button className="btn btn-primary" onClick={addTx}>
            Lançar
          </button>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <div className="card-title">
            <h3>Transações de {formatDateBR(`${month}-01`).slice(3)}</h3>
          </div>
          {data.transactions.length === 0 ? (
            <p className="text-faint">Nenhuma transação neste mês.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th className="right">Valor</th>
                    <th className="right"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="num">{formatDateBR(tx.date)}</td>
                      <td>
                        <span className={`badge ${tx.type === 'receita' ? 'badge-green' : 'badge-red'}`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="text-muted">{tx.description || '—'}</td>
                      <td className={`right num ${tx.type === 'receita' ? 'text-green' : 'text-red'}`}>
                        {tx.type === 'receita' ? '+' : '−'} {formatBRL(tx.amount)}
                      </td>
                      <td className="right">
                        <button
                          className="btn-ghost btn-sm btn"
                          onClick={() => api.del(`/finance/transactions/${tx.id}`).then(load)}
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
            <h3>Gastos por categoria</h3>
          </div>
          {data.by_category.filter((c) => c.type === 'despesa').length === 0 ? (
            <p className="text-faint">Sem despesas neste mês.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th className="right">Lançamentos</th>
                    <th className="right">Total</th>
                    <th className="right">% das despesas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_category
                    .filter((c) => c.type === 'despesa')
                    .map((c) => (
                      <tr key={c.category}>
                        <td>{c.category}</td>
                        <td className="right num">{c.count}</td>
                        <td className="right num">{formatBRL(c.total)}</td>
                        <td className="right num">
                          {despesas > 0 ? Math.round((Number(c.total) / despesas) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <div className="card-title">
            <h3>Metas</h3>
          </div>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-field" style={{ flex: 2 }}>
              <span className="label">Nova meta</span>
              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="ex: Reserva de emergência"
              />
            </div>
            <div className="form-field" style={{ maxWidth: 140 }}>
              <span className="label">Alvo (R$)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
              />
            </div>
            <button className="btn btn-yellow" onClick={addGoal}>
              Criar
            </button>
          </div>
          {goals.length === 0 ? (
            <p className="text-faint">Nenhuma meta criada.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Meta</th>
                    <th className="right">Guardado</th>
                    <th className="right">Alvo</th>
                    <th className="right">Progresso</th>
                    <th className="right"></th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => {
                    const pct = Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100);
                    return (
                      <tr key={g.id}>
                        <td>{g.name}</td>
                        <td className="right" style={{ maxWidth: 120 }}>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            defaultValue={Number(g.saved_amount)}
                            className="num"
                            style={{ textAlign: 'right', padding: '0.3rem 0.5rem' }}
                            onBlur={(e) => updateGoalSaved(g, e.target.value)}
                          />
                        </td>
                        <td className="right num">{formatBRL(g.target_amount)}</td>
                        <td className="right num">
                          <span
                            className={`badge ${pct >= 100 ? 'badge-green' : pct >= 50 ? 'badge-yellow' : 'badge-amber'}`}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="right">
                          <button
                            className="btn-ghost btn-sm btn"
                            onClick={() => api.del(`/finance/goals/${g.id}`).then(load)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <h3>Investimentos</h3>
            <span className="badge badge-dark num">{formatBRL(totalInvested)}</span>
          </div>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-field" style={{ flex: 2 }}>
              <span className="label">Nome</span>
              <input
                value={invName}
                onChange={(e) => setInvName(e.target.value)}
                placeholder="ex: Tesouro Selic 2029"
              />
            </div>
            <div className="form-field" style={{ maxWidth: 130 }}>
              <span className="label">Tipo</span>
              <select value={invType} onChange={(e) => setInvType(e.target.value)}>
                <option>CDB</option>
                <option>Tesouro Direto</option>
                <option>LCI/LCA</option>
                <option>Fundo</option>
                <option>Ações</option>
                <option>FII</option>
                <option>Cripto</option>
                <option>Poupança</option>
                <option>Outro</option>
              </select>
            </div>
            <div className="form-field" style={{ maxWidth: 140 }}>
              <span className="label">Instituição</span>
              <input
                value={invInstitution}
                onChange={(e) => setInvInstitution(e.target.value)}
                placeholder="opcional"
              />
            </div>
            <div className="form-field" style={{ maxWidth: 130 }}>
              <span className="label">Valor (R$)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
              />
            </div>
            <button className="btn btn-yellow" onClick={addInvestment}>
              Adicionar
            </button>
          </div>
          {investments.length === 0 ? (
            <p className="text-faint">Nenhum investimento cadastrado.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Instituição</th>
                    <th className="right">Valor</th>
                    <th className="right">% da carteira</th>
                    <th className="right"></th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.name}</td>
                      <td>
                        <span className="badge badge-outline">{inv.type}</span>
                      </td>
                      <td className="text-muted">{inv.institution || '—'}</td>
                      <td className="right num">{formatBRL(inv.amount)}</td>
                      <td className="right num">
                        {totalInvested > 0
                          ? Math.round((Number(inv.amount) / totalInvested) * 100)
                          : 0}
                        %
                      </td>
                      <td className="right">
                        <button
                          className="btn-ghost btn-sm btn"
                          onClick={() => api.del(`/finance/investments/${inv.id}`).then(load)}
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
      </div>
    </div>
  );
}
