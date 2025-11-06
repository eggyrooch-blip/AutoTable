import React from 'react';

type Props = {
  logs: string[];
  mode: 'latest' | 'history';
  onModeChange?: (mode: 'latest' | 'history') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  highlight?: string | null;
  totalCount?: number;
  latestCount?: number;
};

export default function LogPane({
  logs,
  mode,
  onModeChange,
  collapsed = false,
  onToggleCollapse,
  highlight,
  totalCount = 0,
  latestCount = 0,
}: Props) {
  // 使用高对比的浅色主题，保证在白底页面上可读
  const palette = {
    bg: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#0f172a',
    textSecondary: 'rgba(15, 23, 42, 0.7)',
    accent: '#2563eb',
    subtle: 'rgba(37, 99, 235, 0.10)',
    badge: 'rgba(37, 99, 235, 0.12)',
  };
  const [flash, setFlash] = React.useState(false);
  React.useEffect(() => {
    if (!highlight) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 650);
    return () => window.clearTimeout(timer);
  }, [highlight]);
  const baseStyle: React.CSSProperties = {
    border: `1px solid ${palette.border}`,
    padding: '12px 14px',
    borderRadius: 10,
    background: palette.bg,
    maxHeight: 240,
    overflow: 'auto',
    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    boxShadow: flash
      ? '0 10px 24px rgba(15, 23, 42, 0.10)'
      : '0 8px 20px rgba(15, 23, 42, 0.06)',
    transform: flash ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  };
  const lineStyle: React.CSSProperties = {
    color: palette.textPrimary,
    fontSize: '0.9rem',
    lineHeight: 1.6,
    letterSpacing: '0.01em',
    whiteSpace: 'pre-wrap',
  };
  const markerStyle: React.CSSProperties = {
    color: palette.accent,
    marginRight: 8,
  };
  const controlBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? palette.subtle : '#ffffff',
    border: `1px solid ${active ? palette.accent : 'rgba(15,23,42,0.15)'}`,
    color: palette.textPrimary,
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });
  const headerText = highlight ?? '操作日志';
  const logsToRender = collapsed ? [] : logs;
  const latestBadge =
    mode === 'latest'
      ? `最新 ${latestCount} 条`
      : `全部 ${totalCount} 条`;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ color: palette.textPrimary, fontSize: '0.95rem', fontWeight: 700 }}>{headerText}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {highlight ? (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                background: palette.badge,
                color: palette.textPrimary,
                fontSize: '0.72rem',
              }}
            >
              {highlight}
            </span>
          ) : null}
          <span style={{ color: palette.textSecondary, fontSize: '0.78rem' }}>{latestBadge}</span>
          <button
            type="button"
            style={controlBtnStyle(mode === 'latest')}
            onClick={() => onModeChange?.('latest')}
          >
            最新
          </button>
          <button
            type="button"
            style={controlBtnStyle(mode === 'history')}
            onClick={() => onModeChange?.('history')}
          >
            全部
          </button>
          <button
            type="button"
            style={controlBtnStyle(collapsed)}
            onClick={() => onToggleCollapse?.()}
          >
            {collapsed ? '展开' : '折叠'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div style={baseStyle}>
          {logsToRender.length === 0 ? (
            <div style={{ ...lineStyle, opacity: 0.5 }}>等待操作日志…</div>
          ) : (
            logsToRender.map((l, i) => (
              <div key={`${l}-${i}`} style={lineStyle}>
                <span style={markerStyle}>›</span>
                {l}
              </div>
            ))
          )}
        </div>
      )}
      {/* 取消覆盖渐变以提高可读性 */}
      {collapsed && (
        <div
          style={{
            border: `1px dashed ${palette.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            color: palette.textSecondary,
            fontSize: '0.75rem',
            background: 'rgba(15,23,42,0.55)',
          }}
        >
          日志面板已折叠，点击“展开”查看详细记录。
        </div>
      )}
    </div>
  );
}
