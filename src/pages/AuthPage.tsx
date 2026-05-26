import React, { useState, useRef, Suspense, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Phone, Lock, User, Store, ShieldAlert, ArrowRight, Loader2, Eye, EyeOff, Truck, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ErrorBoundary from '../components/ui/ErrorBoundary';


interface AuthPageProps {
  onSuccess: (role: string) => void;
  onNavigateHome: () => void;
}

type RoleTab = 'customer' | 'vendor' | 'admin' | 'delivery';

// High-performance Three.js particle sphere for Auth Left panel
function ParticleSphere() {
  const pointsRef = useRef<THREE.Points>(null);

  // Rotate and bob particle sphere
  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.05;
    pointsRef.current.rotation.x = Math.sin(time * 0.03) * 0.2;
  });

  // Generate sphere particles coordinates
  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    // Math for plotting coordinates on a sphere surface (fibonacci spiral)
    const k = i + 0.5;
    const phi = Math.acos(1 - (2 * k) / particleCount);
    const theta = Math.PI * (1 + 5 ** 0.5) * k;
    
    const radius = 1.6;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#06b6d4" 
        size={0.035} 
        sizeAttenuation={true} 
        transparent 
        opacity={0.65} 
      />
    </points>
  );
}

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
    { key: 'customer' as RoleTab, label: 'Customer', icon: User, color: 'indigo', desc: 'Shop & Order' },
    { key: 'vendor' as RoleTab, label: 'Vendor', icon: Store, color: 'cyan', desc: 'Sell Products' },
    { key: 'delivery' as RoleTab, label: 'Delivery', icon: Truck, color: 'cyan', desc: 'Partner' },
    { key: 'admin' as RoleTab, label: 'Admin', icon: Shield, color: 'indigo', desc: 'Manage Platform' },
  ];

  const activeTab = tabConfig.find(t => t.key === activeRole)!;

  // Cinematic void borders with glowing neon shadows on focus
  const focusBorderCls = "focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] focus:ring-cyan-400/20";
  const inputCls = `w-full bg-black/40 hover:bg-black/60 focus:bg-black/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-frost/35 border border-white/10 outline-none transition-all duration-300 focus:ring-1 ${focusBorderCls}`;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#020408] select-none text-frost overflow-hidden">
      
      {/* Left Pane - Levitating 3D particle sphere using React Three Fiber */}
      <div className="relative md:w-5/12 h-[35vh] md:h-screen text-white p-8 md:p-12 flex flex-col justify-between overflow-hidden border-r border-white/5 select-none bg-black/30">
        
        {/* Glowing backgrounds */}
        <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500 blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500 blur-[150px] animate-pulse" />
        </div>

        {/* 3D Canvas particle scene */}
        <div className="absolute inset-0 z-1 pointer-events-none">
          <ErrorBoundary fallback={<div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/15 to-cyan-950/15 animate-pulse" />}>
            <Canvas camera={{ position: [0, 0, 3] }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.4} />
                <ParticleSphere />
              </Suspense>
            </Canvas>
          </ErrorBoundary>
        </div>

        {/* Logo block */}
        <div className="relative z-10 select-none">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onNavigateHome}>
            <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-lg border border-white/20 shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              O
            </div>
            <span className="text-base font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">OmniBazaar</span>
          </div>
        </div>

        {/* floating titles */}
        <div className="my-auto relative z-10 space-y-4">
          <div className="mb-2">
            {React.createElement(activeTab.icon, { className: 'h-10 w-10 text-cyan-400 mb-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]' })}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight tracking-tight text-white whitespace-pre-line">
            {activeRole === 'customer' && 'Shop Smarter,\nLive in Orbit'}
            {activeRole === 'vendor' && 'Sell to\nCosmic Millions'}
            {activeRole === 'delivery' && 'Deliver &\nEarn in Zero-G'}
            {activeRole === 'admin' && 'Station\nConsole'}
          </h1>
          <p className="text-frost/60 text-xs sm:text-sm leading-relaxed max-w-sm font-medium">
            {activeRole === 'customer' && 'Discover premium collections floating in our multi-vendor parsec marketplace. Escrow secure.'}
            {activeRole === 'vendor' && 'Open your cosmic storefront. Leverage persistent Supabase databases and track platform sales.'}
            {activeRole === 'delivery' && 'Earn flexible allowances delivering cargos within parsec zones. Fair payload shares.'}
            {activeRole === 'admin' && 'Platform central administration console. Oversee network vendors, cargo drops, and quantum grids.'}
          </p>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-4">
          <p className="text-[10px] text-frost/30 font-mono">© 2026 OmniBazaar · Quantum Core Tech</p>
        </div>
      </div>

      {/* Right Pane - Frosted Glass centered login/signup forms */}
      <div className="relative md:w-7/12 p-6 md:p-12 flex flex-col justify-center items-center z-10">
        
        {/* Glow backdrop behind the glass card */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

        <div className="glassmorphic border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
          
          {/* Role selection tab capsules */}
          <div className="grid grid-cols-4 gap-1.5 mb-6 bg-black/45 p-1 rounded-2xl border border-white/5">
            {tabConfig.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabSwitch(tab.key)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-[9px] font-bold tracking-wider transition-all cursor-pointer uppercase ${
                  activeRole === tab.key 
                    ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-extrabold' 
                    : 'text-frost/50 hover:text-frost'
                }`}
              >
                {React.createElement(tab.icon, { className: `h-4 w-4 mb-1 ${activeRole === tab.key ? 'text-cyan-400' : 'text-frost/40'}` })}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mb-6 select-none">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-display">
              {isLogin ? `${activeTab.label} Sign In` : `Create ${activeTab.label} Account`}
            </h2>
            <p className="text-xs text-frost/45 mt-1">
              {isLogin ? 'Enter quantum keys to proceed.' : 'Input credentials to instantiate network account.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Shaking Error panel on active errorMsg */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold flex items-start gap-2.5 font-mono shadow-inner"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-cyan-500/10 border border-cyan-400/20 rounded-xl text-cyan-300 text-xs font-semibold flex items-start gap-2.5 font-mono shadow-inner animate-pulse"
                >
                  <span className="text-sm font-bold">✓</span>
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full Name (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-[9px] font-bold font-mono text-frost/45 uppercase tracking-widest mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-frost/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ravi Kumar"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Store Name (vendor signup only) */}
            {!isLogin && activeRole === 'vendor' && (
              <div>
                <label className="block text-[9px] font-bold font-mono text-frost/45 uppercase tracking-widest mb-1.5">Store Name *</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-frost/40" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Raju Electronics"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[9px] font-bold font-mono text-frost/45 uppercase tracking-widest mb-1.5">
                Email Address {isLogin ? '' : '*'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-frost/40" />
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
              <label className="block text-[9px] font-bold font-mono text-frost/45 uppercase tracking-widest mb-1.5">
                Phone Number {!isLogin ? '*' : '(or use instead of email)'}
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="w-24 shrink-0 bg-black/45 rounded-xl px-2 py-2.5 text-xs font-bold border border-white/10 text-frost outline-none cursor-pointer hover:bg-black/60 focus:border-cyan-500/50"
                >
                  <option value="+91" className="bg-[#020408] text-frost">🇮🇳 +91</option>
                  <option value="+1" className="bg-[#020408] text-frost">🇺🇸 +1</option>
                  <option value="+44" className="bg-[#020408] text-frost">🇬🇧 +44</option>
                  <option value="+971" className="bg-[#020408] text-frost">🇦🇪 +971</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-frost/40" />
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
              <label className="block text-[9px] font-bold font-mono text-frost/45 uppercase tracking-widest mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-frost/40" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-frost/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-[9px] font-bold font-mono text-frost/45 uppercase tracking-widest mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-frost/40" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-frost/40 hover:text-white"
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
              className="cursor-pointer w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 border border-white/10 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest font-display flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-white" />
              ) : (
                <>
                  <span>Sign In as {activeTab.label}</span>
                  <ArrowRight className="h-4.5 w-4.5" />
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
                className="text-[10px] font-mono uppercase tracking-widest text-frost/40 hover:text-white transition-colors cursor-pointer font-bold"
              >
                {isLogin 
                  ? "Instantiate Free Account →" 
                  : "Sign in existing credentials →"
                }
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
