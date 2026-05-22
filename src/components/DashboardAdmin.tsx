import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Check, 
  X, 
  ShieldAlert, 
  Plus, 
  Layers, 
  Award, 
  Users, 
  Database, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Home, 
  Settings, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Building,
  Activity,
  ArrowUpRight,
  Shield,
  Menu,
  FileText,
  QrCode,
  Truck,
  History,
  UserPlus,
  Loader2
} from 'lucide-react';

interface DashboardAdminProps {
  onNavigateTo?: (page: string) => void;
}

export default function DashboardAdmin({ onNavigateTo }: DashboardAdminProps) {
  const { token, logout, user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'console' | 'approvals' | 'categories' | 'admins' | 'diagnostics' | 'logistics'>('console');
  
  // Mobile sidebar visibility
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Users data (Management table)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Audits data
  const [vendorRequests, setVendorRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [auditRemarks, setAuditRemarks] = useState('');
  const [decisionHistory, setDecisionHistory] = useState<any[]>([]);
  
  // Categories / Brands tabs inside the console
  const [activeTaxonomyTab, setActiveTaxonomyTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  
  // Admin creations
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [commissionSuccess, setCommissionSuccess] = useState('');

  // Logistics states
  const [shipments, setShipments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [shipmentLogs, setShipmentLogs] = useState<any[]>([]);
  const [loadingLogistics, setLoadingLogistics] = useState(false);

  const [staffName, setStaffName] = useState('');
  const [staffCustomId, setStaffCustomId] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffVehicleType, setStaffVehicleType] = useState('');
  const [staffVehiclePlate, setStaffVehiclePlate] = useState('');
  
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [newVehicleTypeName, setNewVehicleTypeName] = useState('');

  // Schema diagnostics
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Toast System
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (title: string, desc: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5500);
  };

  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    error: string | null;
    supabaseUrl: string;
    lastSync: string | null;
    sqlInstructions: string;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
    fetchCategoriesBrands();
    fetchDiagnostics();
    fetchSupabaseStatus();
    fetchLogisticsData();
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Analytics fetch error:', e);
    }
  };

  const fetchLogisticsData = async () => {
    setLoadingLogistics(true);
    try {
      const resShip = await fetch('/api/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resShip.ok) {
        const d = await resShip.json();
        setShipments(d.shipments || []);
      }
      const resStaff = await fetch('/api/delivery/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resStaff.ok) {
        const d = await resStaff.json();
        setStaffList(d.delivery_staff || []);
      }
      const resLogs = await fetch('/api/shipments/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resLogs.ok) {
        const d = await resLogs.json();
        setShipmentLogs(d.logs || []);
      }
      const resVehicles = await fetch('/api/admin/vehicle-types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resVehicles.ok) {
        const d = await resVehicles.json();
        setVehicleTypes(d.vehicle_types || []);
        if (d.vehicle_types && d.vehicle_types.length > 0 && !staffVehicleType) {
          setStaffVehicleType(d.vehicle_types[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogistics(false);
    }
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPhone || !staffPassword) {
      addToast('Input Error', 'Please populate all registration particulars.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/delivery/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: staffCustomId,
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          password: staffPassword,
          vehicleType: staffVehicleType,
          vehiclePlate: staffVehiclePlate
        })
      });
      if (res.ok) {
        addToast('Agent Enrolled', `Courier node "${staffName}" has been authenticated onto cluster.`, 'success');
        setStaffName('');
        setStaffCustomId('');
        setStaffEmail('');
        setStaffPhone('');
        setStaffPassword('');
        setStaffVehiclePlate('');
        fetchLogisticsData();
        fetchUsers();
      } else {
        const d = await res.json();
        addToast('Registration Conflict', d.error || 'Check registration formats.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStaffApproval = async (staffId: string, currentApproval: boolean) => {
    try {
      const res = await fetch(`/api/delivery/staff/${staffId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: !currentApproval })
      });
      if (res.ok) {
        addToast('Approval State Changed', !currentApproval ? 'Delivery partner email is now APPROVED to log in!' : 'Delivery partner email login access REVOKED.', 'info');
        fetchLogisticsData();
        fetchUsers();
      } else {
        const d = await res.json();
        addToast('Action Failed', d.error || 'Unable to update approval status.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network Error', 'Logistics system timeout.', 'error');
    }
  };

  const handleDeleteCourier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this courier?')) return;
    try {
      const res = await fetch(`/api/delivery/staff/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Courier Deleted', 'The courier has been removed from the fleet.', 'success');
        fetchLogisticsData();
        fetchUsers();
      } else {
        addToast('Action Failed', 'Could not delete courier.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network Error', 'Logistics system timeout.', 'error');
    }
  };

  const handleAddVehicleType = async () => {
    if (!newVehicleTypeName.trim()) return;
    try {
      const res = await fetch('/api/admin/vehicle-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newVehicleTypeName.trim() })
      });
      if (res.ok) {
        addToast('Vehicle Type Added', `Added ${newVehicleTypeName} to the registry.`, 'success');
        setNewVehicleTypeName('');
        fetchLogisticsData();
      } else {
        addToast('Action Failed', 'Could not add vehicle type.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVehicleType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle type?')) return;
    try {
      const res = await fetch(`/api/admin/vehicle-types/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Vehicle Type Deleted', 'Removed vehicle type from registry.', 'success');
        fetchLogisticsData();
      } else {
        addToast('Action Failed', 'Could not delete vehicle type.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignCourier = async (shipmentId: string, staffId: string) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_staff_id: staffId })
      });
      if (res.ok) {
        addToast('Assignment Bound', `Parcel ${shipmentId} dispatched to agent queue successfully.`, 'success');
        fetchLogisticsData();
      } else {
        addToast('Assignment Blocked', 'Error updating shipment status on DB.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
      addToast('Platform Fetch Interruption', 'Could not query platform user database.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateAuthorityLevel = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        addToast('Authority Escalated', 'User membership permissions updated on-the-fly.', 'success');
        fetchUsers();
        fetchDiagnostics();
      } else {
        const err = await res.json();
        addToast('Escalation Refused', err.error || 'Check server validation restrictions.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network Request Error', 'Updating user authority level failed.', 'error');
    }
  };

  const toggleUserSuspension = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        addToast(
          data.isSuspended ? 'Account Suspended' : 'Account Reinstated',
          data.isSuspended ? 'Security barrier active for selected credentials.' : 'Full access privileges re-commissioned.',
          data.isSuspended ? 'error' : 'success'
        );
        fetchUsers();
      } else {
        const err = await res.json();
        addToast('Command Blocked', err.error || 'Auditor permissions insufficient.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/admin/supabase-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/vendor-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendorRequests(data.requests || []);
        
        // Populate decision logs (approved/rejected history tags)
        const historyLogs = (data.requests || []).filter((req: any) => req.status !== 'pending');
        setDecisionHistory(historyLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategoriesBrands = async () => {
    try {
      const resCat = await fetch('/api/categories');
      if (resCat.ok) {
        const data = await resCat.json();
        setCategories(data.categories || []);
      }
      const resBrand = await fetch('/api/brands');
      if (resBrand.ok) {
        const data = await resBrand.json();
        setBrands(data.brands || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/admin/schema-diagnostics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuditRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/vendor-requests/${id}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, remarks: auditRemarks })
      });
      if (res.ok) {
        // Trigger the beautiful dual notification scheme seen in the video!
        if (status === 'approved') {
          addToast(
            'Vendor Onboarded Successfully',
            `Merchant store "${selectedRequest.storeName}" has been APPROVED. Custom business schema is now active in cloud logs.`,
            'success'
          );
          setTimeout(() => {
            addToast(
              'Automated Alert Dispatched',
              `Verification message successfully broadcasted to vendor email and WhatsApp (${selectedRequest.businessPhone || '9988776655'}).`,
              'info'
            );
          }, 1200);
        } else {
          addToast(
            'Application Rejected',
            `Corporate file of "${selectedRequest.storeName}" has been set to rejected state with audit notes.`,
            'error'
          );
        }

        setAuditRemarks('');
        setSelectedRequest(null);
        fetchRequests();
        fetchDiagnostics();
      }
    } catch (e) {
      console.error(e);
      addToast('Audit Sync Fail', 'Could not apply verdict state on server DB.', 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName })
      });
      if (res.ok) {
        setNewCatName('');
        addToast('Taxonomy Created', `Product category "${newCatName}" has been propagated globally.`, 'success');
        fetchCategoriesBrands();
        fetchDiagnostics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBrandName })
      });
      if (res.ok) {
        setNewBrandName('');
        addToast('Brand Catalog Registered', `Product brand "${newBrandName}" has been appended.`, 'success');
        fetchCategoriesBrands();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        addToast('Category Removed', `Taxonomy category "${name}" was deleted successfully.`, 'success');
        fetchCategoriesBrands();
        fetchDiagnostics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBrand = async (brandId: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        addToast('Brand Unregistered', `Brand label "${name}" was removed from the system.`, 'success');
        fetchCategoriesBrands();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommissionAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommissionSuccess('');
    try {
      const res = await fetch('/api/admin/commission-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail,
          phone: newAdminPhone,
          password: newAdminPassword
        })
      });
      if (res.ok) {
        setCommissionSuccess(`Admin privileges commissioned to ${newAdminName}`);
        addToast('Operator Created', `Privileged administrator node "${newAdminName}" is now active.`, 'success');
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        setNewAdminPassword('');
        fetchUsers();
        fetchDiagnostics();
      } else {
        const err = await res.json();
        setCommissionSuccess(`Error: ${err.error || 'Submission check failed'}`);
        addToast('Commission Refused', err.error || 'Verify inputs.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Safe totals calculations
  const totalSalesFromLogs = diagnostics?.schemasList?.reduce((accum: number, schema: string) => {
    const schVal = diagnostics.schemasRaw[schema];
    return accum + (schVal?.analytics?.totalRevenue || 0);
  }, 0) || 0;

  const totalStores = diagnostics?.schemasList?.length || 8;
  const pendingApprovalsCount = vendorRequests.filter(req => req.status === 'pending').length;

  const totalVendors = usersList.filter(u => u.role === 'vendor').length;
  const totalConsumers = usersList.filter(u => u.role === 'customer').length;
  const totalDelivery = usersList.filter(u => u.role === 'delivery').length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Toast popup window overlay queue */}
      <div className="fixed top-6 right-6 z-250 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl shadow-xl border flex gap-3 pointer-events-auto transition-all duration-300 animate-slide-in ${
              t.type === 'success' 
                ? 'bg-slate-900 border-emerald-500/20 text-emerald-100' 
                : t.type === 'error' 
                  ? 'bg-slate-900 border-red-500/20 text-red-100' 
                  : 'bg-slate-900 border-blue-500/20 text-blue-100'
            }`}
          >
            <div className="mt-0.5">
              {t.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
              {t.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-400" />}
              {t.type === 'info' && <Clock className="h-4 w-4 text-blue-400" />}
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs text-white">{t.title}</h5>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-normal">{t.desc}</p>
            </div>
            <button type="button" 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-white place-self-start text-[10px]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar left view pane (Responsive Fixed) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transform transition-transform duration-350 ease-in-out border-r border-slate-800 lg:translate-x-0 lg:static lg:h-full ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand container */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            <span>Ω</span>
          </div>
          <div>
            <h1 className="font-extrabold font-display text-sm tracking-wide text-white">OmniBazaar</h1>
            <p className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase font-semibold">Administrator</p>
          </div>
        </div>

        {/* Dashboard Navigation Menu options */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Storefront Link - Returns to standard shopping homepage */}
          <button type="button"
            onClick={() => {
              if (onNavigateTo) onNavigateTo('home');
              setMobileSidebarOpen(false);
            }}
            className="flex items-center w-full px-4 py-3 text-xs font-semibold rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all gap-3"
          >
            <Home className="h-4 w-4 text-slate-400 group-hover:text-white" />
            <span>Storefront Portal</span>
          </button>

          <div className="h-px bg-slate-800 my-4"></div>

          {/* Console Menu Option */}
          <button type="button"
            onClick={() => {
              setActiveTab('console');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 text-xs font-semibold rounded-lg transition-all gap-3 ${
              activeTab === 'console' 
                ? 'bg-indigo-600 text-white shadow-md font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Management Console</span>
          </button>

          {/* Approvals Menu Option */}
          <button type="button"
            onClick={() => {
              setActiveTab('approvals');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 text-xs font-semibold rounded-lg transition-all justify-between ${
              activeTab === 'approvals' 
                ? 'bg-indigo-600 text-white shadow-md font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              <span>Pending Approvals</span>
            </span>
            {pendingApprovalsCount > 0 && (
              <span className="bg-amber-500 text-slate-900 text-[10px] font-mono tracking-tighter px-2 py-0.5 rounded-full font-bold">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Categories & Brands Module option */}
          <button type="button"
            onClick={() => {
              setActiveTab('categories');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 text-xs font-semibold rounded-lg transition-all gap-3 ${
              activeTab === 'categories' 
                ? 'bg-indigo-600 text-white shadow-md font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Categories & Brands</span>
          </button>

          {/* Credentials creation node module option */}
          <button type="button"
            onClick={() => {
              setActiveTab('admins');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 text-xs font-semibold rounded-lg transition-all gap-3 ${
              activeTab === 'admins' 
                ? 'bg-indigo-600 text-white shadow-md font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Deploy Administrators</span>
          </button>

          {/* Scheme diagnostics options */}
          <button type="button"
            onClick={() => {
              setActiveTab('diagnostics');
              setMobileSidebarOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 text-xs font-semibold rounded-lg transition-all gap-3 ${
              activeTab === 'diagnostics' 
                ? 'bg-indigo-600 text-white shadow-md font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>System Diagnostics</span>
          </button>

          {/* Logistics & Shipments control option */}
          <button type="button"
            onClick={() => {
              setActiveTab('logistics');
              setMobileSidebarOpen(false);
              fetchLogisticsData();
            }}
            className={`flex items-center w-full px-4 py-3 text-xs font-semibold rounded-lg transition-all gap-3 ${
              activeTab === 'logistics' 
                ? 'bg-indigo-600 text-white shadow-md font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Logistics & Shipments</span>
          </button>
        </nav>

        {/* User Card at base */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 font-extrabold text-xs text-indigo-400 flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Paul Joel admin'}</h4>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button type="button"
            onClick={logout}
            className="cursor-pointer w-full text-[11px] font-bold text-slate-400 hover:text-red-400 hover:bg-slate-800/50 py-2 rounded-lg border border-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Terminal</span>
          </button>
        </div>
      </aside>

      {/* Main workspace container view */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top header navigation spacer (Mobile button) */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 z-10 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1 text-gray-500 hover:text-slate-850 bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold font-display text-gray-800 tracking-tight">
              {activeTab === 'console' && 'Platform Control Center'}
              {activeTab === 'approvals' && 'Vendor Shop Onboarding'}
              {activeTab === 'categories' && 'Category & Brand Console'}
              {activeTab === 'admins' && 'Administrative Deployment'}
              {activeTab === 'diagnostics' && 'System Diagnostics & Snapshots'}
              {activeTab === 'logistics' && 'Logistics Fleet & QR Tracking'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 tracking-wider font-extrabold px-2.5 py-1 rounded-full border border-emerald-150-10 flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              CLUSTER_NODE_ONLINE
            </span>
          </div>
        </header>

        {/* Content canvas container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/70">
          
          {/* TAB 1: CONSOLE */}
          {activeTab === 'console' && (
            <div className="space-y-8 animate-fade-in">
              {/* Welcome Alert banner exact styling */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 z-10">
                  <span className="text-[9px] uppercase font-mono tracking-widest font-extrabold text-blue-400 bg-blue-500/15 py-0.5 px-2 rounded-md border border-blue-500/10 inline-block mb-1 border-indigo-500/10">
                    Active System Session
                  </span>
                  <h3 className="text-xl font-bold font-display tracking-tight text-white leading-tight">
                    Welcome, Administrator {user?.name || 'paul Joel admin'}
                  </h3>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed max-w-xl">
                    Review global performance metrics, approve pending seller workspace onboarding requests, update dynamic taxonomies, and manage user roles under direct secure DB terminal guidelines.
                  </p>
                </div>
                {pendingApprovalsCount > 0 && (
                  <button type="button"
                    onClick={() => setActiveTab('approvals')}
                    className="cursor-pointer font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 border border-amber-400 py-3 px-5 rounded-xl transition-all shadow-md shrink-0 active:scale-95 flex items-center gap-2"
                  >
                    <span>PENDING APPROVALS ({pendingApprovalsCount})</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dynamic Metric Cards Grid list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Total Consumers */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Total Consumers</span>
                    <h4 className="text-2xl font-extrabold font-display text-gray-800 mt-1">
                      {loadingUsers ? '...' : `${totalConsumers}`}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      Registered Shoppers
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                {/* Total Vendors */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Total Vendors</span>
                    <h4 className="text-2xl font-extrabold font-display text-gray-800 mt-1">
                      {loadingUsers ? '...' : `${totalVendors}`}
                    </h4>
                    <p className="text-[10px] text-indigo-600 font-mono font-bold mt-1">
                      Platform Merchants
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Building className="h-5 w-5" />
                  </div>
                </div>

                {/* Total Delivery Partners */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Delivery Partners</span>
                    <h4 className="text-2xl font-extrabold font-display text-gray-800 mt-1">
                      {loadingUsers ? '...' : `${totalDelivery}`}
                    </h4>
                    <p className="text-[10px] text-orange-600 font-mono font-bold mt-1">
                      Logistics Fleet
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>

              </div>

              {/* Analytics Chart Block */}
              {analytics && analytics.salesByDay && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Trend Line Chart */}
                  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-sm font-bold font-display text-gray-800 uppercase tracking-wider">
                          Revenue Trend (Last 7 Days)
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Platform-wide aggregate sales performance.</p>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.salesByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                          />
                          <Line type="monotone" dataKey="amount" name="Revenue" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Products Bar Chart */}
                  {analytics.topProducts && analytics.topProducts.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="text-sm font-bold font-display text-gray-800 uppercase tracking-wider">
                            Top Performing Products
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">Highest sales volume across all merchants.</p>
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.topProducts} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => val.substring(0, 10) + '...'} />
                            <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="sales" name="Units Sold" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Central Table Block: Users accounts role & status */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-gray-150-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold font-display text-gray-800 uppercase tracking-wider">
                      Global Platform Accounts & Role Management
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Re-assign authorized roles, and suspend/reactivate client and merchant network profiles immediately.
                    </p>
                  </div>
                  <button type="button"
                    onClick={fetchUsers}
                    className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-850 px-3 py-1.5 rounded-lg border bg-slate-50 border-gray-200"
                  >
                    Refresh Table Logs
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {loadingUsers ? (
                    <div className="p-12 text-center text-xs font-mono text-gray-500">
                      Querying cluster nodes list...
                    </div>
                  ) : usersList.length === 0 ? (
                    <div className="p-12 text-center text-xs font-mono text-gray-500">
                      No platform account tables initiated.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs align-middle">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b">
                        <tr>
                          <th className="py-4 px-6">Member Details</th>
                          <th className="py-4 px-6">Authority Level</th>
                          <th className="py-4 px-6">Account Status</th>
                          <th className="py-4 px-6 text-right">Interactive Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150-10">
                        {usersList.map(uItem => (
                          <tr key={uItem.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Member Details */}
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-slate-700 text-xs border border-gray-200">
                                  {uItem.name ? uItem.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                  <h5 className="font-bold text-gray-800 text-xs sm:text-sm">{uItem.name}</h5>
                                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 select-all">{uItem.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Authority Level Dropdown */}
                            <td className="py-4.5 px-6">
                              <select
                                value={uItem.role}
                                onChange={(e) => updateAuthorityLevel(uItem.id, e.target.value)}
                                className="bg-gray-50 border border-gray-200 p-2 text-[11px] rounded-lg font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500/50 cursor-pointer min-w-36"
                              >
                                <option value="customer">Customer Member</option>
                                <option value="vendor">Vendor Merchant</option>
                                <option value="delivery">Platform Operator</option>
                                <option value="admin">Platform Administrator</option>
                              </select>
                            </td>

                            {/* Status badge */}
                            <td className="py-4.5 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full inline-block font-mono font-extrabold text-[9px] uppercase border ${
                                uItem.isSuspended 
                                  ? 'bg-red-50 text-red-700 border-red-150' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                              }`}>
                                {uItem.isSuspended ? '⚠️ SUSPENDED' : '● ACTIVE ACCOUNT'}
                              </span>
                            </td>

                            {/* Suspension Actions */}
                            <td className="py-4.5 px-6 text-right">
                              {uItem.id === user?.id ? (
                                <span className="text-[10px] text-gray-400 font-semibold italic px-3 py-1 bg-slate-100 border rounded-lg whitespace-nowrap inline-block">
                                  Your Current Node
                                </span>
                              ) : (
                                <button type="button"
                                  onClick={() => toggleUserSuspension(uItem.id)}
                                  className={`cursor-pointer text-[10px] font-bold py-1.5 px-3 rounded-lg border transition-all whitespace-nowrap inline-block ${
                                    uItem.isSuspended 
                                      ? 'bg-emerald-550 border-emerald-350 hover:bg-emerald-600 text-white' 
                                      : 'bg-red-50 border-red-150 text-red-700 hover:bg-red-100'
                                  }`}
                                >
                                  {uItem.isSuspended ? 'Reactivate Profile' : '❌ SUSPEND'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                
                {/* Section titles */}
                <div className="pb-4 border-b border-gray-150-10 mb-6">
                  <h4 className="text-sm font-bold font-display text-gray-800 uppercase tracking-wider">
                    Pending Approvals Queue
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Verify legal business entities, GST certificates, and activate secure seller tenancy dashboards.
                  </p>
                </div>

                {/* Grid layout list */}
                <div className="space-y-4">
                  {vendorRequests.filter(req => req.status === 'pending').length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-gray-500 italic">
                      No pending vendor applications in verification queue.
                    </div>
                  ) : (
                    vendorRequests.filter(req => req.status === 'pending').map((req) => (
                      <div key={req.id} className="p-5 bg-slate-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono font-extrabold tracking-widest bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 rounded-md uppercase">
                            Pending Onboarding Review
                          </span>
                          <h5 className="font-extrabold text-slate-850 text-sm">{req.storeName}</h5>
                          <p className="text-xs text-gray-600 font-semibold">{req.legalName}</p>
                          <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-xl">{req.description}</p>
                        </div>
                        <button type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setAuditRemarks('');
                          }}
                          className="cursor-pointer text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2 px-4 rounded-xl border border-indigo-150 transition-all shrink-0 active:scale-95"
                        >
                          Audit File
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Historic logs section table */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                <div className="pb-4 border-b border-gray-150-10 mb-6">
                  <h4 className="text-sm font-bold font-display text-gray-800 uppercase tracking-wider">
                    Historic Decision Logs
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Overview of previous onboarding applications.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  {decisionHistory.length === 0 ? (
                    <p className="text-center p-6 text-xs text-gray-500 font-mono italic">
                      No decisions stored historical log yet.
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs align-middle">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b">
                        <tr>
                          <th className="py-3 px-4">Store Name</th>
                          <th className="py-3 px-4">Applicant Name</th>
                          <th className="py-3 px-4">Submission Date</th>
                          <th className="py-3 px-4 text-right">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {decisionHistory.map((histItem) => (
                          <tr key={histItem.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-gray-800">{histItem.storeName}</td>
                            <td className="py-3.5 px-4 text-gray-600">{histItem.legalName || 'Unknown User'}</td>
                            <td className="py-3.5 px-4 text-gray-400 font-mono">{new Date(histItem.updatedAt).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full inline-block font-mono font-extrabold text-[9px] uppercase border ${
                                histItem.status === 'approved' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                                  : 'bg-red-50 text-red-700 border-red-150'
                              }`}>
                                {histItem.status === 'approved' ? '● ACTIVE VENDOR' : '⚠️ REJECTED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* AUDIT MODAL SHEET */}
              {selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-250 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-150 flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-150 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div>
                        <h4 className="font-extrabold font-display text-sm">Vendor Shop Onboarding</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedRequest.storeName}</p>
                      </div>
                      <button type="button" 
                        onClick={() => setSelectedRequest(null)} 
                        className="cursor-pointer p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Files details */}
                    <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
                      
                      {/* Legal profile */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block mb-2">Legal Company Profile</span>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          <div>
                            <p className="text-gray-400 font-semibold uppercase text-[9px]">Registered Name</p>
                            <p className="font-bold text-gray-800 mt-0.5">{selectedRequest.legalName}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-semibold uppercase text-[9px]">Registration No.</p>
                            <p className="font-bold text-gray-800 mt-0.5 font-mono">{selectedRequest.regNumber || 'Pending Filing'}</p>
                          </div>
                          <div className="col-span-2 border-t border-gray-200/50 pt-2.5">
                            <p className="text-gray-400 font-semibold uppercase text-[9px]">GSTIN</p>
                            <p className="font-extrabold text-indigo-700 mt-0.5 font-mono select-all text-xs tracking-wider">
                              {selectedRequest.gstNumber}
                            </p>
                          </div>
                          <div className="col-span-2 border-t border-gray-200/50 pt-2.5">
                            <p className="text-gray-400 font-semibold uppercase text-[9px]">Registered Address</p>
                            <p className="font-bold text-gray-850 mt-0.5">
                              {selectedRequest.address || 'District Center Bazaar, New Delhi'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Extra Details */}
                      {selectedRequest.additionalDetails && (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                          <span className="font-bold text-indigo-700 uppercase tracking-widest text-[9px] block mb-1">Extra Details</span>
                          <p className="text-indigo-900 text-xs leading-relaxed">{selectedRequest.additionalDetails}</p>
                        </div>
                      )}

                      {/* Certificate attachment */}
                      {selectedRequest.documentUrl && (
                        <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-gray-200">
                          <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Uploaded Document Attachment</span>
                          <div className="mt-2 flex items-center gap-3">
                            <FileText className="h-8 w-8 text-indigo-500" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Verification Document</p>
                              <a 
                                href={selectedRequest.documentUrl.includes('secure.documents') ? 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800&q=80' : selectedRequest.documentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[10px] text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                View Full Document <ArrowUpRight className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Remarks */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">Enter Auditing Verdict Remarks</label>
                        <textarea
                          rows={3}
                          value={auditRemarks}
                          onChange={e => setAuditRemarks(e.target.value)}
                          placeholder="e.g. Registered with verified taxation documents, active seller terminal synced."
                          className="w-full bg-slate-50 rounded-xl p-3 text-xs border border-gray-250 focus:border-indigo-500 outline-hidden hover:bg-white focus:bg-white transition-all text-gray-850 font-medium"
                        />
                      </div>

                    </div>

                    {/* Bottom controls */}
                    <div className="p-4 border-t border-gray-150 bg-slate-50 flex gap-3 shrink-0">
                      <button type="button"
                        onClick={() => handleAuditRequest(selectedRequest.id, 'rejected')}
                        className="cursor-pointer flex-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-150 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <X className="h-4 w-4" />
                        Reject Application
                      </button>
                      
                      <button type="button"
                        onClick={() => handleAuditRequest(selectedRequest.id, 'approved')}
                        className="cursor-pointer flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
                      >
                        <Check className="h-4 w-4 text-white" />
                        Approve & Activate Store
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CATEGORIES & BRANDS */}
          {activeTab === 'categories' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                
                {/* Taxonomy header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-150-10 mb-6">
                  <div>
                    <h4 className="text-sm font-bold font-display text-gray-800 uppercase tracking-wider">
                      Category & Brand Console
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Manage dynamic product classifiers and brands catalog allowed in global marketplace listings.
                    </p>
                  </div>
                  
                  {/* Internal tabs selector */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border">
                    <button type="button"
                      onClick={() => setActiveTaxonomyTab('categories')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        activeTaxonomyTab === 'categories' 
                          ? 'bg-white text-slate-800 shadow-sm' 
                          : 'text-gray-500 hover:text-slate-700'
                      }`}
                    >
                      Product Categories ({categories.length})
                    </button>
                    <button type="button"
                      onClick={() => setActiveTaxonomyTab('brands')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        activeTaxonomyTab === 'brands' 
                          ? 'bg-white text-slate-800 shadow-sm' 
                          : 'text-gray-500 hover:text-slate-700'
                      }`}
                    >
                      Merchant Brands ({brands.length})
                    </button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  
                  {/* Left Side: Creation Panel Card */}
                  <div className="lg:w-1/2 bg-slate-50 p-6 rounded-2xl border border-gray-200">
                    {activeTaxonomyTab === 'categories' ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-150">Create Category</span>
                          <h5 className="font-extrabold text-slate-850 text-sm mt-1.5">Launch New Category Taxonomy</h5>
                          <p className="text-gray-500 text-[11px] leading-relaxed">
                            Add a new global taxonomy category so vendors can register brand products under approved labels.
                          </p>
                        </div>

                        <form onSubmit={handleAddCategory} className="space-y-3.5 pt-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category Label</label>
                            <input
                              type="text"
                              required
                              value={newCatName}
                              onChange={e => setNewCatName(e.target.value)}
                              placeholder="e.g. Sports Equipment"
                              className="w-full bg-white px-3.5 py-2.5 text-xs rounded-xl border border-gray-250 focus:border-indigo-500 outline-hidden hover:bg-white/80 transition-all font-semibold"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                          >
                            <Plus className="h-4 w-4 text-white" />
                            <span>Add Category</span>
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-150">Register Brand</span>
                          <h5 className="font-extrabold text-slate-850 text-sm mt-1.5">Register Global Brand Group</h5>
                          <p className="text-gray-500 text-[11px] leading-relaxed">
                            Define a registered brand label so manufacturers can tag models with proper authenticity tags.
                          </p>
                        </div>

                        <form onSubmit={handleAddBrand} className="space-y-3.5 pt-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Brand Name Label</label>
                            <input
                              type="text"
                              required
                              value={newBrandName}
                              onChange={e => setNewBrandName(e.target.value)}
                              placeholder="e.g. Adidas"
                              className="w-full bg-white px-3.5 py-2.5 text-xs rounded-xl border border-gray-250 focus:border-indigo-500 outline-hidden hover:bg-white/80 transition-all font-semibold"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                          >
                            <Plus className="h-4 w-4 text-white" />
                            <span>Register Brand</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Right Side: List Taxonomy with scrollbars */}
                  <div className="lg:w-1/2 space-y-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      {activeTaxonomyTab === 'categories' ? 'Available Categories Taxonomy' : 'Registered Brands Portfolio'}
                    </span>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border border-slate-100 rounded-xl p-3 bg-white">
                      {activeTaxonomyTab === 'categories' ? (
                        categories.length === 0 ? (
                          <div className="text-center p-8 text-xs text-gray-500 italic font-mono">No categories online.</div>
                        ) : (
                          categories.map(cat => (
                            <div key={cat.id} className="p-3.5 bg-slate-50 rounded-xl border border-gray-150 hover:border-indigo-500/25 transition-all text-xs font-bold text-slate-700 flex justify-between items-center group">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                <span>{cat.name}</span>
                                <span className="text-[9px] text-gray-400 font-mono font-normal">/{cat.slug}</span>
                              </div>
                              <button type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="cursor-pointer text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-all"
                                title="Delete category taxonomy row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )
                      ) : (
                        brands.length === 0 ? (
                          <div className="text-center p-8 text-xs text-gray-500 italic font-mono">No brands online.</div>
                        ) : (
                          brands.map(brand => (
                            <div key={brand.id} className="p-3.5 bg-slate-50 rounded-xl border border-gray-150 hover:border-indigo-500/25 transition-all text-xs font-bold text-slate-700 flex justify-between items-center group">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                <span>{brand.name}</span>
                                <span className="text-[9px] text-gray-400 font-mono font-normal">/{brand.slug}</span>
                              </div>
                              <button type="button"
                                onClick={() => handleDeleteBrand(brand.id, brand.name)}
                                className="cursor-pointer text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-all"
                                title="Delete registered brand catalog row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 4: DEPLOY ADMINS */}
          {activeTab === 'admins' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs max-w-xl">
                
                {/* Header */}
                <div className="pb-4 border-b border-gray-150-10 mb-6">
                  <h4 className="text-sm font-bold font-display text-gray-800 uppercase tracking-wider">
                    Commission New Administrator
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Deploy secure administrative nodes with complete auditing capabilities. Administrative parameters bypass multi-tenant validation boundaries.
                  </p>
                </div>

                {commissionSuccess && (
                  <div className="mb-4 p-3.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/55 text-xs font-mono font-bold text-center">
                    {commissionSuccess}
                  </div>
                )}

                <form onSubmit={handleCommissionAdmin} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Auditor Name</label>
                      <input
                        type="text"
                        required
                        value={newAdminName}
                        onChange={e => setNewAdminName(e.target.value)}
                        placeholder="e.g. Charlie Admin"
                        className="w-full bg-slate-50 p-2.5 rounded-xl text-xs border border-gray-250 focus:border-indigo-500 outline-hidden hover:bg-slate-100/50 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Corporate Email</label>
                      <input
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={e => setNewAdminEmail(e.target.value)}
                        placeholder="e.g. admin@omnibazaar.in"
                        className="w-full bg-slate-50 p-2.5 rounded-xl text-xs border border-gray-250 focus:border-indigo-500 outline-hidden hover:bg-slate-100/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dedicated Phone</label>
                      <input
                        type="tel"
                        required
                        value={newAdminPhone}
                        onChange={e => setNewAdminPhone(e.target.value)}
                        placeholder="e.g. +91 9988776655"
                        className="w-full bg-slate-50 p-2.5 rounded-xl text-xs border border-gray-250 focus:border-indigo-500 outline-hidden hover:bg-slate-100/50 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Secret Key / Password</label>
                      <input
                        type="password"
                        required
                        value={newAdminPassword}
                        onChange={e => setNewAdminPassword(e.target.value)}
                        placeholder="•••••••••"
                        className="w-full bg-slate-50 p-2.5 rounded-xl text-xs border border-gray-250 focus:border-indigo-500 outline-hidden hover:bg-slate-100/50 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Shield className="h-4 w-4 text-white" />
                    <span>Confirm Administrative Deployment</span>
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM DIAGNOSTICS & SYNC */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Database and sync state container */}
              {supabaseStatus && (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 text-white shadow-xl">
                  
                  {/* Title card header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <h4 className="text-sm font-extrabold font-display uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${supabaseStatus.connected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${supabaseStatus.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        Supabase State Synchronization Node
                      </h4>
                      <p className="text-slate-400 font-mono text-[10px] mt-1 break-all select-all">
                        Target API Endpoint: {supabaseStatus.supabaseUrl}
                      </p>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-md text-[9px] uppercase font-mono tracking-widest font-extrabold border ${
                      supabaseStatus.connected ? 'bg-emerald-500/15 border-emerald-500/10 text-emerald-400' : 'bg-red-500/15 border-red-500/10 text-red-400'
                    }`}>
                      {supabaseStatus.connected ? 'Cloud Synced' : 'Action Required'}
                    </span>
                  </div>

                  {supabaseStatus.connected ? (
                    <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                      <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" />
                        Replication checkpoint active. Every transition is saved automatically.
                      </p>
                      <p className="text-slate-400">
                        Multi-tenant products catalog, seller request pipelines, diagnostic audits, and customer geolocations are persistently mirrored. Data will survive standard node sandboxing.
                      </p>
                      {supabaseStatus.lastSync && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          Last Successful Sync Check: {new Date(supabaseStatus.lastSync).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div className="bg-red-500/10 border border-red-500/10 p-4 rounded-xl text-red-200 space-y-1">
                        <h5 className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          Table 'omnibazaar_state' Could Not Be Located
                        </h5>
                        <p className="leading-relaxed">
                          Your schema storage system connected successfully but could not query the core repository table. Paste the script below into your Supabase SQL Editor to initialize full replication.
                        </p>
                        {supabaseStatus.error && (
                          <pre className="p-2.5 bg-slate-950/70 border border-red-500/10 rounded-lg text-red-400 font-mono text-[10px] max-h-24 overflow-y-auto break-all mt-2 select-all leading-normal">
                            Postgres error: {supabaseStatus.error}
                          </pre>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-bold text-slate-400 uppercase tracking-widest">Postgres Initialization Script</span>
                          <button type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(supabaseStatus.sqlInstructions);
                              addToast('Script Copied', 'SQL initialization command saved to clipboard!', 'info');
                            }}
                            className="cursor-pointer bg-indigo-600 text-white hover:bg-indigo-750 font-bold px-3 py-1 rounded-md shadow-xs transition-all active:scale-95"
                          >
                            Copy SQL Snippet
                          </button>
                        </div>
                        <pre className="p-3 bg-slate-950 font-mono text-[10px] text-slate-300 rounded-xl overflow-x-auto max-h-36 leading-normal select-all">
                          {supabaseStatus.sqlInstructions}
                        </pre>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Dynamic schema configurations */}
              {diagnostics ? (
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
                    <div className="p-4 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 uppercase font-mono tracking-widest text-[9px] block">Registrations</span>
                      <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{diagnostics.usersCount}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 uppercase font-mono tracking-widest text-[9px] block">Sellers online</span>
                      <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{diagnostics.schemasList.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 uppercase font-mono tracking-widest text-[9px] block">Products list</span>
                      <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{diagnostics.publicProductsCount}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border rounded-xl">
                      <span className="text-slate-400 uppercase font-mono tracking-widest text-[9px] block">Seller Audits</span>
                      <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{diagnostics.vendorRequestsCount}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Instantiated Dynamic Tenancy Schemes
                    </span>
                    <div className="space-y-3">
                      {diagnostics.schemasList.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No dynamic seller workspace schematics online.</p>
                      ) : (
                        diagnostics.schemasList.map((schemaName: string) => {
                          const schData = diagnostics.schemasRaw[schemaName];
                          return (
                            <div key={schemaName} className="p-4 bg-slate-900 border text-slate-300 rounded-2xl font-mono flex flex-col justify-between overflow-hidden gap-3 shadow-md">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                <span className="font-bold text-white text-xs">{schemaName}</span>
                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase font-semibold">Active Tenant</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-[10px] leading-relaxed">
                                <div>
                                  <p className="text-slate-500 font-medium">Replicated Stocks</p>
                                  <p className="font-extrabold text-white mt-0.5 text-xs">{schData.products?.length || 0} items</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 font-medium">Dynamic Revenue</p>
                                  <p className="font-extrabold text-white mt-0.5 text-xs">₹{schData.analytics?.totalRevenue || 0}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 font-medium">Fulfillment Link</p>
                                  <p className="font-extrabold text-white mt-0.5 text-xs truncate">{schData.settings?.shipmentPartner || 'Ekart Logistics'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-xs text-gray-400 font-mono">Loading diagnostics matrix...</div>
              )}

            </div>
          )}

          {/* TAB 6: GLOBAL LOGISTICS & SHIPMENTS */}
          {activeTab === 'logistics' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Fleet Registration & Info Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Enroll New Courier form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                  <div className="border-b pb-3">
                    <h4 className="text-xs font-black font-mono text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4" />
                      Enroll Carrier Courier
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1">Initialize authentication and vehicle tenancy metrics.</p>
                  </div>

                  <form onSubmit={handleRegisterStaff} className="space-y-4 text-xs font-medium text-gray-700">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Full Name</label>
                      <input
                        type="text"
                        required
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-white px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 animate-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Custom Partner ID (Optional)</label>
                      <input
                        type="text"
                        value={staffCustomId}
                        onChange={(e) => setStaffCustomId(e.target.value)}
                        placeholder="e.g. delivery-partner-101 (or auto-generates)"
                        className="w-full bg-white px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Secure Email Address</label>
                      <input
                        type="email"
                        required
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="ramesh@omnibazaar.com"
                        className="w-full bg-white px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Contact Mobile / Phone</label>
                      <input
                        type="text"
                        required
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="+91 99887 76655"
                        className="w-full bg-white px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Access Password / PIN</label>
                      <input
                        type="password"
                        required
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Set agent login password"
                        className="w-full bg-white px-3 py-2 border rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Vehicle Type</label>
                        <input
                          type="text"
                          value={staffVehicleType}
                          onChange={(e) => setStaffVehicleType(e.target.value)}
                          placeholder="e.g. Motorcycle"
                          className="w-full bg-white px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">License Plate</label>
                        <input
                          type="text"
                          value={staffVehiclePlate}
                          onChange={(e) => setStaffVehiclePlate(e.target.value)}
                          placeholder="TN-37-AA-1234"
                          className="w-full bg-white px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 font-mono uppercase"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingLogistics}
                      className="cursor-pointer w-full bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-center shadow-xs transition-colors"
                    >
                      Enlist Operator To Active Fleet
                    </button>
                  </form>
                </div>

                {/* Fleet Courier Registry list */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black font-mono text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Truck className="h-4 w-4" />
                        Courier Delivery Fleet Matrix
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1">Overview of registered field logistic agents.</p>
                    </div>
                    <button type="button"
                      onClick={fetchLogisticsData}
                      className="cursor-pointer text-[10.5px] font-black border hover:bg-gray-50 rounded-lg px-2.5 py-1 text-gray-650"
                    >
                      Reload Matrices
                    </button>
                  </div>

                  {loadingLogistics && staffList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400 font-mono">Querying data nodes...</div>
                  ) : staffList.length === 0 ? (
                    <p className="py-12 text-center italic text-xs text-gray-400">No couriers enrolled inside active database nodes yet.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {staffList.map((ds) => {
                        const activeDeliveries = shipments.filter(s => s.delivery_staff_id === ds.id && s.shipment_status !== 'delivered').length;
                        return (
                          <div key={ds.id} className="p-4 bg-slate-50 border border-gray-205 rounded-xl flex gap-3 text-xs items-start">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-705 flex items-center justify-center shrink-0">
                              <Truck className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex-1 min-w-0 font-mono text-[11px] leading-relaxed">
                              <div className="flex items-start justify-between gap-1">
                                <h5 className="font-extrabold text-gray-800 font-sans text-xs truncate" title={ds.name}>{ds.name}</h5>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] bg-slate-200/60 px-1.5 py-0.5 rounded text-gray-600 font-mono select-all shrink-0 font-bold" title={`Partner ID: ${ds.id}`}>
                                    {ds.id}
                                  </span>
                                  <button type="button" onClick={() => handleDeleteCourier(ds.id)} className="cursor-pointer text-rose-400 hover:text-rose-600 p-0.5" title="Delete Courier">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-gray-500 text-[10px] mt-0.5 truncate select-all">{ds.email}</p>
                              <p className="text-slate-400">{ds.phone || ds.phone_number}</p>

                              <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                                <span className="text-[8.5px] font-black uppercase text-slate-400">LOGIN PASSWORD OK</span>
                                <span className="text-[8px] px-1.5 py-[1px] bg-indigo-50 text-indigo-700 border border-indigo-150 rounded font-bold uppercase">MASKED PIN</span>
                              </div>

                              <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                                <span className="text-[8.5px] font-black uppercase text-slate-400">EMAIL LOGIN STATUS</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffApproval(ds.id, ds.isApproved)}
                                  className={`cursor-pointer px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                                    ds.isApproved !== false
                                      ? 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100'
                                  }`}
                                  title="Click to toggle email permission status for login"
                                >
                                  {ds.isApproved !== false ? '● APPROVED' : '○ BLOCKED'}
                                </button>
                              </div>

                              <div className="mt-2 pt-2 border-t border-dashed border-gray-200 grid grid-cols-2 gap-1 text-[9px] uppercase font-bold text-gray-400">
                                <div>
                                  <span className="block text-gray-450 text-[8px]">VEHICLE</span>
                                  <span className="text-gray-700 truncate block">{ds.vehicle_type} ({ds.vehicle_plate || 'N/A'})</span>
                                </div>
                                <div className="text-right">
                                  <span className="block text-gray-450 text-[8px]">PENDING TASKS</span>
                                  <span className="text-indigo-650 font-black">{activeDeliveries} Waybills</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Waybills tracking state grid */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black font-mono text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      Active Dispatch Shipment Assignments
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1">Bind generated parcel waybills directly to registered field couriers.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {shipments.length === 0 ? (
                    <p className="py-12 text-center text-xs text-gray-400 italic">No packages ready or shipped mapping currently inside DB matrices.</p>
                  ) : (
                    <table className="w-full text-left text-[11px] align-middle">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b">
                        <tr>
                          <th className="py-3 px-4">Tracking Waybill</th>
                          <th className="py-3 px-4">Recipient Client</th>
                          <th className="py-3 px-4">Status Class</th>
                          <th className="py-3 px-4">Fleet Assignment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150-10 font-mono text-gray-650">
                        {shipments.map((shp) => {
                          return (
                            <tr key={shp.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-indigo-750 text-xs">{shp.id}</span>
                                  <p className="text-[9px] text-gray-400">Carrier: {shp.shipment_partner || 'OmniCarrier Express'}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-0.5 font-sans">
                                  <p className="font-bold text-gray-800">{shp.customer_name || 'Generic Client'}</p>
                                  <p className="text-gray-450 text-[10px] truncate max-w-[200px]">{shp.delivery_address?.addressLine || 'Coimbatore'}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 border rounded-full text-[9px] font-black uppercase font-mono tracking-wider ${
                                  shp.shipment_status === 'delivered' 
                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                                    : shp.shipment_status === 'out_for_delivery' 
                                      ? 'bg-amber-50 border-amber-250 text-amber-700' 
                                      : 'bg-indigo-50 border-indigo-250 text-indigo-705'
                                }`}>
                                  {shp.shipment_status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={shp.delivery_staff_id || ''}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAssignCourier(shp.id, e.target.value);
                                      }
                                    }}
                                    className="bg-white border text-[11px] p-2 rounded-xl outline-none focus:border-indigo-400 cursor-pointer text-gray-800 max-w-[190px]"
                                  >
                                    <option value="">-- Unassigned --</option>
                                    {staffList.map(st => (
                                      <option key={st.id} value={st.id}>{st.name} ({st.vehicle_type})</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Transit Event Telemetry Monitor */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black font-mono text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                      <History className="h-4 w-4 text-violet-400" />
                      Platform Transit Event Telemetry Logs
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">Live scan updates dispatched directly by merchants and courier agents.</p>
                  </div>
                </div>

                <div className="font-mono text-[10px] space-y-2 bg-slate-950 p-4 rounded-xl max-h-56 overflow-y-auto leading-normal text-slate-350">
                  {shipmentLogs.length === 0 ? (
                    <p className="italic text-slate-500">No logistical event stamps propagated inside the global ledger yet.</p>
                  ) : (
                    shipmentLogs.slice().reverse().map((log, index) => (
                      <div key={index} className="border-b border-slate-900/40 pb-2 flex justify-between gap-4 items-start select-all">
                        <div className="space-y-1.5 flex-1">
                          <p className="text-teal-400 font-bold">&#62; Waybill Ref: {log.shipment_id}</p>
                          <p className="text-slate-300">Status Update: <span className="uppercase text-yellow-500 font-bold">[{log.old_status}]</span> &#8594; <span className="uppercase text-emerald-400 font-bold">[{log.new_status}]</span></p>
                          {log.remarks && <p className="text-slate-400 leading-tight">Remarks: {log.remarks}</p>}
                        </div>
                        <div className="text-right shrink-0 text-slate-500">
                          <p>{new Date(log.timestamp).toLocaleString()}</p>
                          <p className="text-[9px] text-indigo-400">{log.location ? JSON.stringify(log.location) : 'Depot Hub'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
