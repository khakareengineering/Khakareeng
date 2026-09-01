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
  Filter,
  Menu,
  X
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
          customers ( id, name, city, contact_no )
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

  const handleExportPdf = () => {
    setIsGeneratingPdf(true);
    
    // Set document title strictly to "Report" so the downloaded PDF is named "Report.pdf"
    const originalTitle = document.title;
    document.title = "Report";

    setTimeout(() => {
      setIsGeneratingPdf(false);
      setTimeout(() => {
        window.print();
        // Restore title after print dialog closes
        document.title = originalTitle;
      }, 150);
    }, 1500);
  };

  // Calculations for Screen View
  const totalOrders = filteredOrders.length;
  const totalQty = filteredOrders.reduce((sum, o) => sum + (parseInt(o.qty) || 1), 0);
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
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative print:h-auto print:overflow-visible print:bg-white">
      
      {/* Print Specific CSS Optimization */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 10px !important;
          }
        }

        /* Uiverse AI Loader CSS Styles */
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

      {/* Decorative Blur Orbs */}
      <div className="print:hidden absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="print:hidden absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-xs z-40 lg:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar (Hidden on Print) */}
      <aside className={`print:hidden fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-8">
          <span className="text-xl font-black text-[#1a2b3c] tracking-wider">RA-XIS<span className="text-[#3db2a8]">.</span></span>
          <button className="lg:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <LayoutDashboard className="w-5 h-5 text-gray-400" />
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
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-xs border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <BarChart3 className="w-5 h-5 text-[#3db2a8]" />
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
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative print:overflow-visible">
        
        {/* Web Header (Hidden on Print) */}
        <header className="print:hidden h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-gray-600 hover:bg-white/50 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm md:text-base font-bold text-gray-600">KHAKARE ENGINEERING</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="w-10 h-10 md:w-11 md:h-11 bg-white/90 rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                {ownerInfo.avatar ? <img src={ownerInfo.avatar} alt="Profile" className="w-full h-full object-cover" /> : <span className="font-bold text-[#1a2b3c] text-base">{ownerInfo.name.charAt(0)}</span>}
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

        {/* PRINT ONLY: Clean Professional Header */}
        <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">KHAKARE ENGINEERING</h1>
              <p className="text-xs text-gray-600 mt-0.5">Specialists in Gear Hobbing, Milling, Shaping & Precision Works</p>
              <p className="text-[11px] text-gray-500">Jalna, Maharashtra</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-3 py-1 bg-gray-100 rounded border border-gray-300">PRODUCTION REPORT</span>
              <p className="text-[10px] text-gray-500 mt-1">Generated: {new Date().toLocaleDateString('en-GB')}</p>
              <p className="text-[10px] text-gray-500">Period: {fromDate ? `${fromDate} to ${toDate || 'Till Date'}` : 'All Records'}</p>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pt-6 print:p-0 print:overflow-visible">
          
          {/* Web Title & Glowing Export Button */}
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1a2b3c]">Date-wise Reports</h1>
              <p className="text-xs md:text-sm text-gray-500">Generate and export production summaries based on dates.</p>
            </div>

            <button
              onClick={handleExportPdf}
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-[#1a2b3c] via-[#243b53] to-[#1a2b3c] hover:from-[#13202e] hover:to-[#1e344a] text-white text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2.5 shadow-md active:scale-95 transition-all duration-300 w-fit cursor-pointer border border-white/20"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <Sparkles className="w-4 h-4 text-[#3db2a8] group-hover:rotate-12 transition-transform duration-300" />
              <span className="tracking-wide">Export PDF / Print</span>
            </button>
          </div>

          {/* Date Filter Box (Hidden on Print) */}
          <form onSubmit={handleFilter} className="print:hidden bg-white/50 backdrop-blur-2xl p-5 rounded-3xl border border-white/70 shadow-xs flex flex-col md:flex-row items-end gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-[11px] md:text-xs font-bold text-gray-500 uppercase block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#3db2a8]"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-[11px] md:text-xs font-bold text-gray-500 uppercase block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#3db2a8]"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="submit"
                className="flex-1 md:flex-none px-6 py-2.5 bg-[#3db2a8] hover:bg-[#359d94] active:scale-95 text-white text-xs md:text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                <span>Filter Report</span>
              </button>
              <button
                type="button"
                onClick={() => { setFromDate(''); setToDate(''); setFilteredOrders(orders); }}
                className="px-5 py-2.5 bg-white/80 hover:bg-white active:scale-95 text-gray-600 text-xs md:text-sm font-bold rounded-xl border border-gray-200 transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Summary Stat Cards (Visible ONLY on Screen, Completely HIDDEN in Print / PDF) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4 print:hidden">
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#1a2b3c] block truncate">{totalOrders}</span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">TOTAL ORDERS</p>
            </div>
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-blue-600 block truncate">{totalQty} Pcs</span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">TOTAL OUTPUT</p>
            </div>
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#3db2a8] block truncate">₹{totalGearAmt.toLocaleString('en-IN')}</span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">GEAR AMOUNT</p>
            </div>
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600 block truncate">₹{grandTotal.toLocaleString('en-IN')}</span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">GRAND TOTAL</p>
            </div>
          </div>

          {/* Table Container - Clean Engineering Grid */}
          <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] border border-white/70 shadow-xs overflow-hidden print:bg-white print:rounded-none print:border-none print:shadow-none">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs md:text-sm min-w-[700px] print:min-w-full print:text-[11px] print-table">
                <thead className="text-[11px] md:text-xs uppercase font-bold text-gray-500 bg-white/40 border-b border-gray-200 print:bg-gray-100 print:text-gray-900">
                  <tr>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">Job ID</th>
                    <th className="py-3.5 px-3">Customer Name</th>
                    <th className="py-3.5 px-3">Model / Specs</th>
                    <th className="py-3.5 px-3 text-center">Qty</th>
                    <th className="py-3.5 px-3 text-right">Gear Price</th>
                    <th className="py-3.5 px-3 text-right">TC Amt</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60 font-medium print:divide-gray-300">
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">Loading reports data...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">No records found for selected period.</td></tr>
                  ) : (
                    filteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-white/40 transition">
                        <td className="py-3 px-3 text-gray-600">{o.order_date || '—'}</td>
                        <td className="py-3 px-3 font-bold text-[#3db2a8] print:text-gray-900">#{o.id}</td>
                        <td className="py-3 px-3 font-bold text-[#1a2b3c] print:text-gray-900">{o.customers?.name || 'Customer Deleted'}</td>
                        <td className="py-3 px-3 text-gray-700">
                          {o.model || 'Standard'} (OD: {o.od || '—'}, NT: {o.nt || '—'})
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-teal-700 print:text-gray-900">{o.qty || 1}</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">₹{Number(o.gear_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right text-gray-600">₹{Number(o.tc_amt || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold print:border print:px-2 print:py-0.5 ${getStatusBadge(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRINT ONLY: Professional Footer & Authorized Sign */}
          <div className="hidden print:flex justify-between items-end pt-12 mt-8 border-t border-gray-300 text-xs">
            <div>
              <p className="font-bold text-gray-800">KHAKARE ENGINEERING</p>
              <p className="text-[10px] text-gray-500">This is a computer-generated production summary report.</p>
            </div>
            <div className="text-center">
              <div className="w-44 border-b border-gray-400 mb-1"></div>
              <p className="font-bold text-gray-700">Authorized Signature</p>
            </div>
          </div>

        </main>
      </div>

      {/* FULL-SCREEN EXACT UIVERSE AI ORB MODAL */}
      {isGeneratingPdf && (
        <div className="print:hidden fixed inset-0 bg-[#070d1e]/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4 pointer-events-none">
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

          <p className="text-slate-300 font-medium text-xs md:text-sm mt-6 tracking-wide drop-shadow">
            AI Engine preparing your PDF Report...
          </p>
        </div>
      )}
    </div>
  );
}