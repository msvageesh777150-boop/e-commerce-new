import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Truck, 
  QrCode, 
  ClipboardList, 
  CheckCircle, 
  MapPin, 
  Loader2, 
  RefreshCw, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  Activity,
  X,
  Undo,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface DashboardDeliveryProps {
  onNavigateTo?: (page: string) => void;
}

export default function DashboardDelivery({ onNavigateTo }: DashboardDeliveryProps) {
  const { token, logout, user } = useAuth();
  const { t } = useLanguage();

  const [shipments, setShipments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'available' | 'completed'>('assigned');
  
  // Scanner state
  const [scannerMode, setScannerMode] = useState<'idle' | 'camera' | 'simulate'>('idle');
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  
  // Auto-scanning timer progress (0 to 100)
  const [autoScanProgress, setAutoScanProgress] = useState(0);
  const [actionNotif, setActionNotif] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  
  // Camera scanner state
  const [cameraScanError, setCameraScanError] = useState<string | null>(null);
  const [cameraScanSuccess, setCameraScanSuccess] = useState<string | null>(null);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState<Html5Qrcode | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [scanLocation, setScanLocation] = useState('Central Transit Hub (Coimbatore West Depot)');

  useEffect(() => {
    fetchShipmentsAndLogs();
    
    // Attempt to automatically gather geographic coordinates for logistics logging
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setScanLocation(`GPS Decimals: ${pos.coords.latitude.toFixed(4)}N, ${pos.coords.longitude.toFixed(4)}E`);
        },
        () => {
          // Geolocation rejected or failed
        }
      );
    }
  }, []);

  // Automatic scanning simulator timer loop
  useEffect(() => {
    let interval: any;
    if (scannerMode === 'simulate' && selectedShipment) {
      setAutoScanProgress(0);
      interval = setInterval(() => {
        setAutoScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Execute QR scanning payload automatically under the hood
            const payload = {
              orderId: selectedShipment.order_id,
              trackingNumber: selectedShipment.tracking_number,
              currentStatus: selectedShipment.shipment_status,
              timestamp: new Date().toISOString()
            };
            handleExecuteScanPayload(JSON.stringify(payload));
            return 100;
          }
          return prev + 10;
        });
      }, 120); // Takes 1.2s to fully finish the automated scan trigger
    } else {
      setAutoScanProgress(0);
    }
    return () => clearInterval(interval);
  }, [scannerMode, selectedShipment]);

  const fetchShipmentsAndLogs = async () => {
    setLoading(true);
    try {
      const resShip = await fetch('/api/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resShip.ok) {
        const data = await resShip.json();
        setShipments(data.shipments || []);
      }

      const resLogs = await fetch('/api/shipments/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error synchronizing manifest datasets:', e);
    } finally {
      setLoading(false);
    }
  };

  // Self claim a shipment
  const handleClaimShipment = async (shipmentId: string) => {
    setLoading(true);
    setActionNotif(null);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotif({
          message: `Parcel ${shipmentId} assigned to your profile! Dispatch and deliver safely.`,
          type: 'success'
        });
        fetchShipmentsAndLogs();
      } else {
        setActionNotif({
          message: `Claim denied: ${data.error || 'System error'}`,
          type: 'error'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Cancel / Release a shipment back to available list
  const handleCancelAssignment = async (shipmentId: string) => {
    setLoading(true);
    setActionNotif(null);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotif({
          message: `Delivery assignment for ${shipmentId} has been successfully canceled and returned to pool.`,
          type: 'info'
        });
        fetchShipmentsAndLogs();
      } else {
        setActionNotif({
          message: `Cancellation failed: ${data.error || 'System error'}`,
          type: 'error'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Deliver instantly without scanning (direct hand-over bypass)
  const handleInstantHandover = async (shipment: any) => {
    setLoading(true);
    setActionNotif(null);
    try {
      const payload = {
        orderId: shipment.order_id,
        trackingNumber: shipment.tracking_number,
        currentStatus: shipment.shipment_status,
        timestamp: new Date().toISOString()
      };
      const res = await fetch('/api/shipments/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrPayload: JSON.stringify(payload),
          scan_location: scanLocation + " (Manual Overpass Hand-over)"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotif({
          message: `Hand-over logged successfully! Package marked as Delivered directly in real-time.`,
          type: 'success'
        });
        fetchShipmentsAndLogs();
      } else {
        setActionNotif({
          message: `Hand-over authentication rejection: ${data.error || 'Check status constraints'}`,
          type: 'error'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger scanning action via scan API
  const handleExecuteScanPayload = async (qrPayloadStr: string) => {
    setLoading(true);
    setActionNotif(null);
    try {
      const res = await fetch('/api/shipments/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrPayload: qrPayloadStr,
          scan_location: scanLocation
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotif({
          message: `Scan successful! Package tracking status officially updated to: DELIVERED.`,
          type: 'success'
        });
        setScannerMode('idle');
        setSelectedShipment(null);
        fetchShipmentsAndLogs();
        stopCameraScanner();
        return true;
      } else {
        setActionNotif({
          message: `Scanning matrix rejection: ${data.error || 'State mismatch'}`,
          type: 'error'
        });
        setScannerMode('idle');
        setSelectedShipment(null);
        return false;
      }
    } catch (e) {
      setActionNotif({
        message: 'Logistics cloud timeout. Please retry.',
        type: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Start Html5 camera reader
  const startCameraScanner = async () => {
    setCameraScanError(null);
    setCameraScanSuccess(null);
    setScannerMode('camera');

    setTimeout(async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const qrInstance = new Html5Qrcode("reader-overlay-element");
          setHtml5QrCodeInstance(qrInstance);
          const cameraId = devices[0].id;
          setActiveCameraId(cameraId);

          await qrInstance.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 230, height: 230 }
            },
            async (decodedText) => {
              setCameraScanSuccess(`Read Matrix: "${decodedText.substring(0, 30)}..."`);
              const ok = await handleExecuteScanPayload(decodedText);
              if (ok) {
                qrInstance.stop();
              }
            },
            (errorMessage) => {
              // Non-blocking frame decode noise
            }
          );
        } else {
          setCameraScanError("No compatible video capture hardware detected on this machine.");
        }
      } catch (err: any) {
        console.error("Camera hook failed:", err);
        setCameraScanError(`Camera activation restricted. Details: ${err.message || err}`);
      }
    }, 200);
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeInstance && html5QrCodeInstance.isScanning) {
      try {
        await html5QrCodeInstance.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setScannerMode('idle');
  };

  const activeShipments = shipments.filter(s => s.delivery_staff_id === user?.id && s.shipment_status !== 'delivered');
  const availableShipments = shipments.filter(s => !s.delivery_staff_id);
  const completedShipments = shipments.filter(s => s.delivery_staff_id === user?.id && s.shipment_status === 'delivered');

  return (
    <div id="carrier-hub-single" className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Sleek Dedicated Courier Topbar Banner */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-950 text-white p-6 rounded-3xl shadow-lg mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest font-black bg-emerald-500/10 text-emerald-350 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
              Node Active
            </span>
            <span className="text-[10.5px] font-mono text-slate-400">Logistics Carrier Dashboard</span>
          </div>
          <h2 className="text-xl font-black font-sans tracking-tight text-white mt-1.5">
            {user?.name} · Dispatcher Desk
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Authorization: <span className="text-slate-200">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button type="button"
            onClick={logout}
            className="cursor-pointer text-xs font-bold bg-slate-850 hover:bg-red-950 hover:text-red-400 border border-slate-850 hover:border-red-900/40 py-3 px-4 rounded-2xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {actionNotif && (
        <div className="max-w-6xl mx-auto mb-6 p-4 animate-fade-in shadow-md rounded-2xl border flex justify-between items-center bg-slate-900 text-slate-200 border-slate-850 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full inline-block shrink-0 ${
              actionNotif.type === 'success' 
                ? 'bg-emerald-500 animate-pulse' 
                : actionNotif.type === 'error' 
                  ? 'bg-red-500' 
                  : 'bg-indigo-400'
            }`} />
            <span>{actionNotif.message}</span>
          </div>
          <button type="button" 
            onClick={() => setActionNotif(null)} 
            className="cursor-pointer text-[10px] text-gray-400 hover:text-white font-mono uppercase bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-gray-200 text-xs font-black tracking-wide gap-1 max-w-md">
          <button type="button" 
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-3 text-center rounded-xl transition-all cursor-pointer ${activeTab === 'assigned' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            My Queue ({activeShipments.length})
          </button>
          <button type="button" 
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 text-center rounded-xl transition-all cursor-pointer ${activeTab === 'available' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Available Shipments ({availableShipments.length})
          </button>
          <button type="button" 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 text-center rounded-xl transition-all cursor-pointer ${activeTab === 'completed' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Delivered ({completedShipments.length})
          </button>
        </div>

        {/* Display Panel List */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
          
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-650" />
              {activeTab === 'assigned' && 'Active Despatches Waybill List'}
              {activeTab === 'available' && 'Available Shared Courier Cargo Pool'}
              {activeTab === 'completed' && 'Delivered Historical Shipment Log ledger'}
            </h3>
            
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <MapPin className="h-3 w-3 text-indigo-500" />
              <span>Location: {scanLocation.substring(0, 31)}...</span>
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === 'assigned' && (
              <>
                {activeShipments.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-gray-250 text-slate-500 text-xs leading-relaxed max-w-lg mx-auto space-y-3">
                    <Truck className="h-10 w-10 text-indigo-305 mx-auto animate-bounce" />
                    <p className="font-extrabold text-slate-700 text-sm">Your delivery queue is currently empty.</p>
                    <p className="text-[11px] text-slate-450 italic">Switch to the "Available Shipments" tab above to claim packages waiting to be dispatched & delivered.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {activeShipments.map((s) => (
                      <div key={s.id} className="p-5 bg-slate-50/70 hover:bg-slate-50 transition-all border border-gray-200 rounded-3xl space-y-4 text-xs shadow-2xs flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-indigo-600 block">Waybill SKU</span>
                              <span className="font-mono text-sm font-black text-slate-805 bg-slate-200/70 p-1 px-2.5 rounded-lg">{s.tracking_number}</span>
                            </div>
                            <span className="py-1 px-3.5 rounded-full border border-amber-250 bg-amber-50 text-amber-700 text-[9px] font-black uppercase font-mono tracking-widest">
                              {s.shipment_status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pb-2 border-t border-dashed border-gray-200 pt-3">
                            <div>
                              <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">RECIPIENT CLIENT</p>
                              <p className="font-extrabold text-slate-800 font-sans mt-0.5">{s.customer_name}</p>
                              <p className="text-slate-500 font-mono text-[10px]">{s.customer_phone}</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">Merchant: {s.order?.vendorStoreName || 'Unified Bazaar Partner'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">GEO ADDRESS SEGMENT</p>
                              <p className="font-sans font-bold text-slate-700 leading-snug mt-0.5">{s.delivery_address?.addressLine}</p>
                              <p className="text-[10.5px] text-slate-450 font-mono mt-0.5">{s.delivery_address?.district}, PIN: {s.delivery_address?.pincode}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-gray-150 pt-4 mt-2">
                          <div className="flex gap-2">
                            <button type="button"
                              onClick={() => {
                                setSelectedShipment(s);
                                setScannerMode('simulate');
                              }}
                              className="cursor-pointer flex-1 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold py-3 px-3 rounded-2xl transition-all select-none flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10 text-[11px]"
                            >
                              <QrCode className="h-4 w-4 text-emerald-300" />
                              Scan QR to Deliver
                            </button>

                            <button type="button"
                              onClick={() => handleInstantHandover(s)}
                              disabled={loading}
                              className="cursor-pointer flex-none px-3 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-black rounded-2xl transition-all flex items-center justify-center"
                              title="Direct Instant Hand-over (Delivered)"
                            >
                              <Zap className="h-4.5 w-4.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${s.delivery_address?.latitude || 13.0827},${s.delivery_address?.longitude || 80.2707}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-white border hover:bg-slate-50 font-bold py-2 px-3 rounded-xl transition-all select-none flex items-center justify-center gap-1 text-[10px] text-slate-650"
                            >
                              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                              View Map Plot
                            </a>

                            <button type="button"
                              onClick={() => handleCancelAssignment(s.id)}
                              className="cursor-pointer bg-white border border-red-200 hover:bg-red-50 text-red-650 font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 text-[10px]"
                            >
                              <RotateCcw className="h-3.5 w-3.5 text-red-505" />
                              Cancel Assignment
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'available' && (
              <>
                {availableShipments.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed text-slate-500 text-xs">
                    <p className="font-bold text-slate-700">No waybills found in available pool.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Check back soon when merchants dispatch new orders.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {availableShipments.map((s) => (
                      <div key={s.id} className="p-5 bg-slate-50 border border-gray-200 rounded-3xl space-y-4 text-xs hover:border-gray-300 transition-colors flex flex-col justify-between shadow-2xs">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b pb-2.5">
                            <div>
                              <p className="font-mono text-indigo-750 font-bold">SKU Waybill: {s.tracking_number}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Dispatched from Store: {s.order?.vendorStoreName || 'Unified Partner'}</p>
                            </div>
                            <span className="uppercase text-[9px] font-black bg-gray-250 tracking-wider text-slate-700 p-1 px-2.5 border rounded-lg font-mono">
                              {s.shipment_status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-slate-650 leading-relaxed font-mono">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">CUSTOMER CLIENT</p>
                              <p className="font-sans font-extrabold text-slate-800 text-xs">{s.customer_name}</p>
                              <p className="text-slate-500 text-[10px]">{s.customer_phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">STREET SECTOR</p>
                              <p className="text-slate-700 font-sans text-xs">{s.delivery_address?.addressLine}</p>
                              <p className="text-[10px] text-slate-450">{s.delivery_address?.district}, {s.delivery_address?.state}</p>
                            </div>
                          </div>
                        </div>

                        <button type="button"
                          onClick={() => handleClaimShipment(s.id)}
                          disabled={loading}
                          className="cursor-pointer bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-3 px-4 w-full rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm mt-4 text-[11px]"
                        >
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                          Self-Claim and Add to My Queue
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'completed' && (
              <>
                {completedShipments.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed text-slate-400 text-xs italic">
                    <p className="font-bold">No historical deliveries found on file.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                    {completedShipments.map((s) => (
                      <div key={s.id} className="p-4 bg-slate-10 border border-gray-200 rounded-2xl space-y-2 text-xs flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-black text-slate-700">Ref: {s.tracking_number}</span>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-150 tracking-wider text-[9px] font-black py-0.5 px-2.5 rounded-full uppercase scale-90">
                              Delivered
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">Consignee recipient: <strong className="text-slate-705 font-bold font-sans">{s.customer_name}</strong> ({s.delivery_address?.addressLine})</p>
                          <p className="text-[10px] text-slate-400 italic">Logs: Delivered at {s.delivered_at ? new Date(s.delivered_at).toLocaleString() : 'N/A'}</p>
                        </div>
                        
                        <div className="h-10 w-10 text-emerald-500 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Global Facility Transit Trace Ledger logs */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-950 space-y-4 shadow-xl">
          <h4 className="text-xs text-indigo-400 font-extrabold uppercase font-mono tracking-widest flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
            Global Scan Facility and Waybill Action Logs
          </h4>

          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-[10px] text-slate-500 font-mono italic">No actions registered yet.</p>
            ) : (
              [...logs].reverse().slice(0, 15).map((log: any) => (
                <div key={log.id} className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5 text-[10.5px] font-mono leading-normal shadow-xs">
                  <div className="flex justify-between text-slate-450 border-b border-slate-900 pb-1 text-[9.5px]">
                    <span>Timestamp: {new Date(log.created_at || log.timestamp || Date.now()).toLocaleString()}</span>
                    <span className="text-teal-400 font-bold capitalize">[{log.scanned_role || 'System'}]</span>
                  </div>
                  
                  <p className="text-slate-200 font-sans text-[11px]">
                    Action owner: <strong className="text-white font-bold">{log.scanned_by}</strong> processed parcel waybill <strong className="text-indigo-400">{log.shipment_id || 'Global'}</strong>.
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                    <span>Transition: <del className="text-red-400 decoration-1">{log.old_status}</del></span>
                    <span>&rarr; <strong className="text-green-400 font-bold">{log.new_status}</strong></span>
                    <span className="text-slate-500 ml-auto flex items-center gap-1 text-[9.5px]">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {log.scan_location}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* NEW VIEW: Fullscreen Automated QR Scanner Overlay Modal */}
      {scannerMode !== 'idle' && selectedShipment && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-250 flex items-center justify-center p-4 animate-fade-in text-white font-sans">
          
          <div className="max-w-md w-full bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6 relative shadow-2xl">
            
            <button type="button" 
              onClick={() => {
                stopCameraScanner();
                setScannerMode('idle');
                setSelectedShipment(null);
              }}
              className="cursor-pointer absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-805 hover:bg-slate-700/60 transition-colors flex items-center justify-center border border-slate-800"
            >
              <X className="h-4 w-4 text-slate-300" />
            </button>

            {/* Title */}
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-black font-mono tracking-widest text-indigo-400 uppercase bg-indigo-950/50 border border-indigo-900/40 p-1 px-3 rounded-full">
                {scannerMode === 'simulate' ? 'AUTOMATED SCAN SIMULATOR' : 'LIVE DEVICE SENSOR ACTIVE'}
              </span>
              <h3 className="text-base font-black tracking-tight mt-2 text-white">
                Waybill Tracker: {selectedShipment.tracking_number}
              </h3>
              <p className="text-[11px] text-slate-400">
                To hand-over: Scan consignment matrix label correctly.
              </p>
            </div>

            {/* Scanning View Body */}
            {scannerMode === 'simulate' ? (
              <div className="space-y-6">
                
                {/* Visual Scanner HUD with sweep laser effect */}
                <div className="aspect-square bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-800 p-8 shadow-inner">
                  
                  {/* Glowing Laser Sweep line */}
                  <div className="absolute left-0 right-0 h-1 bg-red-500 shadow-md shadow-red-500/80 animate-bounce relative z-20" />
                  
                  {/* QR Image wrapper */}
                  <div className="relative group p-2 bg-white rounded-2xl shadow-xl shrink-0">
                    <img
                      src={selectedShipment.qr_code}
                      alt="Waybill QR code"
                      className="h-40 w-40 object-contain"
                    />
                  </div>

                  <div className="absolute bottom-3 left-0 right-0 text-center z-20">
                    <span className="text-[9px] font-mono font-bold tracking-widest bg-slate-900/90 text-teal-400 px-2.5 py-1 rounded-md border border-slate-800 uppercase">
                      Laser Active
                    </span>
                  </div>
                </div>

                {/* Simulated scanning speed loop indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 font-bold">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                      Scanning QR Code automatically...
                    </span>
                    <span>{autoScanProgress}%</span>
                  </div>
                  
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-100 rounded-full"
                      style={{ width: `${autoScanProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" 
                    onClick={startCameraScanner}
                    className="cursor-pointer flex-1 bg-slate-800 hover:bg-slate-750 text-slate-205 border border-slate-750 text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    Open Live Camera instead
                  </button>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Real-time Video frame */}
                <div className="aspect-square bg-slate-950 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800">
                  <div id="reader-overlay-element" className="w-full h-full" />
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="h-56 w-56 border-2 border-emerald-450 border-dashed rounded-xl animate-pulse" />
                  </div>
                </div>

                {cameraScanError && (
                  <p className="text-[11.5px] text-red-400 p-3 bg-red-950/20 border border-red-900/35 rounded-xl font-mono flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5" />
                    <span>{cameraScanError}</span>
                  </p>
                )}

                {cameraScanSuccess && (
                  <p className="text-[11.5px] text-emerald-400 p-3 bg-emerald-950/20 border border-emerald-905/35 rounded-xl font-mono">
                    {cameraScanSuccess}
                  </p>
                )}

                <button type="button" 
                  onClick={() => {
                    stopCameraScanner();
                    setScannerMode('simulate');
                  }}
                  className="cursor-pointer w-full bg-slate-800 hover:bg-slate-755 text-slate-200 border border-slate-750 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Return to Automatic Scan Simulator
                </button>

              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-[11px] font-mono leading-relaxed border border-slate-850/80 text-center text-slate-400">
              <span className="block text-[10px] text-slate-500 font-bold">DEVICE POSITION:</span>
              <p className="text-white font-sans">{scanLocation}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
