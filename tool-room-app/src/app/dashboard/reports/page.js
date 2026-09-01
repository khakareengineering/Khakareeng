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
  Sparkles,
  Filter
} from 'lucide-react';

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Owner & Header state
  const [ownerInfo, setOwnerInfo] = useState({ name: 'Owner', avatar: '' });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchReportData();
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchReportData = async () => {
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

      // 2. Fetch All Job Cards with Customers
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          customers ( id, name, city )
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    if (!fromDate && !toDate) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter((o) => {
      const orderDate = o.order_date;
      if (!orderDate) return false;
      if (fromDate && toDate) return orderDate >= fromDate && orderDate <= toDate;
      if (fromDate) return orderDate >= fromDate;
      if (toDate) return orderDate <= toDate;
      return true;
    });

    setFilteredOrders(filtered);
  };

  // Exact 1.8s AI Generation Simulation then Print
  const handleExportPdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      setIsGeneratingPdf(false);
      window.print();
    }, 1800);
  };

  // Calculations
  const totalOrders = filteredOrders.length;
  const totalQty = filteredOrders.reduce((sum, o) => sum + (parseInt(o.qty) || 0), 0);
  const totalGearAmt = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.gear_price) || 0), 0);
  const totalTcAmt = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.tc_amt) || 0), 0);
  const grandTotal = totalGearAmt + totalTcAmt;

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
      
      {/* Exact Uiverse AI Loader CSS Styles */}
      <style jsx>{`
        .loader-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 180px;
          height: 180px;
          font-family: "Inter", sans-serif;
          font-size: 1.15em;
          font-weight: 700;
          color: white;
          border-radius: 50%;
          background-color: transparent;
          user-select: none;
        }

        .loader {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background-color: transparent;
          animation: loader-rotate 2s linear infinite;
          z-index: 0;
        }

        @keyframes loader-rotate {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 10px 20px 0 #fff inset,
              0 20px 30px 0 #ad5fff inset,
              0 60px 60px 0 #471eec inset;
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 10px 20px 0 #fff inset,
              0 20px 10px 0 #d60a47 inset,
              0 40px 60px 0 #311e80 inset;
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 10px 20px 0 #fff inset,
              0 20px 30px 0 #ad5fff inset,
              0 60px 60px 0 #471eec inset;
          }
        }

        .loader-letter {
          display: inline-block;
          opacity: 0.4;
          transform: translateY(0);
          animation: loader-letter-anim 2s infinite;
          z-index: 1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        }

        .loader-letter:nth-child(1) { animation-delay: 0s; }
        .loader-letter:nth-child(2) { animation-delay: 0.1s; }
        .loader-letter:nth-child(3) { animation-delay: 0.2s; }
        .loader-letter:nth-child(4) { animation-delay: 0.3s; }
        .loader-letter:nth-child(5) { animation-delay: 0.4s; }
        .loader-letter:nth-child(6) { animation-delay: 0.5s; }
        .loader-letter:nth-child(7) { animation-delay: 0.6s; }
        .loader-letter:nth-child(8) { animation-delay: 0.7s; }
        .loader-letter:nth-child(9) { animation-delay: 0.8s; }
        .loader-letter:nth-child(10) { animation-delay: 0.9s; }
        .loader-letter:nth-child(11) { animation-delay: 1.0s; }
        .loader-letter:nth-child(12) { animation-delay: 1.1s; }
        .loader-letter:nth-child(13) { animation-delay: 1.2s; }

        @keyframes loader-letter-anim {
          0%, 100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.18);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="print:hidden absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="print:hidden absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`print:hidden fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
          <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <Users className="w-4 h-4 text-gray-400" />
            View Customers
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <BarChart3 className="w-4 h-4 text-[#3db2a8]" />
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
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative print:overflow-visible">
        <header className="print:hidden h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <span className="text-sm font-bold text-gray-500">Production Reports & Analytics</span>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 print:p-0 print:overflow-visible">
          
          {/* Header Title with Interactive Glow Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#1a2b3c]">Date-wise Reports</h1>
              <p className="text-xs text-gray-500">Generate and export production summaries based on dates.</p>
            </div>

            {/* Glowing Export Button */}
            <button
              onClick={handleExportPdf}
              className="print:hidden group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-[#1a2b3c] via-[#243b53] to-[#1a2b3c] hover:from-[#13202e] hover:to-[#1e344a] text-white text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-[0_8px_20px_rgba(26,43,60,0.25)] hover:shadow-[0_12px_28px_rgba(26,43,60,0.35)] active:scale-95 transition-all duration-300 w-fit cursor-pointer border border-white/20"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <Sparkles className="w-4 h-4 text-[#3db2a8] group-hover:rotate-12 transition-transform duration-300" />
              <span className="tracking-wide">Export PDF / Print</span>
            </button>
          </div>

          {/* Date Filter Box */}
          <form onSubmit={handleFilter} className="print:hidden bg-white/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/60 shadow-sm flex flex-col md:flex-row items-end gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-[#3db2a8]"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-[#3db2a8]"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="submit"
                className="flex-1 md:flex-none px-6 py-2 bg-[#3db2a8] hover:bg-[#359d94] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Report</span>
              </button>
              <button
                type="button"
                onClick={() => { setFromDate(''); setToDate(''); setFilteredOrders(orders); }}
                className="px-4 py-2 bg-white/80 hover:bg-white active:scale-95 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/60 shadow-sm print:bg-white print:border-gray-200">
              <span className="text-2xl font-black text-[#1a2b3c]">{totalOrders}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">TOTAL ORDERS</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/60 shadow-sm print:bg-white print:border-gray-200">
              <span className="text-2xl font-black text-blue-600">{totalQty} Pcs</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">TOTAL QTY</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/60 shadow-sm print:bg-white print:border-gray-200">
              <span className="text-2xl font-black text-[#3db2a8]">₹{totalGearAmt.toLocaleString('en-IN')}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">TOTAL GEAR AMT</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/60 shadow-sm print:bg-white print:border-gray-200">
              <span className="text-2xl font-black text-emerald-600">₹{grandTotal.toLocaleString('en-IN')}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">GRAND TOTAL BILL</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-sm overflow-hidden print:bg-white print:rounded-none print:border print:border-gray-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-bold text-gray-400 bg-white/30 border-b border-gray-100 print:bg-gray-100 print:text-gray-700">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Model / Specs</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Gear Price</th>
                    <th className="py-3 px-4 text-right">TC Amt</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 print:divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">Loading reports data...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">No records found for selected period.</td></tr>
                  ) : (
                    filteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-white/30 transition">
                        <td className="py-3 px-4 text-gray-500 font-medium">{o.order_date || '—'}</td>
                        <td className="py-3 px-4 font-bold text-[#3db2a8]">#{o.id}</td>
                        <td className="py-3 px-4 font-bold text-[#1a2b3c]">{o.customers?.name || 'Customer Deleted'}</td>
                        <td className="py-3 px-4 text-gray-600">{o.model || 'Standard'} (OD: {o.od || '—'}, NT: {o.nt || '—'})</td>
                        <td className="py-3 px-4 text-center font-bold text-teal-700">{o.qty || 1}</td>
                        <td className="py-3 px-4 text-right font-semibold">₹{Number(o.gear_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right text-gray-500">₹{Number(o.tc_amt || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(o.status)}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* FULL-SCREEN EXACT UIVERSE AI ORB MODAL */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-[#070d1e]/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4">
          <div className="loader-wrapper">
            <div className="loader"></div>
            <span className="loader-letter">G</span>
            <span className="loader-letter">e</span>
            <span className="loader-letter">n</span>
            <span className="loader-letter">e</span>
            <span className="loader-letter">r</span>
            <span className="loader-letter">a</span>
            <span className="loader-letter">t</span>
            <span className="loader-letter">i</span>
            <span className="loader-letter">n</span>
            <span className="loader-letter">g</span>
            <span className="loader-letter">.</span>
            <span className="loader-letter">.</span>
            <span className="loader-letter">.</span>
          </div>

          <p className="text-slate-300 font-medium text-xs mt-6 tracking-wide drop-shadow">
            AI Engine preparing your PDF Report...
          </p>
        </div>
      )}
    </div>
  );
}