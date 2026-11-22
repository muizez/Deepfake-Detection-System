import { useState } from 'react';
import { Icon } from './Icon';
import { InvestigationTable } from './InvestigationTable';
import type { InvestigationRecord } from '../lib/forensics';
import type { Page } from './Sidebar';

interface ArchiveProps {
  go: (page: Page) => void;
  investigations: InvestigationRecord[];
  onViewRecord: (record: InvestigationRecord) => void;
  onNewInvestigation: () => void;
}

export function Archive({
  investigations,
  onViewRecord,
  onNewInvestigation,
}: ArchiveProps) {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const rows = investigations.filter((x) => {
    const matchesFilter = filter === 'ALL' || x.label === filter;
    const matchesQuery = !query || x.name.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="page archive-page">
      <div className="archive-hero">
        <div>
          <div className="section-tag">
            <span>04</span>
            <i /> INVESTIGATION ARCHIVE
          </div>
          <p className="serif-kicker">A record of what was found.</p>
          <h1>
            Collected
            <br />
            <em>evidence.</em>
          </h1>
        </div>
        <div className="archive-count">
          <strong>{investigations.length}</strong>
          <span>
            TOTAL RECORDS
            <br />
            IN REPOSITORY
          </span>
        </div>
      </div>

      <div className="archive-tools">
        <label>
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename or case ID"
          />
        </label>
        <div>
          {['ALL', 'AUTHENTIC', 'MANIPULATED', 'INCONCLUSIVE'].map((tab) => (
            <button
              className={filter === tab ? 'active' : ''}
              onClick={() => setFilter(tab)}
              key={tab}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="new-case" onClick={onNewInvestigation}>
          <Icon name="plus" /> NEW CASE
        </button>
      </div>

      <div className="archive-date">
        <span>STORED INVESTIGATIONS</span>
        <i />
        <span>{rows.length} RECORDS SHOWN</span>
      </div>

      <InvestigationTable rows={rows} onView={onViewRecord} />
    </div>
  );
}
