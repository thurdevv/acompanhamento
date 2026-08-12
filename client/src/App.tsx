import { useState } from 'react';
import { Resumo } from './pages/Resumo';
import { Saude } from './pages/Saude';
import { Financas } from './pages/Financas';
import { Estudos } from './pages/Estudos';
import { Projetos } from './pages/Projetos';

const TABS = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'saude', label: 'Saúde' },
  { key: 'financas', label: 'Finanças' },
  { key: 'estudos', label: 'Estudos' },
  { key: 'projetos', label: 'Projetos' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function App() {
  const [tab, setTab] = useState<TabKey>('resumo');

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div>
      <header className="topbar">
        <div className="brand">
          Acompanhamento<span className="dot">.</span>
        </div>
        <nav className="pill-nav">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="date-chip num">{today}</div>
      </header>

      <main className="main">
        {tab === 'resumo' && <Resumo onNavigate={(k) => setTab(k as TabKey)} />}
        {tab === 'saude' && <Saude />}
        {tab === 'financas' && <Financas />}
        {tab === 'estudos' && <Estudos />}
        {tab === 'projetos' && <Projetos />}
      </main>
    </div>
  );
}
