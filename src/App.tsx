import React, { useState, useEffect } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/views/OverviewView';
import { CarsView } from './components/views/CarsView';
import { BrandsView } from './components/views/BrandsView';
import { UsersView } from './components/views/UsersView';
import { ReviewsView } from './components/views/ReviewsView';
import { AdsView } from './components/views/AdsView';
import { EngagementView } from './components/views/EngagementView';
import { SqlStudioView } from './components/views/SqlStudioView';
import { DiagnosticsView } from './components/views/DiagnosticsView';
import { OverviewData, HealthStatus } from './types';
import { VehicleFormModal } from './components/modals/VehicleFormModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [adsCount, setAdsCount] = useState<number>(4);
  const [brandsCount, setBrandsCount] = useState<number>(23);
  const [selectedBrandForFleet, setSelectedBrandForFleet] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global Add Vehicle Modal trigger from Navbar/Hero
  const [isGlobalAddVehicleOpen, setIsGlobalAddVehicleOpen] = useState(false);

  const fetchGlobalData = async (isRetry = false) => {
    try {
      setIsRefreshing(true);
      const overviewRes = await fetch('/api/overview');
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverviewData(data);
      } else if (!isRetry) {
        setTimeout(() => fetchGlobalData(true), 1500);
        return;
      }

      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealthStatus(data);
      }

      const adsRes = await fetch('/api/ads');
      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAdsCount(adsData?.length ?? 4);
      }

      const brandsRes = await fetch('/api/brands');
      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setBrandsCount(brandsData?.length ?? 23);
      }
    } catch (err) {
      if (!isRetry) {
        setTimeout(() => fetchGlobalData(true), 1500);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const handleGlobalCreateVehicle = async (carData: any) => {
    const res = await fetch('/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create vehicle');
    }
    fetchGlobalData();
    setCurrentTab('fleet');
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-400/20 selection:text-amber-300">
      {/* Sleek Obsidian Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        carsCount={overviewData?.cars?.total_cars ?? 27}
        brandsCount={brandsCount}
        usersCount={overviewData?.users?.total_users ?? 1}
        reviewsCount={overviewData?.reviews?.total_reviews ?? 4}
        adsCount={adsCount}
        isDbConnected={healthStatus?.status === 'connected'}
        latencyMs={healthStatus?.latencyMs}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Bar Contract Navbar */}
        <Navbar
          currentTab={currentTab}
          onRefresh={fetchGlobalData}
          isRefreshing={isRefreshing}
          onAddVehicle={() => setIsGlobalAddVehicleOpen(true)}
          onAddUser={() => setCurrentTab('users')}
          onAddReview={() => setCurrentTab('reviews')}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 pb-16">
          {currentTab === 'overview' && (
            <OverviewView
              data={overviewData}
              loading={loading}
              onNavigate={(tab) => setCurrentTab(tab)}
              onAddVehicle={() => setIsGlobalAddVehicleOpen(true)}
            />
          )}

          {currentTab === 'fleet' && (
            <CarsView
              onAddVehicle={() => setIsGlobalAddVehicleOpen(true)}
              initialBrandFilter={selectedBrandForFleet}
            />
          )}

          {currentTab === 'brands' && (
            <BrandsView
              onNavigateToFleet={(brand) => {
                setSelectedBrandForFleet(brand);
                setCurrentTab('fleet');
              }}
              onBrandCountChange={(count) => setBrandsCount(count)}
            />
          )}

          {currentTab === 'users' && <UsersView />}

          {currentTab === 'reviews' && <ReviewsView />}

          {currentTab === 'ads' && <AdsView />}

          {currentTab === 'engagement' && <EngagementView />}

          {currentTab === 'sql' && <SqlStudioView />}

          {currentTab === 'diagnostics' && <DiagnosticsView />}
        </main>
      </div>

      {/* Global Add Vehicle Modal */}
      <VehicleFormModal
        isOpen={isGlobalAddVehicleOpen}
        onClose={() => setIsGlobalAddVehicleOpen(false)}
        onSave={handleGlobalCreateVehicle}
      />
    </div>
  );
}
