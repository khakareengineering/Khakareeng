'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function ViewCustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);

  // Profile menu state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch only active customers
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false });

      if (custErr) throw custErr;

      // Fetch all job cards
      const { data: jobsData, error: jobsErr } = await supabase
        .from('job_cards')
        .select('*')
        .order('id', { ascending: false });

      if (jobsErr) throw jobsErr;

      setCustomers(custData || []);
      setJobCards(jobsData || []);
    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. Customer Update
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: selectedCustomer.name,
          contact_no: selectedCustomer.contact_no,
          city: selectedCustomer.city,
          address: selectedCustomer.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;
      alert('Customer Updated Successfully!');
      setIsEditCustomerOpen(false);
      fetchData();
    } catch (err) {
      alert('Error updating customer: ' + err.message);
    }
  };

  // 2. Soft Delete Customer
  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to remove this customer? Order history will be preserved.')) return;
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', customerId);

      if (error) throw error;
      alert('Customer removed from active list.');
      setIsEditCustomerOpen(false);
      fetchData();
    } catch (err) {
      alert('Error deleting customer: ' + err.message);
    }
  };

  // 3. Job Card Update
  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('job_cards')
        .update({
          status: selectedJob.status,
          qty: selectedJob.qty ? parseInt(selectedJob.qty) : null,
          od: selectedJob.od,
          nt: selectedJob.nt,
          model: selectedJob.model,
          angle: selectedJob.angle,
          root: selectedJob.root,
          thickness: selectedJob.thickness,
          length: selectedJob.length,
          bore_keyway: selectedJob.bore_keyway,
          material_grade: selectedJob.material_grade,
          hardness: selectedJob.hardness,
          gear_price: selectedJob.gear_price ? parseFloat(selectedJob.gear_price) : 0,
          tc_amt: selectedJob.tc_amt ? parseFloat(selectedJob.tc_amt) : 0,
          remarks: selectedJob.remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedJob.id);

      if (error) throw error;
      alert('Job Card Updated Successfully!');
      setIsEditJobOpen(false);
      fetchData();
    } catch (err) {
      alert('Error updating job card: ' + err.message);
    }
  };

  // Mapping customers with their latest job details
  const filteredData = customers.map((c) => {
    const custJobs = jobCards.filter((j) => j.customer_id === c.id);
    const latestJob = custJobs[0] || {};
    return {
      ...c,
      jobsCount: custJobs.length,
      latestJob,
      allJobs: custJobs
    };
  }).filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q) ||
      item.contact_no?.toLowerCase().includes(q) ||
      item.latestJob?.model?.toLowerCase().includes(q) ||
      item.id?.toString().includes(q)
    );
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
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <nav className="flex-1 px-5 py-6 space-y-3 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Dashboard</Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">New Customer</Link>
          <Link href="/dashboard/repeat-order" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Repeat Order</Link>
          <Link href="/dashboard/view-customer" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap"><div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>View / Edit Customer</Link>
          <Link href="/dashboard/report" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Reports</Link>
        </nav>
        <div className="p-5"><Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">Logout</Link></div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-700 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(true)}><svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">Customer Database Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="flex items-center cursor-pointer group p-1" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md"><svg className="w-6 h-6 text-gray-600 mt-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg></div>
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100"><p className="text-xs text-gray-400 font-semibold">Logged in as</p><p className="text-sm font-bold text-[#1a2b3c]">Nikhil</p></div>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#3db2a8]">Settings</Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-[#1a2b3c] tracking-tight">Customer Database</h1>
                <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">Search, view sorted gear history, and update complete customer & job details.</p>
              </div>
              <div className="w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search ID, Name, Model, City..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3db2a8] shadow-sm"
                />
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/30 border-b border-white/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Customer ID</th>
                      <th className="py-4 px-6">Customer Name</th>
                      <th className="py-4 px-6">Model / Material</th>
                      <th className="py-4 px-6">Gear Price</th>
                      <th className="py-4 px-6">TC Amt</th>
                      <th className="py-4 px-6">Contact</th>
                      <th className="py-4 px-6">City</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {loading ? (
                      <tr><td colSpan="9" className="text-center py-8 text-gray-500 font-medium">Loading database...</td></tr>
                    ) : filteredData.length === 0 ? (
                      <tr><td colSpan="9" className="text-center py-8 text-gray-500 font-medium">No records found.</td></tr>
                    ) : (
                      filteredData.map((cust) => (
                        <tr key={cust.id} className="hover:bg-white/30 transition-colors">
                          <td className="py-4 px-6 font-bold text-[#3db2a8]">#{cust.id}</td>
                          <td className="py-4 px-6 font-bold text-[#1a2b3c] cursor-pointer hover:underline" onClick={() => { setSelectedCustomer(cust); setIsHistoryOpen(true); }}>
                            {cust.name}
                            <span className="block text-[10px] text-gray-400 font-normal">Orders: {cust.jobsCount} (Click to View History)</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-700">{cust.latestJob?.model || '—'}</td>
                          <td className="py-4 px-6 font-bold text-gray-800">{cust.latestJob?.gear_price ? `₹${Number(cust.latestJob.gear_price).toLocaleString('en-IN')}` : '—'}</td>
                          <td className="py-4 px-6 font-bold text-emerald-700">{cust.latestJob?.tc_amt ? `₹${Number(cust.latestJob.tc_amt).toLocaleString('en-IN')}` : '—'}</td>
                          <td className="py-4 px-6 text-gray-600">{cust.contact_no || '—'}</td>
                          <td className="py-4 px-6 text-gray-600">{cust.city || '—'}</td>
                          <td className="py-4 px-6">
                            {cust.latestJob?.status ? (
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(cust.latestJob.status)}`}>
                                {cust.latestJob.status}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => { setSelectedCustomer(cust); setIsEditCustomerOpen(true); }}
                              className="px-3 py-1.5 bg-white/70 hover:bg-white text-gray-700 font-bold rounded-xl border border-white/80 shadow-sm transition-all"
                            >
                              Edit Info
                            </button>
                            {cust.latestJob?.id && (
                              <button
                                onClick={() => { setSelectedJob(cust.latestJob); setIsEditJobOpen(true); }}
                                className="px-3 py-1.5 bg-[#3db2a8]/20 hover:bg-[#3db2a8]/30 text-[#1a2b3c] font-bold rounded-xl border border-[#3db2a8]/40 shadow-sm transition-all"
                              >
                                Edit Order
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 1. Modal: Edit Customer & Soft Delete */}
      {isEditCustomerOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-2xl w-full max-w-lg p-6 md:p-8 relative">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-[#1a2b3c]">Edit Customer #{selectedCustomer.id}</h3>
              <button onClick={() => setIsEditCustomerOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-500 mb-1 uppercase">Customer Name *</label>
                <input type="text" required value={selectedCustomer.name} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#3db2a8] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 mb-1 uppercase">Contact No</label>
                  <input type="text" value={selectedCustomer.contact_no || ''} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, contact_no: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#3db2a8] focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 mb-1 uppercase">City</label>
                  <input type="text" value={selectedCustomer.city || ''} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, city: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#3db2a8] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-500 mb-1 uppercase">Address</label>
                <textarea rows="2" value={selectedCustomer.address || ''} onChange={(e) => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#3db2a8] focus:outline-none resize-none"></textarea>
              </div>
              <div className="pt-4 flex justify-between items-center">
                <button type="button" onClick={() => handleDeleteCustomer(selectedCustomer.id)} className="text-red-500 hover:text-red-700 font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                  Delete Customer
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsEditCustomerOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-[#3db2a8] hover:bg-[#359d94] text-white font-bold rounded-xl shadow-md transition-all">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Full Job Card / Order Edit */}
      {isEditJobOpen && selectedJob && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-[#1a2b3c]">Edit Order / Job Card #{selectedJob.id}</h3>
              <button onClick={() => setIsEditJobOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>
            <form onSubmit={handleUpdateJob} className="space-y-6 text-xs">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                <span className="font-bold text-gray-700">Order Status:</span>
                <select value={selectedJob.status} onChange={(e) => setSelectedJob({ ...selectedJob, status: e.target.value })} className="bg-white border border-gray-300 rounded-xl px-4 py-2 font-bold focus:outline-none">
                  <option value="Pending">Pending</option>
                  <option value="In-Production">In-Production</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="block font-bold text-gray-500 mb-1">QTY</label><input type="number" value={selectedJob.qty || ''} onChange={(e) => setSelectedJob({ ...selectedJob, qty: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">OD</label><input type="text" value={selectedJob.od || ''} onChange={(e) => setSelectedJob({ ...selectedJob, od: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">NT</label><input type="text" value={selectedJob.nt || ''} onChange={(e) => setSelectedJob({ ...selectedJob, nt: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">MODEL</label><input type="text" value={selectedJob.model || ''} onChange={(e) => setSelectedJob({ ...selectedJob, model: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">ANGLE</label><input type="text" value={selectedJob.angle || ''} onChange={(e) => setSelectedJob({ ...selectedJob, angle: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">ROOT</label><input type="text" value={selectedJob.root || ''} onChange={(e) => setSelectedJob({ ...selectedJob, root: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">THICKNESS</label><input type="text" value={selectedJob.thickness || ''} onChange={(e) => setSelectedJob({ ...selectedJob, thickness: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">LENGTH</label><input type="text" value={selectedJob.length || ''} onChange={(e) => setSelectedJob({ ...selectedJob, length: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">BORE KEYWAY</label><input type="text" value={selectedJob.bore_keyway || ''} onChange={(e) => setSelectedJob({ ...selectedJob, bore_keyway: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">MATERIAL GRADE</label><input type="text" value={selectedJob.material_grade || ''} onChange={(e) => setSelectedJob({ ...selectedJob, material_grade: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">HARDNESS</label><input type="text" value={selectedJob.hardness || ''} onChange={(e) => setSelectedJob({ ...selectedJob, hardness: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div><label className="block font-bold text-gray-500 mb-1">GEAR PRICE (₹)</label><input type="number" step="any" value={selectedJob.gear_price || ''} onChange={(e) => setSelectedJob({ ...selectedJob, gear_price: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2" /></div>
                <div className="col-span-2 md:col-span-4"><label className="block font-bold text-emerald-700 mb-1 uppercase">TC AMT (TEETH CUTTING ₹)</label><input type="number" step="any" value={selectedJob.tc_amt || ''} onChange={(e) => setSelectedJob({ ...selectedJob, tc_amt: e.target.value })} className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-bold text-emerald-800" /></div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 mb-1 uppercase">Remarks</label>
                <textarea rows="2" value={selectedJob.remarks || ''} onChange={(e) => setSelectedJob({ ...selectedJob, remarks: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsEditJobOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#3db2a8] hover:bg-[#359d94] text-white font-bold rounded-xl shadow-md transition-all">Update Job Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Complete Order History */}
      {isHistoryOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 md:p-8 relative">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-[#1a2b3c]">{selectedCustomer.name}</h3>
                <p className="text-[11px] text-gray-500 font-medium">Customer ID: #{selectedCustomer.id} | City: {selectedCustomer.city || 'N/A'} | Total Orders: {selectedCustomer.jobsCount}</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <span className="text-[11px] font-black uppercase text-[#3db2a8] tracking-wider block mb-2">Complete Order History</span>
              {selectedCustomer.allJobs.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-xs">No order history available for this customer.</p>
              ) : (
                selectedCustomer.allJobs.map((job) => (
                  <div key={job.id} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#3db2a8] text-xs">#{job.id}</span>
                        <span className="text-gray-400 text-[10px] ml-2">{job.order_date}</span>
                        <span className="font-bold text-[#1a2b3c] text-xs ml-2">{job.model} ({job.qty || 0} Pcs)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#1a2b3c] text-xs">₹{Number(job.gear_price || 0).toLocaleString('en-IN')}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(job.status)}`}>{job.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 bg-white p-2.5 rounded-xl text-[10px] border border-gray-100 text-gray-600">
                      <div><span className="font-bold text-gray-400">QTY:</span> {job.qty || '—'}</div>
                      <div><span className="font-bold text-gray-400">OD:</span> {job.od || '—'}</div>
                      <div><span className="font-bold text-gray-400">NT:</span> {job.nt || '—'}</div>
                      <div><span className="font-bold text-gray-400">ANGLE:</span> {job.angle || '—'}</div>
                      <div><span className="font-bold text-gray-400">ROOT:</span> {job.root || '—'}</div>
                      <div><span className="font-bold text-gray-400">TC AMT:</span> ₹{job.tc_amt || 0}</div>
                      <div className="col-span-2"><span className="font-bold text-gray-400">MATERIAL:</span> {job.material_grade || '—'}</div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => { setSelectedJob(job); setIsEditJobOpen(true); }}
                        className="text-[11px] text-[#3db2a8] hover:underline font-bold"
                      >
                        Edit This Order Specs →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setIsHistoryOpen(false)} className="px-6 py-2 bg-[#1a2b3c] text-white font-bold text-xs rounded-xl shadow-sm">Close History</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}