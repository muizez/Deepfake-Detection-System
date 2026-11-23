import { Icon } from './Icon';
import type { InvestigationRecord } from '../lib/forensics';

interface InvestigationTableProps {
  rows: InvestigationRecord[];
  onView: (record: InvestigationRecord) => void;
}

export function InvestigationTable({ rows, onView }: InvestigationTableProps) {
  return (
    <div className="investigation-table">
      <div className="table-row table-labels">
        <span>FILENAME</span>
        <span>DATE</span>
        <span>CLASSIFICATION</span>
        <span>CONFIDENCE*</span>
        <span />
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          NO INVESTIGATION RECORDS FOUND
        </div>
      ) : (
        rows.map((item, index) => (
          <div className="table-row" key={item.id || item.name}>
            <span className="case-file">
              <small>{String(index + 1).padStart(2, '0')}</small>
              {item.name}
            </span>
            <span>{item.date}</span>
            <span className={`class-label ${item.tone}`}>
              <i />
              {item.label}
            </span>
            <span>{item.score}</span>
            <button onClick={() => onView(item)}>
              VIEW REPORT <Icon name="arrow" />
            </button>
          </div>
        ))
      )}
      <p className="confidence-note">
        * Confidence is calibrated using the validation threshold of the EfficientNet-B3 model.
      </p>
    </div>
  );
}
