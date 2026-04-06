import '../styles/PlanTable.css';

/**
 * Reusable Excel-like table for structured plan data.
 * Expects props:
 *   - planData: { periodType, periods, rows: [{ title, items }] }
 *   - planLabel: string (e.g. "Diyet Planı")
 */
export default function PlanTable({ planData, planLabel }) {
  if (!planData || !planData.periods || !planData.rows) {
    return <p className="plan-table-empty">Plan verisi bulunamadı.</p>;
  }

  const { periods, rows } = planData;

  return (
    <div className="plan-table-container">
      {planLabel && <h3 className="plan-table-title">{planLabel}</h3>}
      <div className="plan-table-scroll">
        <table className="plan-table-grid">
          <thead>
            <tr>
              <th className="plan-table-corner">Öğün / Gün</th>
              {periods.map((period) => (
                <th key={period} className="plan-table-period-header">{period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.title}>
                <td className="plan-table-row-label">{row.title}</td>
                {row.items.map((cell, idx) => (
                  <td key={`${row.title}-${idx}`} className="plan-table-cell">
                    {cell || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
