import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Alert, Button, Input, Select, message } from 'antd';

export const LoginPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('HR_MANAGER');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup({ email, password, full_name: fullName, role });
        message.success('Account created successfully! Please sign in with your credentials.');
        setSuccessMsg('Account created successfully! Please enter your password to sign in.');
        setIsLogin(true);
        setPassword('');
        setFullName('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-500/30 mb-4">
          <DollarSign className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">ACME Corporation</h2>
        <p className="mt-2 text-sm text-slate-300">
          Global Salary & Compensation Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6 bg-blue-50/80 border border-blue-200/70 rounded-xl p-3.5">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>1-Click Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('hr.manager@acme.com', 'Password123')}
                className="text-left px-2.5 py-1.5 bg-white hover:bg-blue-100/60 border border-blue-200 rounded-lg text-xs transition-all text-slate-700"
              >
                <div className="font-semibold text-blue-800">HR Manager</div>
                <div className="text-[11px] text-slate-500 truncate">hr.manager@acme.com</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@acme.com', 'Admin123!')}
                className="text-left px-2.5 py-1.5 bg-white hover:bg-blue-100/60 border border-blue-200 rounded-lg text-xs transition-all text-slate-700"
              >
                <div className="font-semibold text-blue-800">System Admin</div>
                <div className="text-[11px] text-slate-500 truncate">admin@acme.com</div>
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-all ${
                isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-all ${
                !isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {successMsg && (
            <Alert
              message={successMsg}
              type="success"
              showIcon
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              className="mb-5 rounded-lg text-xs"
            />
          )}

          {errorMsg && (
            <Alert message={errorMsg} type="error" showIcon className="mb-5 rounded-lg text-xs" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <Input
                    prefix={<UserIcon className="w-4 h-4 text-slate-400 mr-1" />}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    required
                    size="large"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Role</label>
                  <Select
                    value={role}
                    onChange={setRole}
                    className="w-full"
                    size="large"
                    options={[
                      { value: 'HR_MANAGER', label: 'HR Manager' },
                      { value: 'COMPENSATION_ANALYST', label: 'Compensation Analyst' },
                      { value: 'EXECUTIVE', label: 'Executive / Leadership' },
                      { value: 'HR_ADMIN', label: 'HR Administrator' },
                    ]}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <Input
                type="email"
                prefix={<Mail className="w-4 h-4 text-slate-400 mr-1" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@acme.com"
                required
                size="large"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <Input.Password
                prefix={<Lock className="w-4 h-4 text-slate-400 mr-1" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                size="large"
              />
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-11 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 mt-2 flex items-center justify-center space-x-2"
            >
              <span>{isLogin ? 'Sign In to ACME HRIS' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
