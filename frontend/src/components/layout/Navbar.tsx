import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Select,
  FormControl,
  Avatar,
  ListItemIcon,
} from '@mui/material';
import {
  AttachMoney,
  People,
  BarChart,
  HelpOutline,
  Balance,
  Logout,
  Public,
  Menu as MenuIcon,
  KeyboardArrowDown,
  AutoAwesome,
} from '@mui/icons-material';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      desc: 'Payroll KPIs, pay distribution & department breakdown',
      icon: BarChart,
      color: '#2563eb',
    },
    {
      id: 'directory',
      label: 'Employee Directory',
      desc: 'Directory table, multi-facet filtering & salary adjustments',
      icon: People,
      color: '#059669',
    },
    {
      id: 'insights',
      label: 'Strategic HR Q&A',
      desc: 'Analytical answers to executive compensation questions',
      icon: HelpOutline,
      color: '#7c3aed',
    },
    {
      id: 'parity',
      label: 'Pay Parity & Bands',
      desc: 'Gender parity ratios & salary band governance',
      icon: Balance,
      color: '#db2777',
    },
  ];

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    handleCloseMenu();
  };

  const currencies = [
    { value: 'USD', label: '🇺🇸 USD ($)' },
    { value: 'EUR', label: '🇪🇺 EUR (€)' },
    { value: 'GBP', label: '🇬🇧 GBP (£)' },
    { value: 'INR', label: '🇮🇳 INR (₹)' },
    { value: 'SGD', label: '🇸🇬 SGD (S$)' },
    { value: 'CAD', label: '🇨🇦 CAD (CA$)' },
    { value: 'AUD', label: '🇦🇺 AUD (A$)' },
    { value: 'JPY', label: '🇯🇵 JPY (¥)' },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
      }}
    >
      <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, justifyContent: 'space-between' }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            variant="rounded"
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              color: '#ffffff',
              width: 40,
              height: 40,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <AttachMoney fontSize="medium" />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                PayHub
              </Typography>
              <Chip
                label="Global Compensation"
                size="small"
                sx={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  height: 22,
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Center Menu Dropdown */}
        <Box>
          <Button
            variant="outlined"
            onClick={handleOpenMenu}
            startIcon={<MenuIcon sx={{ color: '#2563eb', fontSize: 20 }} />}
            endIcon={<KeyboardArrowDown sx={{ color: '#64748b', fontSize: 18 }} />}
            sx={{
              borderColor: '#e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.875rem',
              px: 2.25,
              py: 0.85,
              borderRadius: 3,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1',
              },
            }}
          >
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <CurrentIcon sx={{ fontSize: 18, color: currentItem.color }} />
              <span>{currentItem.label}</span>
            </Box>
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: {
                width: { xs: 340, sm: 400 },
                maxWidth: '95vw',
                borderRadius: 4,
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                border: '1px solid #f1f5f9',
                p: 1.25,
              },
            }}
            transformOrigin={{ horizontal: 'center', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          >
            {/* Header Section */}
            <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #f1f5f9', mb: 1 }}>
              <AutoAwesome sx={{ fontSize: 16, color: '#2563eb' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.05em' }}>
                SELECT WORKSPACE MODULE
              </Typography>
            </Box>

            {/* Menu Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <MenuItem
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  sx={{
                    borderRadius: 2.5,
                    mb: 0.75,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    whiteSpace: 'normal',
                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                    '&:hover': {
                      backgroundColor: isSelected ? '#dbeafe' : '#f8fafc',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 44, mr: 1, mt: 0.25 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: isSelected ? item.color : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                      }}
                    >
                      <Icon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                        {item.label}
                      </Typography>
                      {isSelected && (
                        <Chip label="Active" size="small" color="primary" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 800, px: 0.5 }} />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25, lineHeight: 1.35 }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            })}
          </Menu>
        </Box>

        {/* Right Currency & User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f8fafc', px: 1, py: 0.25, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
            <Public sx={{ fontSize: 18, color: '#64748b', mr: 0.5 }} />
            <FormControl variant="standard" size="small">
              <Select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                disableUnderline
                sx={{
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: '#0f172a',
                  '& .MuiSelect-select': { py: 0.5 },
                }}
              >
                {currencies.map((c) => (
                  <MenuItem key={c.value} value={c.value} sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1.5, borderLeft: '1px solid #e2e8f0' }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
                  {user.full_name}
                </Typography>
                <Chip
                  label={user.role.replace('_', ' ')}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    mt: 0.25,
                  }}
                />
              </Box>

              <Tooltip title="Log out">
                <IconButton
                  onClick={logout}
                  size="small"
                  sx={{
                    color: '#64748b',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    '&:hover': { color: '#ef4444', bgcolor: '#fef2f2', borderColor: '#fecaca' },
                  }}
                >
                  <Logout fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
