'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { uploadFileToBucket, deleteFileFromBucket } from '@/lib/storage';
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
  Printer,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  X,
  UploadCloud
} from 'lucide-react';

export default function ViewOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals State
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedTagOrder, setSelectedTagOrder] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Owner & Header state
  const [ownerInfo, setOwnerInfo] = useState({ name: 'Owner', avatar: '' });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
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

      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          customers ( id, name, contact_no, city, address )
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('job_cards')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (viewingOrder?.id === orderId) {
        setViewingOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Complete Order Deletion with Media Bucket Cleanup
  const handleDeleteOrder = async (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    if (!confirm(`Are you sure you want to delete Order #${orderId} and all associated images from storage?`)) return;

    try {
      // 1. Physically delete attached media from bucket
      const allFiles = [...(targetOrder.photos || []), ...(targetOrder.drawings || [])];
      for (const fileUrl of allFiles) {
        await deleteFileFromBucket(fileUrl);
      }

      // 2. Delete database record
      const { error } = await supabase
        .from('job_cards')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.filter(o => o.id !== orderId));
      if (viewingOrder?.id === orderId) setViewingOrder(null);
      alert('Order and associated media deleted successfully from database & storage.');
    } catch (err) {
      alert('Error deleting order: ' + err.message);
    }
  };

  // Single Media File Deletion (Physical + Database Array)
  const handleDeleteMedia = async (orderId, mediaType, urlToDelete) => {
    if (!confirm('Are you sure you want to permanently delete this file from storage?')) return;
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) return;

      // 1. Physically delete from Supabase storage bucket
      await deleteFileFromBucket(urlToDelete);

      // 2. Update PostgreSQL array
      const updatedList = (targetOrder[mediaType] || []).filter(url => url !== urlToDelete);

      const { error } = await supabase
        .from('job_cards')
        .update({ [mediaType]: updatedList, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o => o.id === orderId ? { ...o, [mediaType]: updatedList } : o));
      if (viewingOrder?.id === orderId) {
        setViewingOrder(prev => ({ ...prev, [mediaType]: updatedList }));
      }
      alert('File permanently removed from storage bucket!');
    } catch (err) {
      alert('Error deleting file: ' + err.message);
    }
  };

  // Quick Upload Media inside Modal
  const handleQuickUpload = async (e, mediaType) => {
    const files = Array.from(e.target.files);
    if (!files.length || !viewingOrder) return;

    try {
      setUploadingMedia(true);
      const newUrls = [];
      for (const file of files) {
        const url = await uploadFileToBucket(file, mediaType);
        if (url) newUrls.push(url);
      }

      const updatedList = [...(viewingOrder[mediaType] || []), ...newUrls];

      const { error } = await supabase
        .from('job_cards')
        .update({ [mediaType]: updatedList, updated_at: new Date().toISOString() })
        .eq('id', viewingOrder.id);

      if (error) throw error;

      setOrders(orders.map(o => o.id === viewingOrder.id ? { ...o, [mediaType]: updatedList } : o));
      setViewingOrder(prev => ({ ...prev, [mediaType]: updatedList }));
      alert('New files uploaded successfully!');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('job_cards')
        .update({
          model: editingOrder.model,
          qty: editingOrder.qty ? parseInt(editingOrder.qty) : null,
          od: editingOrder.od,
          nt: editingOrder.nt,
          angle: editingOrder.angle,
          root: editingOrder.root,
          thickness: editingOrder.thickness,
          length: editingOrder.length,
          bore_keyway: editingOrder.bore_keyway,
          material_grade: editingOrder.material_grade,
          hardness: editingOrder.hardness,
          gear_price: parseFloat(editingOrder.gear_price) || 0,
          tc_amt: parseFloat(editingOrder.tc_amt) || 0,
          remarks: editingOrder.remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOrder.id);

      if (error) throw error;
      alert('Order updated successfully!');
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      alert('Error saving order: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const custName = o.customers?.name || '';
    const q = searchTerm.toLowerCase();
    return matchesStatus && (custName.toLowerCase().includes(q) || o.id.toString().includes(q) || o.model?.toLowerCase().includes(q));
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In-Production': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Delivered': return 'bg-purple-50 text-purple-600 border border-purple-200';
      default: return 'bg-amber-50 text-amber-600 border border-amber-200';
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* Sidebar */}
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
          <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <ClipboardList className="w-4 h-4 text-[#3db2a8]" />
            View Orders
          </Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <UserPlus className="w-4 h-4 text-gray-400" />
            New Customer
          </Link>
          <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <Users className="w-4 h-4 text-gray-400" />
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
              <h1 className="text-2xl font-black text-[#1a2b3c]">All Orders & Job Cards</h1>
              <p className="text-xs text-gray-500">Click any Order ID or Customer Name to view full technical specifications & images</p>
            </div>
            <Link href="/dashboard/new-order" className="px-5 py-2.5 bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md w-fit">
              <PlusCircle className="w-4 h-4" />
              <span>+ New Order</span>
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/60 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, Model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#3db2a8]"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {['All', 'Pending', 'In-Production', 'Completed', 'Delivered'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === status 
                      ? 'bg-[#1a2b3c] text-white' 
                      : 'bg-white/60 text-gray-600 hover:bg-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-bold text-gray-400 bg-white/30 border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Model & Qty</th>
                    <th className="py-3.5 px-4">Technical Specs</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Price</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-400">Loading orders...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-400">No job cards found.</td></tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="font-black text-[#3db2a8] hover:underline flex items-center gap-1 text-left cursor-pointer"
                          >
                            <span>#{order.id}</span>
                            <Eye className="w-3 h-3 opacity-60" />
                          </button>
                          <span className="block text-[10px] text-gray-400">{order.order_date || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="font-bold text-[#1a2b3c] hover:text-[#3db2a8] text-left block cursor-pointer"
                          >
                            {order.customers?.name || 'Customer Deleted'}
                          </button>
                          <span className="text-[10px] text-gray-500">{order.customers?.contact_no || order.customers?.city || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-800">{order.model || 'Standard Gear'}</span>
                          <span className="block text-[10px] text-teal-700 font-bold">{order.qty || 1} Pcs</span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-gray-600">
                          <div>OD: {order.od || '—'} | NT: {order.nt || '—'}</div>
                          <div>Thk: {order.thickness || '—'} | Len: {order.length || '—'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold focus:outline-none cursor-pointer ${getStatusBadge(order.status)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In-Production">In-Production</option>
                            <option value="Completed">Completed</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-black text-gray-900 block">{order.gear_price ? `₹${Number(order.gear_price).toLocaleString('en-IN')}` : '—'}</span>
                          {order.tc_amt > 0 && <span className="text-[10px] text-gray-500">TC: ₹{Number(order.tc_amt).toLocaleString('en-IN')}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button title="View Full Details" onClick={() => setViewingOrder(order)} className="p-1.5 bg-white/60 hover:bg-white rounded-lg text-gray-600 hover:text-[#3db2a8] transition cursor-pointer">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button title="Print Workshop Tag" onClick={() => setSelectedTagOrder(order)} className="p-1.5 bg-white/60 hover:bg-white rounded-lg text-gray-600 hover:text-[#3db2a8] transition cursor-pointer">
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button title="Edit Order" onClick={() => setEditingOrder({ ...order })} className="p-1.5 bg-white/60 hover:bg-white rounded-lg text-gray-600 hover:text-blue-600 transition cursor-pointer">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button title="Delete Order" onClick={() => handleDeleteOrder(order.id)} className="p-1.5 bg-white/60 hover:bg-white rounded-lg text-gray-600 hover:text-red-600 transition cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 1. FULL ORDER DETAILS & ENHANCED MEDIA MODAL */}
          {viewingOrder && (
            <div className="fixed inset-0 bg-[#1a2b3c]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 relative">
                <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-[#1a2b3c]">Job Card #{viewingOrder.id}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(viewingOrder.status)}`}>
                        {viewingOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Order Date: {viewingOrder.order_date || '—'}</p>
                  </div>
                  <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Customer Info Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Customer Name</span>
                    <span className="font-bold text-[#1a2b3c]">{viewingOrder.customers?.name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Contact Number</span>
                    <span className="font-semibold text-gray-700">{viewingOrder.customers?.contact_no || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">City / Address</span>
                    <span className="text-gray-700">{viewingOrder.customers?.city || viewingOrder.customers?.address || '—'}</span>
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">TECHNICAL SPECIFICATIONS</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Model</span>
                      <span className="font-bold text-gray-800">{viewingOrder.model || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Quantity</span>
                      <span className="font-bold text-[#3db2a8]">{viewingOrder.qty || 1} Pcs</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">OD (Outer Dia)</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.od || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">NT (No. of Teeth)</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.nt || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Angle</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.angle || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Root</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.root || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Thickness</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.thickness || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Length</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.length || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Bore / Keyway</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.bore_keyway || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Material Grade</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.material_grade || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Hardness</span>
                      <span className="font-semibold text-gray-800">{viewingOrder.hardness || '—'}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Gear Price / TC</span>
                      <span className="font-black text-gray-900">₹{viewingOrder.gear_price || 0} + ₹{viewingOrder.tc_amt || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {viewingOrder.remarks && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs">
                    <span className="font-bold text-amber-800 block text-[10px] uppercase">Special Remarks / Instructions:</span>
                    <p className="text-gray-700 mt-1">{viewingOrder.remarks}</p>
                  </div>
                )}

                {/* 1. UPLOADED PHOTOS (VIEW & DELETE) */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-600 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-teal-600" />
                      <span>UPLOADED PHOTOS ({(viewingOrder.photos || []).length})</span>
                    </h3>
                    <label className="text-[11px] font-bold text-[#3db2a8] hover:underline flex items-center gap-1 cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>+ Add Photo</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => handleQuickUpload(e, 'photos')} className="hidden" />
                    </label>
                  </div>

                  {(!viewingOrder.photos || viewingOrder.photos.length === 0) ? (
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                      <p className="text-xs text-gray-400">No photos uploaded for this job card.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {viewingOrder.photos.map((url, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-xs flex flex-col justify-between space-y-2">
                          <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-gray-100 relative">
                            <img src={url} alt={`Job Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Image</span>
                            </a>
                            <button
                              onClick={() => handleDeleteMedia(viewingOrder.id, 'photos', url)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. ENGINEERING DRAWINGS (VIEW & DELETE) */}
                <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-600 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>ENGINEERING DRAWINGS ({(viewingOrder.drawings || []).length})</span>
                    </h3>
                    <label className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>+ Add Drawing</span>
                      <input type="file" accept="image/*,.pdf" multiple onChange={(e) => handleQuickUpload(e, 'drawings')} className="hidden" />
                    </label>
                  </div>

                  {(!viewingOrder.drawings || viewingOrder.drawings.length === 0) ? (
                    <div className="p-6 border-2 border-dashed border-blue-200 rounded-2xl text-center">
                      <p className="text-xs text-gray-400">No drawings or PDFs uploaded for this job card.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingOrder.drawings.map((url, idx) => (
                        <div key={idx} className="bg-white border border-blue-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                            <span className="font-bold text-gray-800 text-xs truncate">Drawing #{idx + 1}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>
                            <button
                              onClick={() => handleDeleteMedia(viewingOrder.id, 'drawings', url)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                              title="Delete Drawing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button onClick={() => { setSelectedTagOrder(viewingOrder); setViewingOrder(null); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-2">
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Workshop Tag</span>
                  </button>
                  <button onClick={() => setViewingOrder(null)} className="px-6 py-2 bg-[#1a2b3c] text-white font-bold text-xs rounded-xl shadow-md">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. EDIT ORDER MODAL */}
          {editingOrder && (
            <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-[#1a2b3c] text-sm">Edit Job Card #{editingOrder.id} ({editingOrder.customers?.name})</h3>
                  <button type="button" onClick={() => setEditingOrder(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-500">Gear Model</label>
                    <input type="text" value={editingOrder.model || ''} onChange={(e) => setEditingOrder({...editingOrder, model: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">Quantity</label>
                    <input type="number" min="1" value={editingOrder.qty || 1} onChange={(e) => setEditingOrder({...editingOrder, qty: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">OD</label>
                    <input type="text" value={editingOrder.od || ''} onChange={(e) => setEditingOrder({...editingOrder, od: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">NT</label>
                    <input type="text" value={editingOrder.nt || ''} onChange={(e) => setEditingOrder({...editingOrder, nt: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">Thickness</label>
                    <input type="text" value={editingOrder.thickness || ''} onChange={(e) => setEditingOrder({...editingOrder, thickness: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">Length</label>
                    <input type="text" value={editingOrder.length || ''} onChange={(e) => setEditingOrder({...editingOrder, length: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">Gear Price (₹)</label>
                    <input type="number" value={editingOrder.gear_price || 0} onChange={(e) => setEditingOrder({...editingOrder, gear_price: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">TC Amt (₹)</label>
                    <input type="number" value={editingOrder.tc_amt || 0} onChange={(e) => setEditingOrder({...editingOrder, tc_amt: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500">Bore Keyway</label>
                    <input type="text" value={editingOrder.bore_keyway || ''} onChange={(e) => setEditingOrder({...editingOrder, bore_keyway: e.target.value})} className="w-full border rounded-xl p-2 mt-1" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button type="button" onClick={() => setEditingOrder(null)} className="px-5 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-[#3db2a8] text-white rounded-xl text-xs font-bold shadow-md">Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {/* 3. WORKSHOP JOB TAG PRINT MODAL */}
          {selectedTagOrder && (
            <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="font-bold text-[#1a2b3c] text-xs uppercase">Workshop Job Tag</h3>
                  <button onClick={() => setSelectedTagOrder(null)} className="text-gray-400 font-bold">✕</button>
                </div>

                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-[#1a2b3c]">
                    <span>KHAKARE ENGINEERING</span>
                    <span className="text-[#3db2a8]">TAG #{selectedTagOrder.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-700 pt-1 text-[11px]">
                    <p><strong>Customer:</strong> {selectedTagOrder.customers?.name}</p>
                    <p><strong>Date:</strong> {selectedTagOrder.order_date || '—'}</p>
                    <p><strong>Model:</strong> {selectedTagOrder.model || '—'}</p>
                    <p><strong>Quantity:</strong> {selectedTagOrder.qty || 1} Pcs</p>
                    <p><strong>OD:</strong> {selectedTagOrder.od || '—'}</p>
                    <p><strong>Teeth:</strong> {selectedTagOrder.nt || '—'}</p>
                    <p><strong>Thickness:</strong> {selectedTagOrder.thickness || '—'}</p>
                    <p><strong>Length:</strong> {selectedTagOrder.length || '—'}</p>
                    <p><strong>Bore/Key:</strong> {selectedTagOrder.bore_keyway || '—'}</p>
                    <p><strong>Hardness:</strong> {selectedTagOrder.hardness || '—'}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setSelectedTagOrder(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">Close</button>
                  <button onClick={() => window.print()} className="px-5 py-2 bg-[#1a2b3c] text-white rounded-xl text-xs font-bold flex items-center gap-2">
                    <Printer className="w-3.5 h-3.5" /> Print Tag
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}