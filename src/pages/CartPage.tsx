import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import MapPicker from '../components/MapPicker';
import { 
  ShoppingBag, Trash2, ShieldCheck, CreditCard, ArrowRight, Loader2, MapPin,
  CheckCircle, Banknote, Package, X, Plus, Minus,
  User, Phone, Ticket, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartPageProps {
  onNavigateTo: (page: string) => void;
}

interface Address {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  contactNumber?: string;
  altContactNumber?: string;
  addressLine: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

type CheckoutStep = 'address' | 'coupon' | 'invoice' | 'payment' | 'receipt';
type PaymentMethod = 'debit' | 'credit' | 'upi' | 'cod';

export default function CartPage({ onNavigateTo }: CartPageProps) {
  const { cart, removeFromCart, updateCartQuantity, addToCart, removeFromWishlist, clearCart } = useCart();
  const { token, user } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<CheckoutStep>('address');

  // Address states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addrFullName, setAddrFullName] = useState(user?.name || '');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '');
  const [contactNumber, setContactNumber] = useState('');
  const [altContactNumber, setAltContactNumber] = useState('');
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrLatitude, setAddrLatitude] = useState(11.0168);
  const [addrLongitude, setAddrLongitude] = useState(76.9558);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Coupon
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 0;
  
  const hasMatchingCategory = appliedCoupon ? cart.some(item => item.category === appliedCoupon.categorySlug) : false;
  const finalDiscount = hasMatchingCategory ? (cartSubtotal * appliedCoupon.discountAmount / 100) : 0;
  
  const grandTotal = Math.max(0, cartSubtotal - finalDiscount);

  const fallbackAddress: Address = {
    label: 'Home',
    fullName: user?.name || 'Customer',
    phone: user?.phone || '9876543210',
    addressLine: 'Main Bazaar Road',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641001',
    latitude: 11.0168,
    longitude: 76.9558
  };

  const fetchSavedAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.addresses && data.addresses.length > 0) {
          setAddresses(data.addresses);
        } else {
          setAddresses([fallbackAddress]);
        }
      } else {
        setAddresses([fallbackAddress]);
      }
    } catch (e) {
      setAddresses([fallbackAddress]);
    }
  };

  useEffect(() => {
    fetchSavedAddresses();
    if (user) {
      setAddrFullName(user.name || '');
      setAddrPhone(user.phone || '');
    }
  }, [token]);

  useEffect(() => {
    if (step === 'coupon') {
      const loadCoupons = async () => {
        setLoadingCoupons(true);
        try {
          const res = await fetch('/api/coupons');
          if (res.ok) {
            const data = await res.json();
            setAvailableCoupons(data.coupons || []);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingCoupons(false);
        }
      };
      loadCoupons();
    }
  }, [step]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine.trim()) return;
    setLoading(true);
    try {
      const newAddr: Address = {
        label: addrLabel || 'Home',
        fullName: addrFullName,
        phone: addrPhone,
        contactNumber,
        altContactNumber,
        addressLine: addrLine,
        city: addrCity,
        district: addrDistrict,
        state: addrState,
        pincode: addrPincode,
        latitude: addrLatitude,
        longitude: addrLongitude
      };

      if (token) {
        const res = await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newAddr)
        });
        if (res.ok) await fetchSavedAddresses();
      } else {
        setAddresses(prev => [newAddr, ...prev]);
      }

      setShowNewAddressForm(false);
      setSelectedAddressIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMapLocationSelected = (location: any) => {
    setAddrLine(location.address || '');
    setAddrCity(location.city || '');
    setAddrDistrict(location.district || '');
    setAddrState(location.state || '');
    setAddrPincode(location.pincode || '');
    setAddrLatitude(location.latitude);
    setAddrLongitude(location.longitude);
  };

  const validatePayment = (): string | null => {
    if (paymentMethod === 'debit' || paymentMethod === 'credit') {
      if (cardNumber.replace(/\s/g, '').length < 12) return 'Please enter a valid card number.';
      if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) return 'Enter card expiry as MM/YY.';
      if (cardCVV.length < 3) return 'CVV must be 3 digits.';
      if (!cardName.trim()) return 'Enter the cardholder name.';
    } else if (paymentMethod === 'upi') {
      if (!upiId.includes('@')) return 'Please enter a valid UPI ID containing @.';
    }
    return null;
  };

  const isPaymentValid = () => {
    if (paymentMethod === 'upi') return upiId.includes('@');
    if (paymentMethod === 'debit' || paymentMethod === 'credit') {
      return cardNumber.replace(/\s/g, '').length >= 12 &&
             /^\d{2}\/\d{2}$/.test(cardExpiry) &&
             cardCVV.length >= 3 &&
             cardName.trim().length > 0;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    const validationErr = validatePayment();
    if (validationErr && paymentMethod !== 'cod') {
      alert(validationErr);
      return;
    }

    if (!token) {
      alert('Please log in to place an order.');
      onNavigateTo('auth');
      return;
    }

    setPaymentProcessing(true);
    // Simulate payment processing delay for card/upi
    if (paymentMethod !== 'cod') {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setLoading(true);
    const chosenAddress = addresses[selectedAddressIndex] || fallbackAddress;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
          deliveryAddress: chosenAddress,
          paymentMethod,
          totalAmount: grandTotal,
          appliedCouponId: appliedCoupon ? appliedCoupon.id : null,
          paymentDetails: (paymentMethod === 'debit' || paymentMethod === 'credit') 
            ? { cardLast4: cardNumber.slice(-4), cardName } 
            : (paymentMethod === 'upi') ? { upiId } : {}
        })
      });

      if (res.ok) {
        const data = await res.json();
        const totalPaid = data.orders?.reduce((sum: number, o: any) => sum + o.totalAmount, 0) || grandTotal;
        setSuccessOrder({ 
          ...(data.order || data.orders?.[0] || { id: 'OB-' + Date.now() }),
          totalAmount: totalPaid
        });
        clearCart();
        setStep('receipt');
      } else {
        const err = await res.json();
        alert(`Order failed: ${err.error || 'Please try again.'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  // Step indicator
  const steps = [
    { key: 'address', label: 'Address', num: 1 },
    { key: 'coupon', label: 'Offers', num: 2 },
    { key: 'invoice', label: 'Invoice', num: 3 },
    { key: 'payment', label: 'Payment', num: 4 },
  ];

  const stepIndex = steps.findIndex(s => s.key === step);

  const StepIndicator = () => (
    <div className="glassmorphic p-4.5 rounded-2xl border border-white/10 shadow-lg mb-6 select-none">
      <div className="flex justify-between items-center max-w-lg mx-auto relative pt-1">
        <div className="absolute left-[10%] right-[10%] top-[35%] h-[2px] bg-white/10 -z-1" />
        <motion.div
          className="absolute left-[10%] top-[35%] h-[2px] bg-cyan-400 -z-1"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, (stepIndex / (steps.length - 1)) * 80)}%` }}
          transition={{ duration: 0.4 }}
        />
        {steps.map((s, i) => (
          <button
            type="button"
            key={s.key}
            onClick={() => { if (i < stepIndex) setStep(s.key as CheckoutStep); }}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`h-8.5 w-8.5 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
              i < stepIndex ? 'bg-indigo-500/20 text-cyan-400 border border-cyan-400/35' :
              i === stepIndex ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-white/20' :
              'bg-white/5 text-frost/30 border border-white/5'
            }`}>
              {i < stepIndex ? '✓' : s.num}
            </div>
            <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${i <= stepIndex ? 'text-frost' : 'text-frost/30'}`}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Receipt Page (Success Confirmation)
  if (step === 'receipt' && successOrder) {
    const chosenAddress = addresses[selectedAddressIndex] || fallbackAddress;
    const payLabel = { debit: 'Debit Card', credit: 'Credit Card', upi: 'UPI', cod: 'Cash on Delivery' }[paymentMethod];

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 select-none">
        <div className="glassmorphic p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-cyan-500/10 border-4 border-cyan-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <CheckCircle className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black font-display text-white tracking-wide">Orbit Finalized!</h2>
            <p className="text-frost/60 mt-2 text-sm">Thank you for deploying orders. The transaction has loaded successfully into escrow.</p>
          </div>

          <div className="bg-white/[0.01] rounded-2xl p-5 text-left space-y-4 border border-white/5 text-xs font-mono">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/5">
              <div>
                <p className="text-frost/40 uppercase text-[9px] font-bold tracking-widest mb-0.5">Order Coordinate ID</p>
                <p className="font-bold text-cyan-400">{successOrder.id}</p>
              </div>
              <div>
                <p className="text-frost/40 uppercase text-[9px] font-bold tracking-widest mb-0.5">Payment Node</p>
                <p className="font-bold text-white">{payLabel}</p>
              </div>
              <div>
                <p className="text-frost/40 uppercase text-[9px] font-bold tracking-widest mb-0.5">Escrow State</p>
                <p className={`font-bold ${paymentMethod === 'cod' ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {paymentMethod === 'cod' ? 'Quantum COD' : 'Verified Escrow ✓'}
                </p>
              </div>
              <div>
                <p className="text-frost/40 uppercase text-[9px] font-bold tracking-widest mb-0.5">Est. Arrival</p>
                <p className="font-bold text-white">3–5 Space Parsecs</p>
              </div>
            </div>

            <div>
              <p className="text-frost/40 uppercase text-[9px] font-bold tracking-widest mb-1">Delivering To</p>
              <p className="font-sans font-bold text-white">{chosenAddress.fullName}</p>
              <p className="text-frost/60">{chosenAddress.addressLine}, {chosenAddress.city ? `${chosenAddress.city}, ` : ''}{chosenAddress.district}, {chosenAddress.state} – {chosenAddress.pincode}</p>
            </div>

            <div className="flex justify-between items-center bg-black/45 p-3.5 rounded-xl border border-white/5 mt-2">
              <div>
                <p className="text-[9px] text-frost/45 uppercase font-bold tracking-widest">Total Transacted</p>
                <p className="text-xl font-extrabold text-cyan-405 font-mono">₹{(successOrder.totalAmount || grandTotal).toLocaleString('en-IN')}</p>
              </div>
              {successOrder.shippingQrCode && (
                <img src={successOrder.shippingQrCode} alt="tracking QR" className="h-16 w-16 border border-white/10 p-0.5 rounded-lg bg-white" />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setSuccessOrder(null); setStep('address'); onNavigateTo('home'); }}
              className="cursor-pointer flex-1 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-xl py-3 text-xs transition-colors"
            >
              Catalog Catalog
            </button>
            <button
              type="button"
              onClick={() => { setSuccessOrder(null); setStep('address'); onNavigateTo('dashboard'); }}
              className="cursor-pointer flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold rounded-xl py-3 text-xs shadow-md border border-white/10"
            >
              Track in Console
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      {cart.length === 0 ? (
        <div className="space-y-8">
          <div className="text-center py-20 glassmorphic rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto shadow-2xl">
            <ShoppingBag className="h-12 w-12 text-frost/25 mx-auto" />
            <div>
              <h3 className="font-extrabold font-display text-white text-lg">Your space-cart is empty</h3>
              <p className="text-xs text-frost/45 mt-1 font-mono uppercase tracking-wider">Deploy items from the catalogue display grids.</p>
            </div>
            <button type="button" onClick={() => onNavigateTo('shop')} className="cursor-pointer bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 border border-white/10 text-white font-bold py-2.5 px-6 text-xs rounded-xl shadow-lg">
              Browse Catalogue
            </button>
          </div>
        </div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Main Column */}
        <div className="lg:w-2/3 space-y-6">
          
          <StepIndicator />

          {/* STEP 1: Address Selection */}
          {step === 'address' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                  Delivery Coordinates
                </h2>
                {!showNewAddressForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className="cursor-pointer text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Address
                  </button>
                )}
              </div>

              {showNewAddressForm ? (
                <form onSubmit={handleSaveAddress} className="glassmorphic border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
                  <h3 className="font-bold font-display text-white text-sm">Add Delivery Coordinates</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-frost/40" />
                        <input required value={addrFullName} onChange={e => setAddrFullName(e.target.value)} placeholder="Full name"
                          className="w-full bg-black/35 pl-8 pr-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-frost/40" />
                        <input required value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="Phone number"
                          className="w-full bg-black/35 pl-8 pr-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {['Home', 'Work', 'Other'].map(l => (
                      <button key={l} type="button" onClick={() => setAddrLabel(l)}
                        className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          addrLabel === l 
                            ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                            : 'bg-white/5 text-frost/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {l === 'Home' && '🏠 '}{l === 'Work' && '🏢 '}{l === 'Other' && '📍 '}{l}
                      </button>
                    ))}
                  </div>

                  <MapPicker onLocationSelected={handleMapLocationSelected} />

                  <div>
                    <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">Address / Street *</label>
                    <textarea required rows={2} value={addrLine} onChange={e => setAddrLine(e.target.value)}
                      placeholder="House no., street name, area..."
                      className="w-full bg-black/35 px-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">City *</label>
                      <input required value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="City"
                        className="w-full bg-black/35 px-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">District *</label>
                      <input required value={addrDistrict} onChange={e => setAddrDistrict(e.target.value)} placeholder="District"
                        className="w-full bg-black/35 px-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">State *</label>
                      <input required value={addrState} onChange={e => setAddrState(e.target.value)} placeholder="State"
                        className="w-full bg-black/35 px-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">PIN Code *</label>
                      <input required value={addrPincode} onChange={e => setAddrPincode(e.target.value)} placeholder="600001"
                        className="w-full bg-black/35 px-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none font-mono text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">Contact Number</label>
                      <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="Contact Number"
                        className="w-full bg-black/35 px-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold font-mono text-frost/40 uppercase text-[9px] tracking-widest mb-1.5">Alt Contact Number</label>
                      <input value={altContactNumber} onChange={e => setAltContactNumber(e.target.value)} placeholder="Alt Contact Number"
                        className="w-full bg-black/35 px-3 py-2 border border-white/10 focus:border-cyan-500/50 rounded-xl text-frost placeholder-frost/30 outline-none text-xs" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowNewAddressForm(false)}
                      className="cursor-pointer px-5 py-2.5 bg-white/5 text-frost/70 hover:text-white border border-white/10 rounded-xl text-xs">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading}
                      className="cursor-pointer flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 border border-white/15">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" /> : 'Save Coordinates'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedAddressIndex(index)}
                      className={`cursor-pointer p-4.5 bg-white/[0.01] border rounded-2xl transition-all shadow-md space-y-2.5 hover:border-white/20 ${
                        selectedAddressIndex === index ? 'border-cyan-500 ring-2 ring-cyan-500/10 bg-indigo-500/[0.02]' : 'border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedAddressIndex === index ? 'border-cyan-400 bg-cyan-400/20' : 'border-white/20'}`}>
                            {selectedAddressIndex === index && <div className="h-2.5 w-2.5 rounded-full bg-cyan-400" />}
                          </div>
                          <span className="font-extrabold text-xs text-white">{addr.label || 'Home'}</span>
                          <span className="text-[9px] bg-white/5 border border-white/5 text-frost/60 font-mono px-1.5 py-0.5 rounded font-bold">{addr.fullName || addr.label}</span>
                        </div>
                        {selectedAddressIndex === index && (
                          <span className="text-[9px] font-bold text-cyan-400 bg-cyan-400/10 px-2.5 py-0.5 rounded-full border border-cyan-400/20 tracking-wider">DEFAULT</span>
                        )}
                      </div>
                      <p className="text-xs text-frost/70 pl-7.5">{addr.addressLine}</p>
                      <p className="text-[10px] text-frost/45 font-mono pl-7.5">{addr.city ? `${addr.city}, ` : ''}{addr.district}, {addr.state} – {addr.pincode}</p>
                      {addr.phone && <p className="text-[10px] text-frost/45 pl-7.5">📞 {addr.phone}</p>}
                    </div>
                  ))}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => onNavigateTo('shop')} className="cursor-pointer px-5 py-3 bg-white/5 border border-white/10 text-frost/80 hover:text-white rounded-xl text-xs">
                      ← Catalog catalogue
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('coupon')}
                      className="cursor-pointer flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 border border-white/15 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md shadow-indigo-500/10"
                    >
                      Continue to Offers <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Coupons & Offers */}
          {step === 'coupon' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
                <Ticket className="h-5 w-5 text-cyan-400" />
                Available Space Coupons
              </h2>
              
              <div className="glassmorphic p-5 rounded-2xl border border-white/10 shadow-lg space-y-4">
                <p className="text-xs text-frost/60">Apply coordinates-coupons matching category tags to process discount allowances.</p>
                
                {loadingCoupons ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-2" />
                    <span className="text-xs text-frost/45 font-bold tracking-wider font-mono">Searching quantum database...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const applicableCoupons = availableCoupons.filter(c => 
                        cart.some(item => item.category === c.categorySlug)
                      );

                      if (applicableCoupons.length === 0) {
                        return (
                          <div className="text-center py-10 bg-white/[0.01] border border-dashed border-white/10 rounded-xl">
                            <Tag className="h-8 w-8 mx-auto text-frost/20 mb-2.5" />
                            <p className="text-xs font-bold text-frost/50 font-mono">No applicable coupons inside sector</p>
                          </div>
                        );
                      }

                      return applicableCoupons.map((c: any) => {
                        const isApplied = appliedCoupon?.id === c.id;
                        return (
                          <div key={c.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isApplied ? 'bg-cyan-500/10 border-cyan-400/30' : 'bg-white/[0.01] border-white/10 hover:border-cyan-500/30 shadow-xs'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${isApplied ? 'bg-cyan-500/20 text-cyan-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                                {isApplied ? <CheckCircle className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-white capitalize">{c.title}</h4>
                                  <p className="text-xs text-frost/55 font-medium">Save {c.discountAmount}% on matching {c.categorySlug} items.</p>
                              </div>
                            </div>
                            
                            {isApplied ? (
                              <button type="button" onClick={() => setAppliedCoupon(null)} className="cursor-pointer px-4 py-2 bg-black border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold rounded-lg text-xs transition-colors">
                                Remove
                              </button>
                            ) : (
                              <button type="button" onClick={() => setAppliedCoupon(c)} className="cursor-pointer px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold rounded-lg text-xs transition-colors border border-white/10 shadow-md">
                                Apply
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('address')} className="cursor-pointer px-5 py-3 bg-white/5 border border-white/10 text-frost/85 hover:text-white rounded-xl text-xs">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('invoice')}
                  className="cursor-pointer flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 border border-white/15 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md"
                >
                  Review Order <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Invoice Preview with slide exit animations */}
          {step === 'invoice' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-400" />
                Order Invoice Preview
              </h2>

              <div className="glassmorphic border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
                {/* Invoice header */}
                <div className="flex justify-between items-start pb-4 border-b border-white/10">
                  <div>
                    <h3 className="font-extrabold text-lg text-white font-display">OmniBazaar</h3>
                    <p className="text-[10px] text-frost/45 font-mono uppercase tracking-widest">Invoice Node Preview</p>
                  </div>
                  <div className="text-right text-[10px] text-frost/40 font-mono">
                    <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
                    <p>INV-{Date.now().toString().slice(-6)}</p>
                  </div>
                </div>

                {/* Ship to */}
                {(() => {
                  const addr = addresses[selectedAddressIndex] || fallbackAddress;
                  return (
                    <div className="pb-4 border-b border-white/10 text-xs">
                      <p className="text-[9px] font-bold text-frost/40 uppercase tracking-widest mb-2 font-mono">Ship To coordinates</p>
                      <p className="font-bold text-white text-sm">{addr.fullName}</p>
                      <p className="text-frost/70 mt-1">{addr.addressLine}</p>
                      <p className="text-frost/50 font-mono mt-0.5">{addr.city ? `${addr.city}, ` : ''}{addr.district}, {addr.state} – {addr.pincode}</p>
                      {addr.phone && <p className="text-frost/50 font-mono mt-1">📞 {addr.phone}</p>}
                    </div>
                  );
                })()}

                {/* Items table - AnimatePresence exit slide */}
                <div>
                  <p className="text-[9px] font-bold text-frost/40 uppercase tracking-widest mb-3 font-mono">Quantum Items list</p>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.div 
                          layout
                          key={item.id}
                          initial={{ opacity: 0, x: -15, scale: 0.98 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -50, scale: 0.9, transition: { duration: 0.25 } }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                          className="flex items-center gap-4 bg-white/[0.01] border border-white/5 p-3 rounded-xl hover:border-white/10 transition-colors"
                        >
                          <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover border border-white/5 bg-black" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[9px] text-cyan-405 font-mono">₹{item.price.toLocaleString('en-IN')}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-white/5 text-frost/70 font-bold transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-[10px] font-bold font-mono text-white">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                className="cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-white/5 text-frost/70 font-bold transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs font-extrabold text-white w-18 text-right font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                            <button type="button" onClick={() => removeFromCart(item.id)} className="cursor-pointer text-frost/30 hover:text-red-400 transition-colors p-1">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between text-frost/60">
                    <span>Subtotal Allowance</span>
                    <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {finalDiscount > 0 && (
                    <div className="flex justify-between text-cyan-400 font-bold">
                      <span>Discount Reduction ({appliedCoupon?.title})</span>
                      <span>-₹{finalDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white border-t border-white/10 pt-3 mt-3">
                    <span>Grand Settlement Total</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 font-extrabold">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('coupon')} className="cursor-pointer px-5 py-3 bg-white/5 border border-white/10 text-frost/85 hover:text-white rounded-xl text-xs">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="cursor-pointer flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 border border-white/15 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md"
                >
                  Proceed to Payment <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                Select Payment Channel
              </h2>

              {/* Payment Method Cards */}
              <div className="grid grid-cols-2 gap-3.5 select-none">
                {[
                  { key: 'debit' as PaymentMethod, label: 'Debit Node', icon: '💳', desc: 'Secure debit payment' },
                  { key: 'credit' as PaymentMethod, label: 'Credit Node', icon: '💳', desc: 'Secure credit payment' },
                  { key: 'upi' as PaymentMethod, label: 'Quantum UPI', icon: '📱', desc: 'GPay, PhonePe, UPI ID' },
                  { key: 'cod' as PaymentMethod, label: 'Pay on Delivery', icon: '💵', desc: 'COD Zero-G payment' },
                ].map(pm => (
                  <button
                    type="button"
                    key={pm.key}
                    onClick={() => setPaymentMethod(pm.key)}
                    className={`cursor-pointer p-4 rounded-2xl border text-left transition-all ${
                      paymentMethod === pm.key
                        ? 'border-cyan-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                        : 'border-white/10 bg-white/[0.01] hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl mb-1.5">{pm.icon}</div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${paymentMethod === pm.key ? 'text-cyan-300' : 'text-white'}`}>{pm.label}</p>
                    <p className="text-[9px] text-frost/40 font-mono mt-1">{pm.desc}</p>
                  </button>
                ))}
              </div>

              {/* Debit / Credit Card Form */}
              {(paymentMethod === 'debit' || paymentMethod === 'credit') && (
                <div className="glassmorphic border border-white/10 rounded-2xl p-5 space-y-5 shadow-xl">
                  {/* Premium Credit Card Visualization */}
                  <div className="max-w-xs h-44 mx-auto bg-gradient-to-br from-indigo-950 via-purple-900 to-cyan-950 border border-white/15 rounded-2xl p-5 text-white flex flex-col justify-between relative overflow-hidden font-mono shadow-[0_15px_30px_rgba(0,0,0,0.8)] select-none">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl animate-pulse" />
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold font-mono uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded border border-white/20">
                        {paymentMethod === 'debit' ? 'DEBIT' : 'CREDIT'}
                      </span>
                      <span className="text-lg font-black italic tracking-widest text-cyan-300">QUANTUM</span>
                    </div>
                    <div className="text-center text-sm sm:text-base tracking-widest font-bold text-white/90">
                      {cardNumber ? cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') : '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end text-[9px]">
                      <div>
                        <p className="text-[7px] uppercase text-white/40 tracking-widest">CARDHOLDER</p>
                        <p className="font-bold truncate max-w-[140px] uppercase text-frost">{cardName || 'YOUR NAME'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] uppercase text-white/40 tracking-widest">EXPIRES</p>
                        <p className="font-bold text-frost">{cardExpiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs font-semibold">
                    <div>
                      <label className="block font-bold font-mono text-frost/45 uppercase text-[9px] tracking-widest mb-1.5">Card Number *</label>
                      <input
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 outline-none text-frost placeholder-frost/30 font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="block font-bold font-mono text-frost/45 uppercase text-[9px] tracking-widest mb-1.5">Name on Card *</label>
                      <input
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        placeholder="Cardholder Name"
                        className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 outline-none text-frost placeholder-frost/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold font-mono text-frost/45 uppercase text-[9px] tracking-widest mb-1.5">Expiry Date *</label>
                        <input
                          value={cardExpiry}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                            setCardExpiry(v);
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 outline-none text-frost placeholder-frost/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold font-mono text-frost/45 uppercase text-[9px] tracking-widest mb-1.5">CVV *</label>
                        <input
                          type="password"
                          value={cardCVV}
                          onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          placeholder="•••"
                          maxLength={3}
                          className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 outline-none text-frost placeholder-frost/30 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Form */}
              {paymentMethod === 'upi' && (
                <div className="glassmorphic border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div>
                    <label className="block font-bold font-mono text-frost/45 uppercase text-[9px] tracking-widest mb-1.5">UPI ID *</label>
                    <input
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 outline-none text-frost placeholder-frost/30 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* COD */}
              {paymentMethod === 'cod' && (
                <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-2xl p-6 flex items-start gap-5 shadow-md transition-all select-none">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Banknote className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="text-xs space-y-1.5">
                    <p className="font-extrabold font-display text-white text-base tracking-wide uppercase">Cash on Delivery</p>
                    <p className="text-frost/70 leading-relaxed text-sm">
                      You will pay <span className="font-extrabold font-mono text-cyan-400 bg-cyan-450/10 px-2 py-0.5 rounded border border-cyan-400/20">₹{grandTotal.toLocaleString('en-IN')}</span> in cash when cargo capsules land.
                    </p>
                    <div className="flex gap-4 pt-2.5 border-t border-white/5 mt-2">
                      <p className="text-frost/50 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 text-cyan-400" /> No pre-transactions
                      </p>
                      <p className="text-frost/50 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 text-cyan-400" /> Secure handshakes
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('invoice')} className="cursor-pointer px-5 py-3 bg-white/5 border border-white/10 text-frost/85 hover:text-white rounded-xl text-xs">
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={loading || paymentProcessing || cart.length === 0 || !isPaymentValid()}
                  onClick={handleCreateOrder}
                  className="cursor-pointer flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2.5 text-xs shadow-md border border-white/10 uppercase tracking-widest font-display active:scale-95 transition-all disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {paymentMethod === 'cod' ? '📦 Place Order (Pay on Delivery)' : `✓ Pay ₹${grandTotal.toLocaleString('en-IN')}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary column - Sticky GlassCard with aurora total */}
        <div className="lg:w-1/3 space-y-4 font-sans text-xs">
          <div className="glassmorphic p-6 rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] space-y-5 sticky top-24">
            <h4 className="font-extrabold font-display text-white text-sm tracking-wide uppercase select-none pb-2 border-b border-white/5">Order Summary</h4>

            {/* Item thumbnails */}
            {cart.length > 0 && (
              <div className="space-y-3.5 pb-4 border-b border-white/10 select-none">
                {cart.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="h-9 w-9 rounded-lg object-cover border border-white/5 bg-black" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-white">{item.name}</p>
                      <p className="text-[9px] text-frost/45 font-mono">Qty {item.quantity}</p>
                    </div>
                    <p className="text-xs font-extrabold text-frost font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
                {cart.length > 3 && <p className="text-[9px] text-frost/45 font-mono text-center">+{cart.length - 3} more items</p>}
              </div>
            )}

            <div className="space-y-2 font-mono border-b border-white/10 pb-4 text-frost/60">
              <div className="flex justify-between">
                <span>Subtotal</span><span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantum Shipping</span><span>FREE</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-white text-base items-baseline">
              <span>Grand Total</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 font-extrabold font-mono text-xl tracking-wider select-none">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-2 text-frost/40 text-[9px] font-mono leading-relaxed">
              <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>256-bit SSL secured parsec checkout. Encrypted node protection.</span>
            </div>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
