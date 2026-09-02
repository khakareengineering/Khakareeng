'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
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
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Activity,
  Menu,
  X
} from 'lucide-react';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('This Month');
  const [ownerInfo, setOwnerInfo] = useState({ name: 'Owner', avatar: '' });
  
  // 5 Status Cards: Total Jobs, Pending, In-Production, Completed, Delivered
  const [stats, setStats] = useState({
    totalJobs: 0,
    pending: 0,
    inProduction: 0,
    completed: 0,
    delivered: 0
  });
  
  // 3-Pillar Metrics: Overall Job Growth, Total Output (Pcs), Shop Efficiency (%)
  const [pulseMetrics, setPulseMetrics] = useState({
    jobGrowth: { count: 0, percent: 0, isUp: true },
    totalOutputPcs: 0,
    efficiency: { percent: 0, isUp: false }
  });

  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile and Mobile menu state
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

  // Format Date in Local Timezone YYYY-MM-DD (Avoids UTC offset issues)
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateFilterThresholds = (range) => {
    const now = new Date();
    let currentStart = new Date(now);
    let prevStart = new Date(now);
    let prevEnd = new Date(now);

    if (range === 'This Week') {
      // Monday of current week
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      currentStart.setDate(now.getDate() - diffToMonday);
      currentStart.setHours(0, 0, 0, 0);

      // Previous week same range
      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart);
    } else if (range === 'This Month') {
      // 1st day of current month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Previous month 1st day to end
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'This Year') {
      // 1st day of current year
      currentStart = new Date(now.getFullYear(), 0, 1);

      // Previous year
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear(), 0, 1);
    } else {
      // All Time
      currentStart = new Date('1970-01-01');
      prevStart = new Date('1970-01-01');
      prevEnd = new Date('1970-01-01');
    }

    return {
      currentStr: formatLocalDate(currentStart),
      prevStr: formatLocalDate(prevStart),
      prevEndStr: formatLocalDate(prevEnd)
    };
  };

  const fetchDashboardData = async (selectedRange) => {
    try {
      setLoading(true);

      // 1. Fetch Owner Profile Info
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

      const { currentStr, prevStr, prevEndStr } = getDateFilterThresholds(selectedRange);

      // 2. Exact Count queries matching the strict date range
      const buildQuery = (status = null) => {
        let q = supabase.from('job_cards').select('*', { count: 'exact', head: true });
        if (selectedRange !== 'All Time') {
          q = q.gte('order_date', currentStr);
        }
        if (status) {
          q = q.eq('status', status);
        }
        return q;
      };

      const [
        { count: totalCount },
        { count: pendingCount },
        { count: inProdCount },
        { count: completedCount },
        { count: deliveredCount },
        { count: prevTotalCount }
      ] = await Promise.all([
        buildQuery(),
        buildQuery('Pending'),
        buildQuery('In-Production'),
        buildQuery('Completed'),
        buildQuery('Delivered'),
        selectedRange !== 'All Time'
          ? supabase
              .from('job_cards')
              .select('*', { count: 'exact', head: true })
              .gte('order_date', prevStr)
              .lt('order_date', prevEndStr)
          : Promise.resolve({ count: 0 })
      ]);

      const totalJobs = totalCount || 0;
      const finishedJobs = (completedCount || 0) + (deliveredCount || 0);

      // 3. Growth Percentage
      const prevJobs = prevTotalCount || 0;
      let jobGrowthPercent = 0;
      let jobGrowthIsUp = true;

      if (prevJobs > 0) {
        jobGrowthPercent = Math.round(((totalJobs - prevJobs) / prevJobs) * 100);
        jobGrowthIsUp = jobGrowthPercent >= 0;
      } else {
        jobGrowthPercent = totalJobs > 0 ? 100 : 0;
        jobGrowthIsUp = true;
      }

      // 4. Shop Efficiency
      const efficiencyPct = totalJobs > 0 ? Math.round((finishedJobs / totalJobs) * 100) : 0;
      const efficiencyIsUp = totalJobs > 0 && finishedJobs > 0 && efficiencyPct >= 50;

      // 5. Total Output Pcs calculation (Optimized fetch)
      let pcsQuery = supabase.from('job_cards').select('qty');
      if (selectedRange !== 'All Time') {
        pcsQuery = pcsQuery.gte('order_date', currentStr);
      }
      pcsQuery = pcsQuery.limit(10000); // Ensures all 10k items are covered without truncation

      const { data: qtyData } = await pcsQuery;
      const totalPcs = (qtyData || []).reduce((sum, j) => sum + (parseInt(j.qty) || 1), 0);

      // 6. Recent 5 Job Cards for the table view
      let recentQuery = supabase
        .from('job_cards')
        .select(`
          id,
          order_date,
          status,
          model,
          qty,
          gear_price,
          tc_amt,
          material_grade,
          customer_id,
          customers ( id, name )
        `)
        .order('id', { ascending: false })
        .limit(5);

      if (selectedRange !== 'All Time') {
        recentQuery = recentQuery.gte('order_date', currentStr);
      }
      const { data: recentData, error: recentErr } = await recentQuery;
      if (recentErr) throw recentErr;

      setRecentJobs(recentData || []);

      // 7. Update Dashboard States
      setStats({
        totalJobs: totalJobs,
        pending: pendingCount || 0,
        inProduction: inProdCount || 0,
        completed: completedCount || 0,
        delivered: deliveredCount || 0
      });

      setPulseMetrics({
        jobGrowth: { count: totalJobs, percent: jobGrowthPercent, isUp: jobGrowthIsUp },
        totalOutputPcs: totalPcs,
        efficiency: { percent: efficiencyPct, isUp: efficiencyIsUp }
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-xs z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Prominent High-Visibility Brand Logo Area */}
        <div className="h-28 flex items-center justify-between px-5 border-b border-white/40">
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <img 
              src="/logo.png" 
              alt="Khakare Engineering Logo" 
              className="h-20 w-auto max-w-[210px] object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" 
            />
          </Link>
          <button className="lg:hidden text-gray-500 hover:text-[#3db2a8] ml-2" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-xs border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <LayoutDashboard className="w-5 h-5 text-[#3db2a8]" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link href="/dashboard/new-order" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <PlusCircle className="w-5 h-5 text-gray-400" />
            <span className="text-sm">New Order</span>
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <ClipboardList className="w-5 h-5 text-gray-400" />
            <span className="text-sm">View Orders</span>
          </Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <UserPlus className="w-5 h-5 text-gray-400" />
            <span className="text-sm">New Customer</span>
          </Link>
          <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-sm">View Customers</span>
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <span className="text-sm">Reports</span>
          </Link>
        </nav>

        <div className="p-5 border-t border-white/40">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-gray-600 hover:bg-white/50 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm md:text-base font-extrabold text-[#1a2b3c] tracking-tight">Khakare Engineering</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="w-10 h-10 md:w-11 md:h-11 bg-white/90 rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                {ownerInfo.avatar ? (
                  <img src={ownerInfo.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-[#1a2b3c] text-base">{ownerInfo.name.charAt(0)}</span>
                )}
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                    <p className="text-sm font-bold text-[#1a2b3c]">{ownerInfo.name}</p>
                  </div>
                  <Link href="/dashboard/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#3db2a8] hover:bg-slate-50 transition">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pt-6">
          {/* Header Action Bar with Time Range Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1a2b3c] tracking-tight">Hello, {ownerInfo.name}</h1>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Live Tool Room production overview</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link href="/dashboard/orders" className="px-4 py-2.5 bg-[#1a2b3c] hover:bg-[#253d54] text-white text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2 shadow-md transition-all">
                <ClipboardList className="w-4 h-4" />
                <span>View Orders</span>
              </Link>
              <Link href="/dashboard/new-order" className="px-4 py-2.5 bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2 shadow-md transition-all">
                <PlusCircle className="w-4 h-4" />
                <span>+ New Order</span>
              </Link>
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="appearance-none bg-white/80 hover:bg-white border border-gray-200 px-4 py-2.5 pr-8 rounded-2xl text-xs md:text-sm font-bold text-[#1a2b3c] shadow-xs focus:outline-none cursor-pointer"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 md:gap-4">
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs flex flex-col justify-between min-w-0">
              <span className="text-2xl md:text-3xl font-black text-[#3db2a8] truncate">{loading ? '...' : stats.totalJobs.toLocaleString('en-IN')}</span>
              <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">TOTAL JOBS</span>
            </div>

            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs flex flex-col justify-between min-w-0">
              <span className="text-2xl md:text-3xl font-black text-amber-500 truncate">{loading ? '...' : stats.pending.toLocaleString('en-IN')}</span>
              <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">PENDING</span>
            </div>

            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs flex flex-col justify-between min-w-0">
              <span className="text-2xl md:text-3xl font-black text-blue-500 truncate">{loading ? '...' : stats.inProduction.toLocaleString('en-IN')}</span>
              <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">IN-PRODUCTION</span>
            </div>

            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs flex flex-col justify-between min-w-0">
              <span className="text-2xl md:text-3xl font-black text-emerald-500 truncate">{loading ? '...' : stats.completed.toLocaleString('en-IN')}</span>
              <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">COMPLETED</span>
            </div>

            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs flex flex-col justify-between min-w-0 col-span-2 sm:col-span-1">
              <span className="text-2xl md:text-3xl font-black text-purple-600 truncate">{loading ? '...' : stats.delivered.toLocaleString('en-IN')}</span>
              <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">DELIVERED</span>
            </div>
          </div>

          {/* Recent Job Cards Table */}
          <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] border border-white/70 shadow-xs overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-black text-[#1a2b3c]">Recent Job Cards ({timeRange})</h2>
              <Link href="/dashboard/orders" className="text-xs md:text-sm font-bold text-[#3db2a8] hover:underline flex items-center gap-1">
                View All Orders <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs md:text-sm min-w-[650px]">
                <thead className="text-[11px] md:text-xs uppercase font-bold text-gray-400 bg-white/40 border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-5">Order ID</th>
                    <th className="py-3.5 px-5">Customer Name</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Model / Material</th>
                    <th className="py-3.5 px-5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60 font-medium">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading recent job cards...</td></tr>
                  ) : recentJobs.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-400">No job cards found for {timeRange}.</td></tr>
                  ) : (
                    recentJobs.map(job => (
                      <tr key={job.id} className="hover:bg-white/40 transition">
                        <td className="py-4 px-5 font-bold text-[#3db2a8]">#{job.id}</td>
                        <td className="py-4 px-5 font-bold text-[#1a2b3c]">{job.customers?.name || 'Customer Deleted'}</td>
                        <td className="py-4 px-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-gray-700">{job.model || 'Standard Gear'} ({job.material_grade || '—'})</td>
                        <td className="py-4 px-5 text-right font-bold text-gray-900">
                          {job.gear_price ? `₹${Number(job.gear_price).toLocaleString('en-IN')}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Pulse */}
          <div className="bg-white/50 backdrop-blur-2xl rounded-[2.25rem] border border-white/70 shadow-xs p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-1/4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-[#3db2a8]/15 border border-[#3db2a8]/25 flex items-center justify-center text-[#3db2a8] shadow-xs">
                <Activity className="w-6 h-6 text-[#3db2a8]" />
              </div>
              <div>
                <span className="text-sm md:text-base font-black text-[#1a2b3c] block tracking-tight">Workshop Pulse</span>
                <span className="text-[11px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">{timeRange} Performance</span>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-200/60 w-full md:w-3/4 text-center items-center">
              {/* 1. OVERALL JOB GROWTH */}
              <div className="px-2 sm:px-4 md:px-6">
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${
                    pulseMetrics.jobGrowth.isUp ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {pulseMetrics.jobGrowth.count.toLocaleString('en-IN')}
                  </span>
                  <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-xs ${
                    pulseMetrics.jobGrowth.isUp 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {pulseMetrics.jobGrowth.isUp ? (
                      <ArrowUp className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-rose-600 stroke-[3]" />
                    )}
                    <span>{Math.abs(pulseMetrics.jobGrowth.percent)}%</span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 block">
                  OVERALL JOB GROWTH
                </span>
              </div>

              {/* 2. TOTAL OUTPUT */}
              <div className="px-2 sm:px-4 md:px-6">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#3db2a8] tracking-tight block">
                  {pulseMetrics.totalOutputPcs.toLocaleString('en-IN')} <span className="text-base md:text-lg font-bold text-[#3db2a8]">Pcs</span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 block">
                  TOTAL OUTPUT
                </span>
              </div>

              {/* 3. SHOP EFFICIENCY */}
              <div className="px-2 sm:px-4 md:px-6">
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${
                    pulseMetrics.efficiency.isUp ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {pulseMetrics.efficiency.percent}%
                  </span>
                  <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-xs ${
                    pulseMetrics.efficiency.isUp 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {pulseMetrics.efficiency.isUp ? (
                      <ArrowUp className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-rose-600 stroke-[3]" />
                    )}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 block">
                  SHOP EFFICIENCY
                </span>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}