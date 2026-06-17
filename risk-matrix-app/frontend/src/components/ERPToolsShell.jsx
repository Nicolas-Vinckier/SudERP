import { useMemo, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import useTheme from '../hooks/useTheme';
import { erpTools } from '../tools/erpTools';

export default function ERPToolsShell() {
  const [activeToolId, setActiveToolId] = useState(erpTools[0]?.id);
  const { isLightTheme, toggleTheme } = useTheme();

  const activeTool = useMemo(
    () => erpTools.find((tool) => tool.id === activeToolId) || erpTools[0],
    [activeToolId]
  );

  if (!activeTool) {
    return (
      <main className="erp-shell erp-shell-empty">
        <p>No ERP tools registered.</p>
      </main>
    );
  }

  const ActiveToolComponent = activeTool.component;

  return (
    <main className="erp-shell">
      <aside className="tool-sidebar glass-panel" aria-label="ERP tools">
        <div className="tool-sidebar-header">
          <div className="tool-sidebar-title-row">
            <div>
              <p className="eyebrow">Sud ERP</p>
              <h1>ERP Tools</h1>
            </div>
            <ThemeToggle isLightTheme={isLightTheme} onToggle={toggleTheme} />
          </div>
          <p>Selectionne un outil metier a afficher.</p>
        </div>

        <nav className="tool-nav" aria-label="Available ERP tools">
          {erpTools.map((tool) => {
            const isActive = tool.id === activeTool.id;

            return (
              <button
                key={tool.id}
                type="button"
                className={`tool-nav-item${isActive ? ' tool-nav-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveToolId(tool.id)}
              >
                <span>{tool.shortTitle || tool.title}</span>
                <small>{tool.description}</small>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="tool-content" aria-label={activeTool.title}>
        <ActiveToolComponent />
      </section>
    </main>
  );
}
