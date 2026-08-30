import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './components/auth/LoginPage';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { DirectoryTab } from './components/directory/DirectoryTab';
import { InsightsTab } from './components/analytics/InsightsTab';
import { PayParityTab } from './components/analytics/PayParityTab';
import { Spin, ConfigProvider } from 'antd';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [directoryFilter, setDirectoryFilter] = useState<{
    department?: string;
    country?: string;
    band_status?: string;
  } | undefined>(undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigateToDirectory = (filter?: {
    department?: string;
    country?: string;
    band_status?: string;
  }) => {
    setDirectoryFilter(filter);
    setActiveTab('directory');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <OverviewTab onNavigateToDirectory={handleNavigateToDirectory} />
        )}
        {activeTab === 'directory' && <DirectoryTab initialFilter={directoryFilter} />}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'parity' && <PayParityTab />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 10,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    >
      <AuthProvider>
        <CurrencyProvider>
          <MainLayout />
        </CurrencyProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
