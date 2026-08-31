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
  Globe2,
  Menu,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Select, Tag, Tooltip, Dropdown } from 'antd';
import type { MenuProps } from 'antd';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const navItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      desc: 'Payroll KPIs, pay distribution & department breakdown',
      icon: BarChart3,
    },
    {
      id: 'directory',
      label: 'Employee Directory',
      desc: 'Directory table, multi-facet filtering & salary adjustments',
      icon: Users,
    },
    {
      id: 'insights',
      label: 'Strategic HR Q&A',
      desc: 'Analytical answers to executive compensation questions',
      icon: HelpCircle,
    },
    {
      id: 'parity',
      label: 'Pay Parity & Bands',
      desc: 'Gender parity ratios & salary band governance',
      icon: Scale,
    },
  ];

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  const menuItems: MenuProps['items'] = navItems.map((item) => {
    const Icon = item.icon;
    const isSelected = activeTab === item.id;
    return {
      key: item.id,
      label: (
        <div
          onClick={() => setActiveTab(item.id)}
          className={`flex items-start space-x-3 p-2.5 rounded-xl transition-all cursor-pointer ${
            isSelected ? 'bg-blue-50/80 text-blue-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">{item.label}</span>
              {isSelected && (
                <Tag color="blue" className="text-[10px] m-0 font-semibold border-0">
                  Active
                </Tag>
              )}
            </div>
            <p className="text-xs text-slate-400 font-normal mt-0.5 max-w-xs">{item.desc}</p>
          </div>
        </div>
      ),
    };
  });

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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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
            </div>
          </div>

          {/* Center: Interactive Dropdown Menu */}
          <div className="flex items-center">
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement="bottom"
              dropdownRender={(menu) => (
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-2 min-w-[340px]">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Module / View</span>
                    </div>
                  </div>
                  {menu}
                </div>
              )}
            >
              <button className="flex items-center space-x-2.5 px-4 py-2 bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 rounded-xl font-semibold text-sm transition-all border border-slate-200/60 shadow-xs group">
                <Menu className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="flex items-center space-x-2">
                  <CurrentIcon className="w-4 h-4 text-slate-600" />
                  <span>{currentItem.label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
              </button>
            </Dropdown>
          </div>

          {/* Right: Currency & Profile */}
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
    </header>
  );
};
