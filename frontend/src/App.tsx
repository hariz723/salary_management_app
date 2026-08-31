import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './components/auth/LoginPage';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { DirectoryTab } from './components/directory/DirectoryTab';
import { InsightsTab } from './components/analytics/InsightsTab';
import { PayParityTab } from './components/analytics/PayParityTab';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { muiTheme } from './theme/theme';

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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
        }}
      >
        <CircularProgress size={48} sx={{ color: '#60a5fa' }} />
      </Box>
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Box component="main" sx={{ flex: 1, maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, pt: 3 }}>
        {activeTab === 'overview' && (
          <OverviewTab onNavigateToDirectory={handleNavigateToDirectory} />
        )}
        {activeTab === 'directory' && <DirectoryTab initialFilter={directoryFilter} />}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'parity' && <PayParityTab />}
      </Box>
    </Box>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <CurrencyProvider>
          <MainLayout />
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
