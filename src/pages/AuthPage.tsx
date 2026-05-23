import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { Mail, Phone, Lock, User, Store, ShieldAlert, ArrowRight, Loader2, Eye, EyeOff, Truck, Shield } from 'lucide-react';

interface AuthPageProps {
  onSuccess: (role: string) => void;
  onNavigateHome: () => void;
}

type RoleTab = 'customer' | 'vendor' | 'admin' | 'delivery';

export default function AuthPage({ onSuccess, onNavigateHome }: AuthPageProps) {
  const { t } = useLanguage();
  const { login, signup } = useAuth();

  const [activeRole, setActiveRole] = useState<RoleTab>('customer');
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehiclePlate, setVehiclePlate] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');

    setStoreName('');
    setVehiclePlate('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleTabSwitch = (role: RoleTab) => {
    setActiveRole(role);
    setIsLogin(true);
    resetForm();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);


    if (!isLogin) {
      if (!name.trim()) {
        setErrorMsg('Full name is required.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Email address is required.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!phone.trim() || phone.length < 5) {
        setErrorMsg('Please enter a valid phone number.');
        return;
      }
      if (!password.trim() || password.length < 4) {
        setErrorMsg('Password must be at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone.trim()}`;

      if (isLogin) {
        const credentials = email.trim() || fullPhone;
        if (!credentials) {
          setErrorMsg('Please enter your email or phone number.');
          setLoading(false);
          return;
        }
        const authenticatedUser = await login(credentials, password);
        setSuccessMsg(`Welcome back, ${authenticatedUser.name}! Redirecting...`);
        setTimeout(() => onSuccess(authenticatedUser.role), 600);
      } else {
        let role: string = activeRole;
        const registeredUser = await signup({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          code: password,
          role: role as any,
          storeName: role === 'vendor' ? storeName : undefined
        });
        setSuccessMsg(`Account created! Welcome, ${registeredUser.name}!`);
        setTimeout(() => onSuccess(registeredUser.role), 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabConfig = [
    { key: 'customer' as RoleTab, label: 'Customer', icon: User, color: 'blue', desc: 'Shop & Order' },
    { key: 'vendor' as RoleTab, label: 'Vendor', icon: Store, color: 'green', desc: 'Sell Products' },
    { key: 'delivery' as RoleTab, label: 'Delivery', icon: Truck, color: 'orange', desc: 'Partner' },
    { key: 'admin' as RoleTab, label: 'Admin', icon: Shield, color: 'purple', desc: 'Manage Platform' },
  ];

  const activeTab = tabConfig.find(t => t.key === activeRole)!;
  const colorMap: Record<string, string> = {
    blue: 'from-blue-600 to-indigo-700',
    green: 'from-emerald-600 to-green-700',
    orange: 'from-orange-500 to-amber-600',
    purple: 'from-violet-600 to-purple-700',
  };
  const btnMap: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-emerald-600 hover:bg-emerald-700',
    orange: 'bg-orange-500 hover:bg-orange-600',
    purple: 'bg-violet-600 hover:bg-violet-700',
  };
  const borderMap: Record<string, string> = {
    blue: 'focus:border-blue-500 focus:ring-blue-500/30',
    green: 'focus:border-green-500 focus:ring-green-500/30',
    orange: 'focus:border-orange-500 focus:ring-orange-500/30',
    purple: 'focus:border-violet-500 focus:ring-violet-500/30',
  };

  const inputCls = `w-full bg-gray-50 hover:bg-white focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 outline-none transition-all ${borderMap[activeTab.color]} focus:ring-1`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      
      {/* Left Banner */}
      <div className={`md:w-2/5 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b ${colorMap[activeTab.color]}`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-xl border border-white/30">
              O
            </div>
            <span className="text-lg font-bold tracking-tight">OmniBazaar</span>
          </div>
        </div>

        <div className="my-12 relative z-10">
          <div className="mb-4">
            {React.createElement(activeTab.icon, { className: 'h-12 w-12 text-white/80 mb-4' })}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            {activeRole === 'customer' && 'Shop Smarter,\nLive Better'}
            {activeRole === 'vendor' && 'Sell to\nMillions'}
            {activeRole === 'delivery' && 'Deliver &\nEarn More'}
            {activeRole === 'admin' && 'Platform\nControl'}
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            {activeRole === 'customer' && 'Discover products from thousands of vendors across India. Fast delivery, secure payments, guaranteed satisfaction.'}
            {activeRole === 'vendor' && 'Join OmniBazaar and reach millions of shoppers. Manage your store, track orders, and grow your business.'}
            {activeRole === 'delivery' && 'Become a delivery partner and earn by delivering orders in your area. Flexible hours, fair pay.'}
            {activeRole === 'admin' && 'Manage the entire marketplace platform. Monitor vendors, users, orders, and analytics.'}
          </p>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-4">
          <p className="text-xs text-white/50 font-mono">© 2026 OmniBazaar · Bharat Commerce Tech</p>
        </div>
      </div>

      {/* Right Auth Form */}
      <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-4 gap-1.5 mb-6 bg-gray-100 p-1.5 rounded-2xl">
            {tabConfig.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabSwitch(tab.key)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  activeRole === tab.key 
                    ? 'bg-white shadow-sm text-gray-800' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {React.createElement(tab.icon, { className: `h-4 w-4 mb-0.5 ${activeRole === tab.key ? 'text-current' : 'text-gray-400'}` })}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {isLogin ? `${activeTab.label} Sign In` : `Create ${activeTab.label} Account`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isLogin ? 'Enter your credentials to continue.' : 'Fill in your details to create an account.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-start gap-2">
                <span className="text-lg">✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Full Name (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ravi Kumar"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Store Name (vendor signup only) */}
            {!isLogin && activeRole === 'vendor' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Store Name *</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="e.g. Raju Electronics"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address {isLogin ? '' : '*'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required={!isLogin}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number {!isLogin ? '*' : '(or use instead of email)'}
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="w-28 shrink-0 bg-gray-50 rounded-xl px-2 py-2.5 text-xs font-bold border border-gray-200 outline-none cursor-pointer"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required={!isLogin}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 4 characters"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}



            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 ${btnMap[activeTab.color]}`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? `Sign In as ${activeTab.label}` : `Create ${activeTab.label} Account`}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle login/signup */}
          {(activeRole === 'customer' || activeRole === 'vendor') && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                {isLogin 
                  ? `Don't have an account? Create one for free →` 
                  : `Already have an account? Sign in →`
                }
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
