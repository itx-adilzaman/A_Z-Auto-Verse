import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Car } from '../../types';
import { safeJsonParse } from '../../utils';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carData: Partial<Car>) => Promise<void>;
  initialCar?: Car | null;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCar,
}) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'powertrain' | 'chassis' | 'features' | 'images'>('basics');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Car>>({
    brand: '',
    model: '',
    variant: '',
    year: 2026,
    body_type: 'Supercar',
    price_usd: 250000,
    fuel_type: 'Petrol',
    engine: '4.0L Twin-Turbo V8',
    horsepower: 650,
    torque_nm: 800,
    transmission: '8-Speed Dual-Clutch',
    drivetrain: 'AWD',
    top_speed_kmh: 330,
    acceleration_0_100: 2.9,
    mileage: '12.0 L/100km',
    dimensions: '4,550 × 1,980 × 1,220 mm',
    wheelbase: '2,650 mm',
    weight_kg: 1550,
    ground_clearance: '110 mm',
    boot_space: '150 L',
    seating: 2,
    tyre_size: 'Front: 265/35 R20, Rear: 325/30 R21',
    brakes: 'Carbon Ceramic Discs',
    suspension: 'Adaptive Magnetic Ride Control',
    safety_rating: 5.0,
    description: '',
    country: 'Germany',
    rating: 5.0,
    reviews_count: 0,
    is_featured: false,
    is_trending: false,
    is_electric: false,
    is_supercar: true,
    is_sports: false,
    is_suv: false,
    is_budget_friendly: false,
  });

  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');

  useEffect(() => {
    if (initialCar) {
      setFormData({ ...initialCar });
      setFeaturesList(safeJsonParse<string[]>(initialCar.features, []));
      setImagesList(safeJsonParse<string[]>(initialCar.images, []));
    } else {
      setFormData({
        brand: '',
        model: '',
        variant: '',
        year: 2026,
        body_type: 'Supercar',
        price_usd: 250000,
        fuel_type: 'Petrol',
        engine: '4.0L Twin-Turbo V8',
        horsepower: 650,
        torque_nm: 800,
        transmission: '8-Speed Dual-Clutch',
        drivetrain: 'AWD',
        top_speed_kmh: 330,
        acceleration_0_100: 2.9,
        mileage: '12.0 L/100km',
        dimensions: '4,550 × 1,980 × 1,220 mm',
        wheelbase: '2,650 mm',
        weight_kg: 1550,
        ground_clearance: '110 mm',
        boot_space: '150 L',
        seating: 2,
        tyre_size: 'Front: 265/35 R20, Rear: 325/30 R21',
        brakes: 'Carbon Ceramic Discs',
        suspension: 'Adaptive Magnetic Ride Control',
        safety_rating: 5.0,
        description: '',
        country: 'Germany',
        rating: 5.0,
        reviews_count: 0,
        is_featured: false,
        is_trending: false,
        is_electric: false,
        is_supercar: true,
        is_sports: false,
        is_suv: false,
        is_budget_friendly: false,
      });
      setFeaturesList([
        'Active Aerodynamic Wing',
        'Carbon Ceramic Brakes',
        'Launch Control',
        'Track Telemetry App',
      ]);
      setImagesList([
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80',
      ]);
    }
    setError(null);
  }, [initialCar, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Car, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeaturesList((prev) => [...prev, newFeature.trim()]);
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeaturesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (!newImage.trim()) return;
    setImagesList((prev) => [...prev, newImage.trim()]);
    setNewImage('');
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model) {
      setError('Brand and Model are required fields.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        ...formData,
        features: featuresList,
        images: imagesList,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">
              {initialCar ? `Edit ${initialCar.brand} ${initialCar.model}` : 'Add New Vehicle to Neon DB'}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure complete mechanical parameters and listing flags
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-neutral-950/70 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {(
            [
              { id: 'basics', label: '1. Identity & Pricing' },
              { id: 'powertrain', label: '2. Powertrain & Speed' },
              { id: 'chassis', label: '3. Dimensions & Chassis' },
              { id: 'features', label: `4. Features (${featuresList.length})` },
              { id: 'images', label: `5. Gallery (${imagesList.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Manufacturer / Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand || ''}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    placeholder="e.g. Porsche, Ferrari, Bugatti"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model || ''}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="e.g. 911 GT3 RS, SF90 Stradale"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Variant / Edition
                  </label>
                  <input
                    type="text"
                    value={formData.variant || ''}
                    onChange={(e) => handleChange('variant', e.target.value)}
                    placeholder="e.g. Weissach Package, Assetto Fiorano"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Model Year
                  </label>
                  <input
                    type="number"
                    value={formData.year || 2026}
                    onChange={(e) => handleChange('year', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Body Style
                  </label>
                  <select
                    value={formData.body_type || 'Supercar'}
                    onChange={(e) => handleChange('body_type', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Supercar">Supercar</option>
                    <option value="Hypercar">Hypercar</option>
                    <option value="Sports">Sports</option>
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.price_usd || ''}
                    onChange={(e) => handleChange('price_usd', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-amber-400 font-mono font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Germany, Italy, USA"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Executive Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter detailed automotive heritage and technical summary..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              {/* Status Toggles */}
              <div className="pt-2 border-t border-neutral-800">
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  PORTAL PROMOTION & CLASSIFICATION FLAGS
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_featured)}
                      onChange={(e) => handleChange('is_featured', e.target.checked)}
                      className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs text-neutral-200">Featured Hero</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_trending)}
                      onChange={(e) => handleChange('is_trending', e.target.checked)}
                      className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs text-neutral-200">Trending</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_supercar)}
                      onChange={(e) => handleChange('is_supercar', e.target.checked)}
                      className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs text-neutral-200">Supercar Spec</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_electric)}
                      onChange={(e) => handleChange('is_electric', e.target.checked)}
                      className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs text-neutral-200">Electric (EV)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POWERTRAIN & SPEED */}
          {activeTab === 'powertrain' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Engine / Displacement
                  </label>
                  <input
                    type="text"
                    value={formData.engine || ''}
                    onChange={(e) => handleChange('engine', e.target.value)}
                    placeholder="e.g. 4.0L Naturally Aspirated Flat-6"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Horsepower (HP)
                  </label>
                  <input
                    type="number"
                    value={formData.horsepower || ''}
                    onChange={(e) => handleChange('horsepower', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Torque (Nm)
                  </label>
                  <input
                    type="number"
                    value={formData.torque_nm || ''}
                    onChange={(e) => handleChange('torque_nm', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Transmission
                  </label>
                  <input
                    type="text"
                    value={formData.transmission || ''}
                    onChange={(e) => handleChange('transmission', e.target.value)}
                    placeholder="7-Speed Dual-Clutch (PDK)"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Drivetrain
                  </label>
                  <select
                    value={formData.drivetrain || 'RWD'}
                    onChange={(e) => handleChange('drivetrain', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="RWD">RWD (Rear-Wheel Drive)</option>
                    <option value="AWD">AWD (All-Wheel Drive)</option>
                    <option value="FWD">FWD (Front-Wheel Drive)</option>
                    <option value="4WD">4WD (Four-Wheel Drive)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Fuel / Energy Type
                  </label>
                  <input
                    type="text"
                    value={formData.fuel_type || ''}
                    onChange={(e) => handleChange('fuel_type', e.target.value)}
                    placeholder="Petrol, Hybrid, Electric"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Top Speed (km/h)
                  </label>
                  <input
                    type="number"
                    value={formData.top_speed_kmh || ''}
                    onChange={(e) => handleChange('top_speed_kmh', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    0-100 km/h (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.acceleration_0_100 || ''}
                    onChange={(e) => handleChange('acceleration_0_100', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Mileage / Fuel Consumption
                  </label>
                  <input
                    type="text"
                    value={formData.mileage || ''}
                    onChange={(e) => handleChange('mileage', e.target.value)}
                    placeholder="13.4 L/100km or 18.2 kWh/100km"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHASSIS & DIMENSIONS */}
          {activeTab === 'chassis' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Dimensions (L × W × H)
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions || ''}
                    onChange={(e) => handleChange('dimensions', e.target.value)}
                    placeholder="4,572 × 1,900 × 1,322 mm"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Wheelbase
                  </label>
                  <input
                    type="text"
                    value={formData.wheelbase || ''}
                    onChange={(e) => handleChange('wheelbase', e.target.value)}
                    placeholder="2,457 mm"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Curb Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight_kg || ''}
                    onChange={(e) => handleChange('weight_kg', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Ground Clearance
                  </label>
                  <input
                    type="text"
                    value={formData.ground_clearance || ''}
                    onChange={(e) => handleChange('ground_clearance', e.target.value)}
                    placeholder="100 mm"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Boot / Luggage Space
                  </label>
                  <input
                    type="text"
                    value={formData.boot_space || ''}
                    onChange={(e) => handleChange('boot_space', e.target.value)}
                    placeholder="132 L"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Passenger Seating
                  </label>
                  <input
                    type="number"
                    value={formData.seating || 2}
                    onChange={(e) => handleChange('seating', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Braking System
                  </label>
                  <input
                    type="text"
                    value={formData.brakes || ''}
                    onChange={(e) => handleChange('brakes', e.target.value)}
                    placeholder="Porsche Ceramic Composite Brakes (PCCB) 410mm"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Suspension
                  </label>
                  <input
                    type="text"
                    value={formData.suspension || ''}
                    onChange={(e) => handleChange('suspension', e.target.value)}
                    placeholder="Double Wishbone Front with Ball Joints & Active Damper Tuning"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tyre Specifications
                </label>
                <input
                  type="text"
                  value={formData.tyre_size || ''}
                  onChange={(e) => handleChange('tyre_size', e.target.value)}
                  placeholder="Front: 275/35 ZR20, Rear: 335/30 ZR21 Michelin Cup 2 R"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 4: FEATURES LIST */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="Add custom feature (e.g. F1-Style Drag Reduction System)..."
                  className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Feature</span>
                </button>
              </div>

              <div className="space-y-2">
                {featuresList.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-neutral-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {featuresList.length === 0 && (
                  <p className="text-xs text-neutral-500 italic">No features added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: IMAGES GALLERY */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Paste high-res image URL (e.g. https://images.unsplash.com/...)..."
                  className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {imagesList.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 group"
                  >
                    <img
                      src={url}
                      alt="Car asset"
                      className="w-full h-32 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                      <span className="text-[10px] font-mono text-neutral-300">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded bg-rose-500/80 text-white hover:bg-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {saving ? (
                <span>Writing to Neon DB...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{initialCar ? 'Save Changes' : 'Create Vehicle'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
