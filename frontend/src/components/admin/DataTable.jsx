import React from 'react';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Inbox } from 'lucide-react';

/**
 * Minimal reusable admin table — columns define header + cell renderer so
 * every admin list (products, orders, customers) shares one component
 * instead of duplicating table markup.
 */
export function DataTable({ columns, rows, rowKey = '_id', emptyMessage = 'Nothing to show yet.', onRowClick }) {
  if (!rows || rows.length === 0) {
    return <EmptyState icon={Inbox} title="No results" description={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-charcoal/10 bg-charcoal/[0.02] text-xs uppercase tracking-wide text-muted">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-charcoal/5 last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-emerald/5' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-charcoal">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
