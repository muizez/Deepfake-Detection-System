import { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ToplineProps {
  title: string;
  onMenu: () => void;
  modelName?: string;
}

export function Topline({ title, onMenu, modelName = 'RESNET-50 BALANCED' }: ToplineProps) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`UTC ${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topline">
      <button className="menu-trigger" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <div>
        <span>DEEPTRACE /</span> {title}
      </div>
      <div className="top-meta">
        <span>{modelName}</span>
        <span>{utcTime || 'UTC 00:00:00'}</span>
        <button className="avatar">AI</button>
      </div>
    </header>
  );
}
