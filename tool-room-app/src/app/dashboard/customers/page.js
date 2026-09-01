'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  UserPlus, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Search,
  Edit2,
  Trash2,
  History,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';

export default function ViewCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editContactNo, setEditContactNo] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Customer Orders History Modal State
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Owner & Header state
  const [ownerInfo, setOwnerInfo] = useState({ name: 'Owner', avatar: '' });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchCustomers();
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // 1. Fetch Owner Info
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('owner_name, avatar_url')
        .eq('id', 1)
        .single();

      if (settingsData) {
        setOwnerInfo({
          name: settingsData.owner_name || 'Owner',
          avatar: settingsData.avatar_url || ''
        });
      }

      // 2. Fetch Active Customers & their Job Cards
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          job_cards ( id, status, gear_price, tc_amt, qty )
        `)
        .eq('is_active', true)
        .order('id', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setEditName(c.name || '');
    setEditContactNo(c.contact_no || '');
    setEditCity(c.city || '');
    setEditAddress(c.address || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: editName.trim(),
          contact_no: editContactNo.trim(),
          city: editCity.trim(),
          address: editAddress.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;
      alert('Customer profile updated successfully!');
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      alert('Error updating customer: ' + err.message);
    }
  };

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to delete "${customerName}"?`)) return;
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', customerId);

      if (error) throw error;
      setCustomers(customers.filter(c => c.id !== customerId));
      alert('Customer removed.');
    } catch (err) {
      alert('Error deleting customer: ' + err.message);
    }
  };

  const handleViewHistory = async (customer) => {
    setHistoryCustomer(customer);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .eq('customer_id', customer.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (err) {
      console.error('Error fetching customer history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.contact_no?.includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.id?.toString().includes(q)
    );
  });

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* 6-Item Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-8">
          <span className="text-xl font-black text-[#1a2b3c] tracking-wider">RA-XIS<span className="text-[#3db2a8]">.</span></span>
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <LayoutDashboard className="w-4 h-4 text-gray-400" />
            Dashboard
          </Link>
          <Link href="/dashboard/new-order" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <PlusCircle className="w-4 h-4 text-gray-400" />
            New Order
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            View Orders
          </Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <UserPlus className="w-4 h-4 text-gray-400" />
            New Customer
          </Link>
          <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <Users className="w-4 h-4 text-[#3db2a8]" />
            View Customers
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            Reports
          </Link>
        </nav>

        <div className="p-5 border-t border-white/40">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <span className="text-sm font-bold text-gray-500">Khakare Engineering Tool Room</span>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="w-10 h-10 bg-white/90 rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                {ownerInfo.avatar ? <img src={ownerInfo.avatar} alt="Profile" className="w-full h-full object-cover" /> : <span className="font-bold text-[#1a2b3c]">{ownerInfo.name.charAt(0)}</span>}
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#3db2a8]">Settings</Link>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#1a2b3c]">Customer Directory</h1>
              <p className="text-xs text-gray-500">Manage client profiles, contact numbers, and order histories</p>
            </div>
            <Link href="/dashboard/new-customer" className="px-5 py-2.5 bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md w-fit">
              <UserPlus className="w-4 h-4" />
              <span>+ New Customer</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/60 shadow-sm flex items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Name, Contact No, City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#3db2a8]"
              />
            </div>
            <span className="text-xs font-bold text-gray-500 hidden sm:inline">
              Total Active: {filteredCustomers.length}
            </span>
          </div>

          {/* Customer Cards Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-xs">Loading customer directory...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">No customer profiles found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(cust => (
                <div key={cust.id} className="bg-white/50 backdrop-blur-2xl p-5 rounded-3xl border border-white/60 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#1a2b3c] text-sm">{cust.name}</h3>
                        <span className="text-[10px] text-gray-400">ID #{cust.id}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full border border-teal-200">
                        {cust.job_cards?.length || 0} Orders
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600">
                      {cust.contact_no && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{cust.contact_no}</span>
                        </div>
                      )}
                      {cust.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{cust.city}</span>
                        </div>
                      )}
                      {cust.address && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleViewHistory(cust)}
                      className="text-xs font-bold text-[#3db2a8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Order History</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1.5 bg-white/80 hover:bg-white rounded-lg text-gray-600 hover:text-blue-600 shadow-xs transition cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                        className="p-1.5 bg-white/80 hover:bg-white rounded-lg text-gray-600 hover:text-red-600 shadow-xs transition cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Customer Modal */}
          {editingCustomer && (
            <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-[#1a2b3c] text-sm">Edit Customer Profile</h3>
                  <button type="button" onClick={() => setEditingCustomer(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-500 uppercase text-[10px]">Customer / Company Name *</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full border rounded-xl p-2.5 mt-1 font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-500 uppercase text-[10px]">Contact Number</label>
                      <input type="tel" value={editContactNo} onChange={(e) => setEditContactNo(e.target.value)} className="w-full border rounded-xl p-2.5 mt-1" />
                    </div>
                    <div>
                      <label className="font-bold text-gray-500 uppercase text-[10px]">City / Location</label>
                      <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full border rounded-xl p-2.5 mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-gray-500 uppercase text-[10px]">Factory / Shop Address</label>
                    <textarea rows="2" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full border rounded-xl p-2.5 mt-1 resize-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button type="button" onClick={() => setEditingCustomer(null)} className="px-5 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[#3db2a8] text-white rounded-xl text-xs font-bold shadow-md">Update Profile</button>
                </div>
              </form>
            </div>
          )}

          {/* Customer Order History Modal */}
          {historyCustomer && (
            <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-[#1a2b3c] text-sm">Order History: {historyCustomer.name}</h3>
                    <p className="text-[11px] text-gray-500">List of past job cards and gear fabrications</p>
                  </div>
                  <button onClick={() => setHistoryCustomer(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {loadingHistory ? (
                    <p className="text-center py-8 text-gray-400 text-xs">Loading history...</p>
                  ) : customerOrders.length === 0 ? (
                    <p className="text-center py-8 text-gray-400 text-xs">No past orders recorded for this customer.</p>
                  ) : (
                    customerOrders.map(order => (
                      <div key={order.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#3db2a8]">Job #{order.id}</span>
                            <span className="text-gray-400 text-[10px]">{order.order_date || '—'}</span>
                          </div>
                          <p className="font-bold text-gray-800 mt-0.5">{order.model || 'Standard Gear'} - {order.qty || 1} Pcs</p>
                          <p className="text-[10px] text-gray-500">OD: {order.od || '—'} | NT: {order.nt || '—'} | Thk: {order.thickness || '—'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{order.status}</span>
                          <span className="block font-black text-gray-900 mt-1">{order.gear_price ? `₹${Number(order.gear_price).toLocaleString('en-IN')}` : '—'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <Link
                    href="/dashboard/new-order"
                    className="text-xs font-bold text-[#3db2a8] hover:underline"
                  >
                    + Create New Order for {historyCustomer.name}
                  </Link>
                  <button onClick={() => setHistoryCustomer(null)} className="px-5 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">Close</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}