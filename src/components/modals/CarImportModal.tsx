import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../../utils';

interface CarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Sample Templates
const SAMPLE_CSV = `Brand,Model,Variant,Year,Body Type,Price USD,Fuel Type,Engine,Horsepower,Torque NM,Transmission,Top Speed KMH,0-100 Sec,Images,Description
Ferrari,296 GTS,Assetto Fiorano,2024,Convertible,371000,PHEV,3.0L Twin-Turbo V6 Hybrid,819,740,8-Speed Dual-Clutch,330,2.9,https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80,Open-top plug-in hybrid V6 architecture from Maranello with instant electric response.
Porsche,911 GT3 RS,Weissach Package,2024,Coupe,241300,Petrol,4.0L Naturally Aspirated Boxer-6,518,465,7-Speed PDK,296,3.2,https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80,Motorsport-derived naturally aspirated road weapon with active DRS aerodynamics.
Lamborghini,Revuelto,V12 HPEV,2024,Coupe,604000,Hybrid,6.5L Naturally Aspirated V12 + 3 Motors,1001,1062,8-Speed Dual-Clutch,350,2.5,https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80,First High Performance Electrified Vehicle from Sant'Agata Bolognese.`;

const SAMPLE_JSON = [
  {
    brand: "Ferrari",
    model: "296 GTS",
    variant: "Assetto Fiorano",
    year: 2024,
    body_type: "Convertible",
    price_usd: 371000,
    fuel_type: "PHEV",
    engine: "3.0L Twin-Turbo V6 Hybrid",
    horsepower: 819,
    torque_nm: 740,
    transmission: "8-Speed Dual-Clutch",
    drivetrain: "RWD",
    top_speed_kmh: 330,
    acceleration_0_100: 2.9,
    images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80"],
    description: "Open-top plug-in hybrid V6 architecture from Maranello with instant electric response."
  },
  {
    brand: "Porsche",
    model: "911 GT3 RS",
    variant: "Weissach Package",
    year: 2024,
    body_type: "Coupe",
    price_usd: 241300,
    fuel_type: "Petrol",
    engine: "4.0L Naturally Aspirated Boxer-6",
    horsepower: 518,
    torque_nm: 465,
    transmission: "7-Speed PDK",
    drivetrain: "RWD",
    top_speed_kmh: 296,
    acceleration_0_100: 3.2,
    images: ["https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80"],
    description: "Motorsport-derived naturally aspirated road weapon with active DRS aerodynamics."
  }
];

