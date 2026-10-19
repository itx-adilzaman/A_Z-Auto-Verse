import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Shield,
  Download,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Cpu,
  Layers,
  Database,
} from 'lucide-react';
import { HealthStatus, SchemaTable } from '../../types';

export const DiagnosticsView: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConnString, setShowConnString] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawConnString =
    'postgresql://neondb_owner:npg_V0Kum5hgxfkw@ep-solitary-truth-a1u00b22-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const [hRes, sRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/schema'),
      ]);
      if (hRes.ok) setHealth(await hRes.json());
      if (sRes.ok) setSchema(await sRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawConnString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>Database Health & Diagnostics</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time infrastructure telemetry, SSL encryption verification, and backup archives
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Ping Neon DB</span>
        </button>
      </div>

      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection State */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>NEON CLUSTER</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-3 text-lg font-bold text-white">Online & Healthy</div>
          <div className="text-xs text-neutral-400 mt-1">AWS ap-southeast-1 pooler</div>
        </div>

        {/* Latency */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>ROUND-TRIP LATENCY</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : '—'}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Direct pooling gateway</div>
        </div>

        {/* Connection Pool */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>CONNECTION POOL</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 text-lg font-bold font-mono text-white">
            {health?.pool?.idleCount ?? 0} Idle / {health?.pool?.totalCount ?? 0} Total
          </div>
          <div className="text-xs text-neutral-400 mt-1">Max 10 concurrent clients</div>
        </div>

        {/* Security / SSL */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>SECURITY / SSL</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-lg font-bold text-white">Require / Bound</div>
          <div className="text-xs text-emerald-400 font-mono mt-1">channel_binding=require</div>
        </div>
      </div>

      {/* Connection Details Box */}
      <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Neon PostgreSQL Connection String</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Secure pooled connection string utilized by the AutoVerse backend
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConnString(!showConnString)}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1"
            >
              {showConnString ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showConnString ? 'Hide' : 'Reveal'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 break-all select-all">
          {showConnString
            ? rawConnString
            : 'postgresql://neondb_owner:••••••••••••@ep-solitary-truth-a1u00b22-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'}
        </div>

        {health?.version && (
          <div className="text-[11px] text-neutral-500 font-mono">
            {health.version}
          </div>
        )}
      </div>

      {/* Table Storage & Backup Archives */}
      <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Database Backup & Archive Hub</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Download snapshot exports of public tables in CSV or JSON format
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schema.map((tbl) => (
            <div
              key={tbl.table_name}
              className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-white">
                    {tbl.table_name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-amber-400">
                    {tbl.rowCount} rows
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {tbl.columns.length} columns defined
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-900 flex items-center gap-2">
                <a
                  href={`/api/export/${tbl.table_name}?format=csv`}
                  className="flex-1 py-1.5 px-2.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-neutral-400" />
                  <span>CSV</span>
                </a>
                <a
                  href={`/api/export/${tbl.table_name}?format=json`}
                  className="flex-1 py-1.5 px-2.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-neutral-400" />
                  <span>JSON</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
