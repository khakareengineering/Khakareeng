'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('This Month');
  const [ownerInfo, setOwnerInfo] = useState({ name: 'Owner', avatar: '' });
  const [stats, setStats] = useState({
    totalJobs: 0,
    pending: 0,
    inProduction: 0,
    completed: 0,
    customers: 0,
    growthPercent: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Status Update Modal State
  const [isManageOrdersOpen, setIsManageOrdersOpen] = useState(false);
  const [selectedJobToUpdate, setSelectedJobToUpdate] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchModalTerm, setSearchModalTerm] = useState('');

  // Profile menu state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchDashboardData(timeRange);
  }, [timeRange]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDateFilterThreshold = (range) => {
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();

    if (range === 'This Week') {
      const day = now.getDay() || 7;
      startDate.setDate(now.getDate() - day + 1);
      startDate.setHours(0, 0, 0, 0);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
    } else if (range === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (range === 'This Year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    } else {
      startDate = new Date('1970-01-01');
      prevStartDate = new Date('1970-01-01');
    }

    return {
      currentStart: startDate.toISOString().split('T')[0],
      prevStart: prevStartDate.toISOString().split('T')[0]
    };
  };

  const fetchDashboardData = async (selectedRange) => {
    try {
      setLoading(true);

      // 1. Fetch Owner Settings
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

      // 2. Fetch Active Customers Count
      const { count: custCount, error: custErr } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (custErr) throw custErr;

      // 3. Fetch Job Cards with customer names
      const { data: jobsData, error: jobErr } = await supabase
        .from('job_cards')
        .select(`
          id,
          order_date,
          status,
          model,
          qty,
          gear_price,
          tc_amt,
          customer_id,
          customers ( id, name )
        `)
        .order('id', { ascending: false });

      if (jobErr) throw jobErr;

      const jobs = jobsData || [];
      setAllJobs(jobs);

      const { currentStart, prevStart } = getDateFilterThreshold(selectedRange);

      const periodJobs = selectedRange === 'All Time'
        ? jobs
        : jobs.filter(j => j.order_date >= currentStart);

      const prevPeriodJobs = selectedRange === 'All Time'
        ? []
        : jobs.filter(j => j.order_date >= prevStart && j.order_date < currentStart);

      let growth = 0;
      if (prevPeriodJobs.length > 0) {
        growth = Math.round(((periodJobs.length - prevPeriodJobs.length) / prevPeriodJobs.length) * 100);
      } else if (periodJobs.length > 0) {
        growth = 100;
      }

      setRecentJobs(periodJobs.slice(0, 5));

      setStats({
        totalJobs: periodJobs.length,
        pending: periodJobs.filter(j => j.status === 'Pending').length,
        inProduction: periodJobs.filter(j => j.status === 'In-Production').length,
        completed: periodJobs.filter(j => j.status === 'Completed' || j.status === 'Delivered').length,
        customers: custCount || 0,
        growthPercent: growth
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSave = async () => {
    if (!selectedJobToUpdate || !updatedStatus) return;
    try {
      const { error } = await supabase
        .from('job_cards')
        .update({ status: updatedStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedJobToUpdate.id);

      if (error) throw error;
      alert('Status updated successfully!');
      setSelectedJobToUpdate(null);
      fetchDashboardData(timeRange);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In-Production': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Delivered': return 'bg-purple-50 text-purple-600 border border-purple-200';
      default: return 'bg-amber-50 text-amber-600 border border-amber-200';
    }
  };

  const filteredModalJobs = allJobs.filter(j => {
    const matchesStatus = statusFilter === 'All Status' || j.status === statusFilter;
    const custName = j.customers?.name || '';
    const q = searchModalTerm.toLowerCase();
    const matchesSearch = custName.toLowerCase().includes(q) || j.id.toString().includes(q) || j.model?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

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
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap"><div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>Dashboard</Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">New Customer</Link>
          <Link href="/dashboard/repeat-order" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Repeat Order</Link>
          <Link href="/dashboard/view-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">View / Edit Customer</Link>
          <Link href="/dashboard/report" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Reports</Link>
        </nav>
        <div className="p-5"><Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">Logout</Link></div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-700 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(true)}><svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">Tool Room Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="flex items-center cursor-pointer group p-1" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md">
                  {ownerInfo.avatar ? (
                    <img src={ownerInfo.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-gray-600 mt-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                  )}
                </div>
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100"><p className="text-xs text-gray-400 font-semibold">Logged in as</p><p className="text-sm font-bold text-[#1a2b3c]">{ownerInfo.name}</p></div>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#3db2a8]">Settings</Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {/* Header Action Bar with Live Owner Name */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#1a2b3c]">Hello, {ownerInfo.name}</h1>
              <p className="text-xs text-gray-500">Live Tool Room production overview</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setIsManageOrdersOpen(true)} className="px-4 py-2.5 bg-[#1a2b3c] hover:bg-[#253d54] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md transition-all cursor-pointer">
                <span>👁️ View Orders</span>
              </button>
              <Link href="/dashboard/repeat-order" className="px-4 py-2.5 bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md transition-all">
                <span>+ Repeat Order</span>
              </Link>
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="appearance-none bg-white/70 hover:bg-white border border-white/80 px-4 py-2.5 pr-8 rounded-2xl text-xs font-bold text-[#1a2b3c] shadow-sm focus:outline-none cursor-pointer"
                >
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Year</option>
                  <option>All Time</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500 text-xs">▼</div>
              </div>
            </div>
          </div>

          {/* 5 Live Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-[1.75rem] border border-white/60 shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-black text-[#3db2a8]">{loading ? '...' : stats.totalJobs}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">TOTAL JOBS</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-[1.75rem] border border-white/60 shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-black text-amber-500">{loading ? '...' : stats.pending}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">PENDING</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-[1.75rem] border border-white/60 shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-black text-blue-500">{loading ? '...' : stats.inProduction}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">IN-PRODUCTION</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-[1.75rem] border border-white/60 shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-black text-emerald-500">{loading ? '...' : stats.completed}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">COMPLETED</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-[1.75rem] border border-white/60 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="text-3xl font-black text-[#1a2b3c]">{loading ? '...' : stats.customers}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">CUSTOMERS</p>
            </div>
          </div>

          {/* Recent Job Cards Table */}
          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-sm p-6 md:p-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200/40">
              <h2 className="text-sm font-extrabold text-[#1a2b3c]">Recent Job Cards ({timeRange})</h2>
              <button onClick={() => setIsManageOrdersOpen(true)} className="text-xs font-bold text-[#3db2a8] hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Model / Material</th>
                    <th className="py-3 px-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {recentJobs.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-6 text-gray-400">No job cards found for {timeRange}.</td></tr>
                  ) : (
                    recentJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#3db2a8]">#{job.id}</td>
                        <td className="py-3.5 px-4 font-bold text-[#1a2b3c]">{job.customers?.name || 'Customer Deleted'}</td>
                        <td className="py-3.5 px-4"><span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(job.status)}`}>{job.status}</span></td>
                        <td className="py-3.5 px-4 text-gray-600 font-semibold">{job.model || '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-800 text-right">{job.gear_price ? `₹${Number(job.gear_price).toLocaleString('en-IN')}` : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Job Growth Summary */}
          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-sm p-6 flex flex-col md:flex-row items-center justify-around gap-4 text-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div className="text-left">
                <span className="text-xs font-bold text-[#1a2b3c] block">Job Growth</span>
                <span className="text-[10px] text-gray-400 font-medium">Period: {timeRange}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xl font-extrabold text-[#3db2a8]">{stats.totalJobs}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${stats.growthPercent >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {stats.growthPercent >= 0 ? `+${stats.growthPercent}%` : `${stats.growthPercent}%`}
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Total Generated</p>
            </div>
            <div>
              <span className="text-xl font-extrabold text-blue-600">{stats.inProduction}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">In Production</p>
            </div>
            <div>
              <span className="text-xl font-extrabold text-emerald-600">{stats.completed}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Completed</p>
            </div>
          </div>
        </main>
      </div>

      {/* View & Manage Orders Popup */}
      {isManageOrdersOpen && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 md:p-8 relative">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-[#1a2b3c]">View & Manage Orders</h3>
                <p className="text-[11px] text-gray-500 font-medium">Click any order to instantly update its status.</p>
              </div>
              <button onClick={() => { setIsManageOrdersOpen(false); setSelectedJobToUpdate(null); }} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Search ID, Name, Model..."
                value={searchModalTerm}
                onChange={(e) => setSearchModalTerm(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none"
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>In-Production</option>
                <option>Completed</option>
                <option>Delivered</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredModalJobs.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs">No orders matching filter.</p>
              ) : (
                filteredModalJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => { setSelectedJobToUpdate(job); setUpdatedStatus(job.status); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedJobToUpdate?.id === job.id ? 'bg-[#3db2a8]/10 border-[#3db2a8]' : 'bg-gray-50/70 hover:bg-gray-100/70 border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#3db2a8] text-xs">#{job.id}</span>
                        <span className="text-gray-400 text-[10px] ml-2">{job.order_date}</span>
                        <p className="font-bold text-[#1a2b3c] text-xs mt-0.5">{job.customers?.name || 'Customer Deleted'} <span className="font-normal text-gray-500">({job.model} - {job.qty || 0} Pcs)</span></p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(job.status)}`}>{job.status}</span>
                    </div>

                    {selectedJobToUpdate?.id === job.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-gray-500">UPDATE STATUS:</span>
                        <select
                          value={updatedStatus}
                          onChange={(e) => setUpdatedStatus(e.target.value)}
                          className="bg-white border border-gray-300 rounded-xl px-3 py-1 text-xs font-bold focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In-Production">In-Production</option>
                          <option value="Completed">Completed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => { setIsManageOrdersOpen(false); setSelectedJobToUpdate(null); }} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl">Cancel</button>
              {selectedJobToUpdate && (
                <button onClick={handleStatusSave} className="px-6 py-2 bg-[#3db2a8] hover:bg-[#359d94] text-white font-bold text-xs rounded-xl shadow-md">Save Changes</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}