export const CarImportModal: React.FC<CarImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'create_new'>('skip');
  const [parsedCars, setParsedCars] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    brandsCreated: number;
    errors: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Flexible CSV Parser handling quotes, commas, spaces
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one car data row.');
    }

    // Helper to parse line with quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    // Normalize header keys: lowercase and stripped of symbols
    const headers = rawHeaders.map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '')
    );

    const cars: any[] = [];
    for (let r = 1; r < lines.length; r++) {
      const values = parseLine(lines[r]);
      if (values.length === 0 || values.every((v) => !v)) continue;

      const rowObj: any = {};
      headers.forEach((key, index) => {
        rowObj[key] = values[index] !== undefined ? values[index] : '';
      });

      // Flexible mapping for common naming conventions
      const car: any = {
        brand: rowObj.brand || rowObj.make || rowObj.manufacturer || rowObj.company || '',
        model: rowObj.model || rowObj.model_name || rowObj.car_name || rowObj.name || rowObj.title || '',
        variant: rowObj.variant || rowObj.trim || rowObj.edition || '',
        year: parseInt(rowObj.year || rowObj.model_year || rowObj.release_year, 10) || 2024,
        body_type: rowObj.body_type || rowObj.body_style || rowObj.type || rowObj.category || 'Coupe',
        price_usd: parseFloat(String(rowObj.price_usd || rowObj.price || rowObj.msrp || rowObj.cost || '0').replace(/[^0-9.]/g, '')) || 0,
        fuel_type: rowObj.fuel_type || rowObj.fuel || rowObj.energy || 'Petrol',
        engine: rowObj.engine || rowObj.powertrain || rowObj.displacement || 'High Performance Engine',
        horsepower: parseInt(rowObj.horsepower || rowObj.hp || rowObj.bhp || '0', 10) || 500,
        torque_nm: parseInt(rowObj.torque_nm || rowObj.torque || '0', 10) || 600,
        transmission: rowObj.transmission || rowObj.gearbox || 'Automatic',
        drivetrain: rowObj.drivetrain || rowObj.drive || 'RWD',
        top_speed_kmh: parseInt(rowObj.top_speed_kmh || rowObj.top_speed || '300', 10) || 300,
        acceleration_0_100: parseFloat(String(rowObj.acceleration_0_100 || rowObj.acceleration || rowObj.zero_to_hundred || '3.5').replace(/[^0-9.]/g, '')) || 3.5,
        mileage: rowObj.mileage || rowObj.fuel_consumption || '10 L/100km',
        description: rowObj.description || rowObj.details || rowObj.overview || '',
        country: rowObj.country || rowObj.origin || rowObj.country_of_origin || 'Global',
      };

      // Handle image
      const imageVal = rowObj.images || rowObj.image || rowObj.image_url || rowObj.photo || rowObj.gallery;
      if (imageVal) {
        if (imageVal.startsWith('[') && imageVal.endsWith(']')) {
          try {
            car.images = JSON.parse(imageVal);
          } catch {
            car.images = [imageVal];
          }
        } else {
          car.images = [imageVal];
        }
      }

      if (car.brand && car.model) {
        cars.push(car);
      }
    }

    if (cars.length === 0) {
      throw new Error('No valid car records found in CSV. Please ensure columns include "Brand" and "Model".');
    }

    return cars;
  };

  // Flexible JSON Parser
  const parseJSON = (jsonText: string): any[] => {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      throw new Error('Invalid JSON format: ' + e.message);
    }

    let array: any[] = [];
    if (Array.isArray(parsed)) {
      array = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.cars)) array = parsed.cars;
      else if (Array.isArray(parsed.vehicles)) array = parsed.vehicles;
      else if (Array.isArray(parsed.data)) array = parsed.data;
      else array = [parsed]; // Single object
    }

    const cars = array
      .map((item: any) => ({
        brand: item.brand || item.make || item.manufacturer || '',
        model: item.model || item.model_name || item.name || '',
        variant: item.variant || '',
        year: parseInt(item.year || item.model_year, 10) || 2024,
        body_type: item.body_type || item.body_style || item.type || 'Coupe',
        price_usd: parseFloat(String(item.price_usd || item.price || '0').replace(/[^0-9.]/g, '')) || 0,
        fuel_type: item.fuel_type || item.fuel || 'Petrol',
        engine: item.engine || item.powertrain || 'High Performance Engine',
        horsepower: parseInt(item.horsepower || item.hp, 10) || 500,
        torque_nm: parseInt(item.torque_nm || item.torque, 10) || 600,
        transmission: item.transmission || 'Automatic',
        drivetrain: item.drivetrain || 'RWD',
        top_speed_kmh: parseInt(item.top_speed_kmh || item.top_speed, 10) || 300,
        acceleration_0_100: parseFloat(String(item.acceleration_0_100 || item.acceleration || '3.5')) || 3.5,
        images: item.images || (item.image_url ? [item.image_url] : undefined),
        description: item.description || '',
        country: item.country || 'Global',
      }))
      .filter((c: any) => c.brand && c.model);

    if (cars.length === 0) {
      throw new Error('No valid car objects found in JSON. Each car needs "brand" and "model".');
    }

    return cars;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        let cars: any[] = [];
        if (file.name.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
          cars = parseJSON(content);
        } else {
          cars = parseCSV(content);
        }
        setParsedCars(cars);
      } catch (err: any) {
        setParseError(err.message || 'Failed to parse file.');
        setParsedCars([]);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setParseError('Please enter CSV or JSON text to parse.');
      return;
    }

    setParseError(null);
    setImportResult(null);
    try {
      let cars: any[] = [];
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        cars = parseJSON(trimmed);
      } else {
        cars = parseCSV(trimmed);
      }
      setParsedCars(cars);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse content.');
      setParsedCars([]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedCars.length === 0) return;

    try {
      setIsImporting(true);
      setParseError(null);

      const res = await fetch('/api/cars/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cars: parsedCars,
          duplicateAction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import vehicles.');
      }

      setImportResult(data);
      onSuccess();
    } catch (err: any) {
      setParseError(err.message || 'Error occurred during batch import.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'autoverse_cars_sample_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleJSON = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_JSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'autoverse_cars_sample_template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadDemoCars = () => {
    setPastedText(SAMPLE_CSV);
    setActiveTab('paste');
    try {
      const cars = parseCSV(SAMPLE_CSV);
      setParsedCars(cars);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Bulk Vehicle Importer (CSV & JSON)
              </h3>
              <p className="text-xs text-neutral-400">
                Import complete vehicle specs into Neon PostgreSQL with smart column mapping
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setImportResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-amber-400 text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('paste');
                  setImportResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'paste'
                    ? 'bg-amber-400 text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Paste Text (CSV / JSON)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-400 flex items-center gap-1.5 transition-colors font-mono text-[11px]"
                title="Download CSV spreadsheet template with required columns"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleJSON}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-400 flex items-center gap-1.5 transition-colors font-mono text-[11px]"
                title="Download JSON format template"
              >
                <Download className="w-3 h-3 text-blue-400" />
                <span>Sample JSON</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemoCars}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1.5 transition-colors text-[11px]"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Load Demo Cars</span>
              </button>
            </div>
          </div>

          {/* Success Summary if imported */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Import Operation Completed Successfully!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-emerald-500/20">
                  <div className="text-neutral-400 text-[10px] uppercase font-mono">Added to Fleet</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    +{importResult.importedCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-emerald-500/20">
                  <div className="text-neutral-400 text-[10px] uppercase font-mono">Updated Records</div>
                  <div className="text-lg font-bold font-mono text-blue-400">
                    {importResult.updatedCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-emerald-500/20">
                  <div className="text-neutral-400 text-[10px] uppercase font-mono">Skipped (Existed)</div>
                  <div className="text-lg font-bold font-mono text-neutral-400">
                    {importResult.skippedCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-emerald-500/20">
                  <div className="text-neutral-400 text-[10px] uppercase font-mono">New Marques Registered</div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    +{importResult.brandsCreated}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error notice */}
          {parseError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Parse Error:</span> {parseError}
              </div>
            </div>
          )}

          {/* Input Area (Upload or Paste) */}
          {!importResult && activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700/80 hover:border-amber-400/60 rounded-3xl p-8 sm:p-12 text-center bg-neutral-950/40 hover:bg-neutral-950/70 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-amber-400 group-hover:border-amber-400/40 mx-auto transition-all shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="mt-4 text-sm font-semibold text-white">
                {fileName ? fileName : 'Click to select or drag and drop a vehicle data file'}
              </h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Supports CSV spreadsheets (.csv) and JSON arrays (.json). Columns are automatically mapped.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-500">
                <span>UTF-8 encoding</span>
                <span>·</span>
                <span>Up to 500 cars per batch</span>
              </div>
            </div>
          )}

          {!importResult && activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Paste CSV lines (comma/tab separated) or JSON array of vehicles:</span>
                <span className="font-mono text-[11px] text-neutral-500">
                  {pastedText.length} characters
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Brand,Model,Year,Price USD,Horsepower,Top Speed KMH\nFerrari,F8 Tributo,2023,280000,710,340\nMcLaren,720S,2023,310000,710,341`}
                rows={7}
                className="w-full p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 focus:outline-none focus:border-amber-400 resize-none shadow-inner"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse Vehicle Data</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Live Validation & Preview Table */}
          {parsedCars.length > 0 && !importResult && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white">
                    {parsedCars.length} Vehicles Ready for Import
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    ({new Set(parsedCars.map((c) => c.brand)).size} unique marques)
                  </span>
                </div>

                {/* Duplicate Handling Option */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-400 font-medium">Duplicate Policy:</span>
                  <select
                    value={duplicateAction}
                    onChange={(e: any) => setDuplicateAction(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 font-mono"
                  >
                    <option value="skip">Skip Existing Vehicles</option>
                    <option value="update">Update Existing Vehicles</option>
                    <option value="create_new">Add As New (Duplicate Allowed)</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Preview Table */}
              <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-950/80 shadow-lg max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 uppercase text-[10px] font-mono sticky top-0 border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Marque</th>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3">Body Type</th>
                      <th className="py-2.5 px-3">Price USD</th>
                      <th className="py-2.5 px-3">Power</th>
                      <th className="py-2.5 px-3">Fuel</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                    {parsedCars.map((car, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-2 px-3 text-neutral-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-amber-400">{car.brand}</td>
                        <td className="py-2 px-3 text-white font-sans font-medium">{car.model}</td>
                        <td className="py-2 px-3 text-neutral-300">{car.year}</td>
                        <td className="py-2 px-3 text-neutral-400">{car.body_type}</td>
                        <td className="py-2 px-3 text-emerald-400 font-semibold">
                          {formatCurrency(car.price_usd)}
                        </td>
                        <td className="py-2 px-3 text-neutral-300">{car.horsepower} HP</td>
                        <td className="py-2 px-3 text-neutral-400">{car.fuel_type}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Valid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/60">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-500" />
            <span>New marques will automatically register in the Brands catalog.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>

            {!importResult && parsedCars.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing into Neon DB...</span>
                  </>
                ) : (
                  <>
                    <span>Import {parsedCars.length} Cars to Fleet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
