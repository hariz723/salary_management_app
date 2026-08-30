import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  DollarSign,
  Users,
  BarChart3,
  HelpCircle,
  Scale,
  LogOut,
  User as UserIcon,
  Globe2,
  ShieldCheck,
} from 'lucide-react';
import { Select, Tag, Tooltip } from 'antd';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
    { id: 'directory', label: '10,000 Employee Directory', icon: Users },
    { id: 'insights', label: 'Strategic HR Q&A', icon: HelpCircle },
    { id: 'parity', label: 'Pay Parity & Bands', icon: Scale },
  ];

  const currencyOptions = [
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Org branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">ACME</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Global Compensation
                </span>
              </div>
              <span className="text-xs text-slate-500 block">10,000 Headcount Management</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200/60 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Currency Switcher & User Profile */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg p-1">
              <Globe2 className="w-4 h-4 text-slate-500 ml-1.5" />
              <Select
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                options={currencyOptions}
                bordered={false}
                className="w-32 text-xs font-semibold"
                dropdownMatchSelectWidth={false}
              />
            </div>

            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.full_name}</div>
                  <Tag color="blue" className="text-[10px] m-0 border-0 font-medium">
                    {user.role.replace('_', ' ')}
                  </Tag>
                </div>
                <Tooltip title="Log out">
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-200 px-4 py-2 space-x-2 bg-slate-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                isActive ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 bg-white border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
