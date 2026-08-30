import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMetadata } from '../services/api';
import { ExchangeRate } from '../types';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  currencies: ExchangeRate[];
  formatMoney: (amountUsd: number, overrideCurrency?: string) => string;
  convertFromUsd: (amountUsd: number, targetCurrency?: string) => number;
}

const DEFAULT_RATES: Record<string, { symbol: string; rateToUsd: number }> = {
  USD: { symbol: '$', rateToUsd: 1.0 },
  EUR: { symbol: '€', rateToUsd: 1.09 },
  GBP: { symbol: '£', rateToUsd: 1.28 },
  INR: { symbol: '₹', rateToUsd: 0.012 },
  SGD: { symbol: 'S$', rateToUsd: 0.75 },
  CAD: { symbol: 'CA$', rateToUsd: 0.74 },
  AUD: { symbol: 'A$', rateToUsd: 0.66 },
  JPY: { symbol: '¥', rateToUsd: 0.0067 },
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [currencies, setCurrencies] = useState<ExchangeRate[]>([]);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const meta = await getMetadata();
        setCurrencies(meta.currencies);
      } catch (err) {
        console.warn('Using default fallback currency rates');
      }
    };
    loadRates();
  }, []);

  const convertFromUsd = (amountUsd: number, targetCurrency?: string): number => {
    const target = targetCurrency || selectedCurrency;
    if (target === 'USD') return amountUsd;

    const rateObj = currencies.find((c) => c.currency_code === target);
    const rateToUsd = rateObj ? rateObj.rate_to_usd : DEFAULT_RATES[target]?.rateToUsd || 1.0;
    return amountUsd / rateToUsd;
  };

  const formatMoney = (amountUsd: number, overrideCurrency?: string): string => {
    const curr = overrideCurrency || selectedCurrency;
    const rateObj = currencies.find((c) => c.currency_code === curr);
    const symbol = rateObj?.symbol || DEFAULT_RATES[curr]?.symbol || '$';
    const converted = convertFromUsd(amountUsd, curr);

    if (curr === 'JPY') {
      return `${symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        currencies,
        formatMoney,
        convertFromUsd,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
