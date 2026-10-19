import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  RotateCcw,
  Download,
  Table,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Layers,
  Code,
  Clock,
} from 'lucide-react';
import { SchemaTable } from '../../types';

export const SqlStudioView: React.FC = () => {
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>('neon_cars');
  const [sql, setSql] = useState<string>(
    'SELECT brand, model, year, price_usd, horsepower, top_speed_kmh \nFROM neon_cars \nORDER BY price_usd DESC \nLIMIT 10;'
  );
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<any | null>(null);

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/schema');
      if (res.ok) {
        const data = await res.json();
        setSchema(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleRunQuery = async () => {
    if (!sql.trim()) return;
    try {
      setExecuting(true);
      setError(null);
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data);
        setResult(null);
      } else {
        setResult(data);
        setError(null);
      }
    } catch (err: any) {
      setError({ error: err.message || 'Execution error' });
      setResult(null);
    } finally {
      setExecuting(false);
    }
  };

  // Preset queries
  const presets = [
    {
      label: 'Top 10 Most Expensive Hypercars',
      query: `SELECT brand, model, variant, year, price_usd, horsepower \nFROM neon_cars \nORDER BY price_usd DESC \nLIMIT 10;`,
    },
    {
      label: 'Brand Volume & Average Valuation',
      query: `SELECT brand, COUNT(*)::int as models_count, ROUND(AVG(price_usd)) as avg_price, MAX(horsepower) as peak_hp \nFROM neon_cars \nGROUP BY brand \nORDER BY models_count DESC;`,
    },
    {
      label: 'All Registered Platform Users',
      query: `SELECT id, name, email, phone_number, is_admin, dream_car, location \nFROM neon_users \nORDER BY created_at DESC;`,
    },
    {
      label: 'Reviews with Car Brand Join',
      query: `SELECT r.id, r.user_name, r.rating, r.title, c.brand, c.model, c.price_usd \nFROM neon_reviews r \nJOIN neon_cars c ON r.car_id = c.id \nORDER BY r.rating DESC;`,
    },
    {
      label: '0-100 km/h Velocity Leaderboard',
      query: `SELECT brand, model, acceleration_0_100, top_speed_kmh, horsepower, drivetrain \nFROM neon_cars \nORDER BY acceleration_0_100 ASC \nLIMIT 10;`,
    },
  ];

  const handleExportResult = () => {
    if (!result?.rows || result.rows.length === 0) return;
    const jsonStr = JSON.stringify(result.rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <span>Neon SQL Query Studio</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Execute real PostgreSQL queries against your Neon database instance with full schema inspection
          </p>
        </div>

        {result?.rows && result.rows.length > 0 && (
          <button
            onClick={handleExportResult}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export Result JSON</span>
          </button>
        )}
      </div>

      {/* Main Studio Grid: Left Schema Browser (3 cols) + Right Query Editor (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schema Browser */}
        <div className="lg:col-span-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 p-4 flex flex-col max-h-[750px]">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Public Tables ({schema.length})</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-500">public schema</span>
          </div>

          <div className="mt-3 space-y-2 overflow-y-auto flex-1 pr-1">
            {schema.map((tbl) => {
              const isSelected = selectedTable === tbl.table_name;
              return (
                <div
                  key={tbl.table_name}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setSelectedTable(isSelected ? null : tbl.table_name)
                    }
                    className="w-full p-2.5 flex items-center justify-between text-left text-xs hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Table className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono text-white font-medium">{tbl.table_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
                        {tbl.rowCount} rows
                      </span>
                      {isSelected ? (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </button>

                  {isSelected && (
                    <div className="px-3 pb-3 pt-1 border-t border-neutral-900 space-y-1 text-[11px] font-mono">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
                        Columns ({tbl.columns.length})
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {tbl.columns.map((c) => (
                          <div
                            key={c.column_name}
                            className="flex items-center justify-between text-neutral-400 hover:text-white"
                          >
                            <span className="truncate">{c.column_name}</span>
                            <span className="text-[10px] text-amber-500/80 shrink-0 ml-2">
                              {c.data_type}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setSql(`SELECT * FROM "${tbl.table_name}" LIMIT 20;`)
                        }
                        className="mt-2 w-full py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-sans transition-colors"
                      >
                        Inspect {tbl.table_name}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: SQL Editor & Output */}
        <div className="lg:col-span-8 space-y-4">
          {/* Presets Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-neutral-500 shrink-0 text-[11px] font-medium">PRESETS:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSql(p.query)}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded text-[11px] whitespace-nowrap transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-inner">
            <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-amber-500" />
                <span>SQL Query Editor</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                Press Ctrl + Enter to run
              </span>
            </div>

            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleRunQuery();
                }
              }}
              rows={6}
              className="w-full p-4 bg-transparent text-xs text-amber-300 font-mono resize-y focus:outline-none focus:ring-0 leading-relaxed selection:bg-neutral-800"
              placeholder="SELECT * FROM neon_cars LIMIT 10;"
            />

            <div className="px-4 py-2.5 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
              <button
                onClick={() => setSql('')}
                className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleRunQuery}
                disabled={executing || !sql.trim()}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-950" />
                <span>{executing ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>PostgreSQL Execution Error</span>
              </div>
              <p className="font-mono">{error.error || error.message}</p>
              {error.hint && <p className="text-[11px] text-rose-400">Hint: {error.hint}</p>}
            </div>
          )}

          {/* Results Table */}
          {result && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden space-y-2">
              <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{result.command || 'SELECT'} SUCCESS</span>
                  </span>
                  <span className="text-neutral-600">·</span>
                  <span className="font-mono text-neutral-300 tabular-nums">
                    {result.rowCount || result.rows?.length || 0} rows
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span>{result.durationMs}ms</span>
                </div>
              </div>

              {result.rows && result.rows.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 sticky top-0">
                      <tr>
                        {result.fields?.map((f: any) => (
                          <th key={f.name} className="py-2.5 px-3 whitespace-nowrap font-medium text-[11px]">
                            {f.name}
                          </th>
                        )) ||
                          Object.keys(result.rows[0]).map((k) => (
                            <th key={k} className="py-2.5 px-3 whitespace-nowrap font-medium text-[11px]">
                              {k}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {result.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-neutral-800/40">
                          {Object.values(row).map((val: any, cidx: number) => (
                            <td key={cidx} className="py-2 px-3 whitespace-nowrap max-w-xs truncate">
                              {val === null || val === undefined
                                ? <span className="text-neutral-600 italic">null</span>
                                : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-neutral-400">
                  Query returned 0 rows.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
