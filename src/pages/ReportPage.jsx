import { useApp } from '../context/AppContext';
import { formatDate, STATUS_LABELS, ANALYZER_TYPES, daysUntil } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';
import { Printer, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReportPage() {
  const { stations, analyzers, chemicalInventory } = useApp();

  const today = new Date().toLocaleDateString('he-IL', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const alerts = analyzers.filter((a) => a.status === 'faulty' || a.status === 'needs_maintenance');
  const lowStock = chemicalInventory.filter(
    (i) => i.minimum_threshold > 0 && i.current_stock <= i.minimum_threshold
  );

  const cellStyle = {
    border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', fontSize: '11px',
  };
  const thStyle = {
    ...cellStyle, background: '#f5f5f5', fontWeight: 'bold',
  };

  return (
    <>
      <style>{`
        @media print {
          nav, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { display: block !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen { .print-area { display: none; } }
      `}</style>

      {/* Screen view */}
      <div className="no-print">
        <PageWrapper>
          <PageHeader title="דוח תחנות" back="/dashboard" />
          <Card className="p-6">
            <p className="text-slate-300 text-sm mb-3 font-medium">הדוח יכלול:</p>
            <ul className="text-slate-400 text-sm space-y-1 mb-5">
              <li>• {stations.length} תחנות עם {analyzers.length} מדים</li>
              {alerts.length > 0 && (
                <li className="text-amber-400">• {alerts.length} התראות פעילות</li>
              )}
              <li>• {chemicalInventory.length} כימיקלים
                {lowStock.length > 0 && <span className="text-amber-400"> ({lowStock.length} במלאי נמוך)</span>}
              </li>
            </ul>
            <Button onClick={() => window.print()} className="w-full justify-center">
              <Printer size={16} /> הדפס / שמור כ-PDF
            </Button>
          </Card>
        </PageWrapper>
      </div>

      {/* Print area */}
      <div className="print-area" dir="rtl" style={{ fontFamily: 'Arial, sans-serif', padding: '24px', color: '#000', background: '#fff' }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #333', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>דוח תחנות מים — רשות המים</h1>
            <p style={{ color: '#666', fontSize: '12px', margin: '4px 0 0' }}>{today}</p>
          </div>
          <div style={{ textAlign: 'left', fontSize: '11px', color: '#666' }}>
            עמוד 1 / 1
          </div>
        </div>

        {/* Summary row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'תחנות', value: stations.length, warn: false },
            { label: 'מדים', value: analyzers.length, warn: false },
            { label: 'התראות פעילות', value: alerts.length, warn: alerts.length > 0 },
            { label: 'כימיקלים במלאי נמוך', value: lowStock.length, warn: lowStock.length > 0 },
          ].map((s) => (
            <div key={s.label} style={{
              border: `1px solid ${s.warn ? '#f59e0b' : '#ddd'}`,
              borderRadius: '6px', padding: '8px 14px', minWidth: '90px',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: s.warn ? '#b45309' : '#111' }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Stations */}
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px' }}>
          תחנות ומדים
        </h2>

        {stations.map((station) => {
          const sa = analyzers.filter((a) => a.station_id === station.id);
          return (
            <div key={station.id} style={{ marginBottom: '18px', pageBreakInside: 'avoid' }}>
              <div style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '12px' }}>{station.name}</strong>
                <span style={{ fontSize: '11px', color: '#555' }}>
                  {station.location && `${station.location} • `}{STATUS_LABELS[station.status] || station.status}
                </span>
              </div>
              {sa.length === 0 ? (
                <p style={{ fontSize: '11px', color: '#aaa', padding: '3px 8px' }}>אין מדים</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>שם מד</th>
                      <th style={thStyle}>סוג</th>
                      <th style={thStyle}>דגם</th>
                      <th style={thStyle}>סטטוס</th>
                      <th style={thStyle}>תחזוקה הבאה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sa.map((a) => {
                      const days = a.next_maintenance_date ? daysUntil(a.next_maintenance_date) : null;
                      const isLate = days !== null && days < 0;
                      const isSoon = days !== null && days >= 0 && days < 7;
                      return (
                        <tr key={a.id}>
                          <td style={cellStyle}>{a.name}</td>
                          <td style={cellStyle}>{ANALYZER_TYPES[a.type] || a.type || '—'}</td>
                          <td style={cellStyle}>{a.model || '—'}</td>
                          <td style={{
                            ...cellStyle,
                            color: a.status === 'faulty' ? '#dc2626'
                              : a.status === 'needs_maintenance' ? '#b45309'
                              : '#16a34a',
                            fontWeight: (a.status === 'faulty' || a.status === 'needs_maintenance') ? 'bold' : 'normal',
                          }}>
                            {STATUS_LABELS[a.status] || a.status}
                          </td>
                          <td style={{
                            ...cellStyle,
                            color: isLate ? '#dc2626' : isSoon ? '#b45309' : 'inherit',
                          }}>
                            {a.next_maintenance_date
                              ? `${formatDate(a.next_maintenance_date)}${days !== null ? ` (${isLate ? Math.abs(days) + ' ימים איחור' : days + ' ימים'})` : ''}`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        {/* Chemical inventory */}
        {chemicalInventory.length > 0 && (
          <div style={{ marginTop: '28px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '12px' }}>
              מלאי כימיקלים
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>כימיקל</th>
                  <th style={thStyle}>מלאי נוכחי</th>
                  <th style={thStyle}>סף מינ'</th>
                  <th style={thStyle}>מצב</th>
                </tr>
              </thead>
              <tbody>
                {chemicalInventory.map((item) => {
                  const isLow = item.minimum_threshold > 0 && item.current_stock <= item.minimum_threshold;
                  return (
                    <tr key={item.id}>
                      <td style={cellStyle}>{item.chemical_name}</td>
                      <td style={cellStyle}>{item.current_stock} {item.unit}</td>
                      <td style={cellStyle}>
                        {item.minimum_threshold > 0 ? `${item.minimum_threshold} ${item.unit}` : '—'}
                      </td>
                      <td style={{
                        ...cellStyle,
                        color: isLow ? '#dc2626' : '#16a34a',
                        fontWeight: isLow ? 'bold' : 'normal',
                      }}>
                        {isLow ? 'מלאי נמוך' : 'תקין'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '8px', fontSize: '10px', color: '#aaa', textAlign: 'center' }}>
          הופק ב-{today} • מערכת תחזוקה — רשות המים
        </div>
      </div>
    </>
  );
}
