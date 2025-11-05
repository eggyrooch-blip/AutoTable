import React from 'react';

type Props = {
  logs: string[];
};

export default function LogPane({ logs }: Props) {
  return (
    <div style={{ border: '1px solid #eee', padding: 8, borderRadius: 4, background: '#fafafa', maxHeight: 200, overflow: 'auto' }}>
      {logs.map((l, i) => (
        <div key={i} style={{ fontFamily: 'monospace' }}>{l}</div>
      ))}
    </div>
  );
}


