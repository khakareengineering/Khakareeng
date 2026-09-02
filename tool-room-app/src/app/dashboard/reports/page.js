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
  LogOut,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Exactly 25 records per view / per page
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;

  // Header & menu state
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

  // Fetch complete database records in parallel chunks
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

      const { count: totalCount, error: countErr } = await supabase
        .from('job_cards')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      const total = totalCount || 0;
      const chunkSize = 1000;
      const totalChunks = Math.ceil(total / chunkSize);

      const chunkPromises = [];
      for (let i = 0; i < totalChunks; i++) {
        const from = i * chunkSize;
        const to = from + chunkSize - 1;
        chunkPromises.push(
          supabase
            .from('job_cards')
            .select(`
              id,
              order_date,
              status,
              model,
              qty,
              od,
              nt,
              gear_price,
              tc_amt,
              material_grade,
              customers ( id, name, city, contact_no )
            `)
            .order('id', { ascending: false })
            .range(from, to)
        );
      }

      const results = await Promise.all(chunkPromises);
      let allRecords = [];
      results.forEach(res => {
        if (res.data) {
          allRecords = allRecords.concat(res.data);
        }
      });

      setOrders(allRecords);
      setFilteredOrders(allRecords);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyAllFilters(fromDate, toDate, searchQuery, selectedStatus);
    setCurrentPage(1);
  }, [fromDate, toDate, searchQuery, selectedStatus, orders]);

  const applyAllFilters = (from, to, search, status) => {
    let result = [...orders];

    if (from && to) {
      result = result.filter(o => (o.order_date || '') >= from && (o.order_date || '') <= to);
    } else if (from) {
      result = result.filter(o => (o.order_date || '') >= from);
    } else if (to) {
      result = result.filter(o => (o.order_date || '') <= to);
    }

    if (status !== 'All') {
      result = result.filter(o => o.status === status);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(o => {
        const idMatch = String(o.id).toLowerCase().includes(q);
        const custMatch = (o.customers?.name || '').toLowerCase().includes(q);
        const modelMatch = (o.model || '').toLowerCase().includes(q);
        const gradeMatch = (o.material_grade || '').toLowerCase().includes(q);
        return idMatch || custMatch || modelMatch || gradeMatch;
      });
    }

    setFilteredOrders(result);
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setSelectedStatus('All');
    setFilteredOrders(orders);
    setCurrentPage(1);
  };

  const handleExportPdf = () => {
    setIsGeneratingPdf(true);
    const originalTitle = document.title;
    document.title = "Report";

    setTimeout(() => {
      setIsGeneratingPdf(false);
      setTimeout(() => {
        window.print();
        document.title = originalTitle;
      }, 150);
    }, 1500);
  };

  // Metrics on filtered result
  const totalOrders = filteredOrders.length;
  const totalQty = filteredOrders.reduce((sum, o) => sum + (parseInt(o.qty) || 1), 0);
  const totalGearAmt = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.gear_price) || 0), 0);
  const totalTcAmt = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.tc_amt) || 0), 0);
  const grandTotal = totalGearAmt + totalTcAmt;

  // Web screen pagination: 25 items
  const totalPages = Math.ceil(totalOrders / recordsPerPage) || 1;
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const screenRecords = filteredOrders.slice(indexOfFirstRecord, indexOfLastRecord);

  // Group ALL filtered orders into 25-record chunks for print pagination
  const printChunks = [];
  for (let i = 0; i < filteredOrders.length; i += recordsPerPage) {
    printChunks.push(filteredOrders.slice(i, i + recordsPerPage));
  }
  const totalPrintPages = printChunks.length || 1;

  const statusOptions = ['All', 'Pending', 'In-Production', 'Completed', 'Delivered'];

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
      
      {/* Precision Print Styling for 25 Rows per page */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .print-table th {
            border: 1px solid #94a3b8 !important;
            padding: 4px 6px !important;
            font-size: 9.5px !important;
            background-color: #f1f5f9 !important;
          }
          .print-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 2.8px 6px !important;
            font-size: 9px !important;
            line-height: 1.15 !important;
          }
        }

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
            box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset;
          }
          50% {
            transform: rotate(270deg);
            box-shadow: 0 10px 20px 0 #fff inset, 0 20px 10px 0 #d60a47 inset, 0 40px 60px 0 #311e80 inset;
          }
          100% {
            transform: rotate(450deg);
            box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset;
          }
        }

        .loader-letter {
          display: inline-block;
          opacity: 0.4;
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
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          20% { opacity: 1; transform: scale(1.18); }
          40% { opacity: 0.7; transform: translateY(0); }
        }
      `}</style>

      {/* Decorative Orbs */}
      <div className="print:hidden absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="print:hidden absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-xs z-40 lg:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`print:hidden fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
        
        {/* Web Header */}
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

        {/* ========================================================================= */}
        {/* PRINT ENGINE: Iterates over ALL filtered records in 25-record page chunks */}
        {/* ========================================================================= */}
        <div className="hidden print:block w-full">
          {printChunks.map((chunk, pageIndex) => (
            <div key={pageIndex} className="print-page">
              {/* Header on Every Page */}
              <div>
                <div className="border-b-2 border-gray-800 pb-2 mb-2 flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">KHAKARE ENGINEERING</h1>
                    <p className="text-[10px] text-gray-600 mt-0.5">Specialists in Gear Hobbing, Milling, Shaping & Precision Works</p>
                    <p className="text-[9px] text-gray-500">Jalna, Maharashtra</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded border border-gray-300">PRODUCTION REPORT</span>
                    <p className="text-[8.5px] text-gray-500 mt-0.5">Generated: {new Date().toLocaleDateString('en-GB')}</p>
                    <p className="text-[8.5px] font-bold text-gray-800">Page {pageIndex + 1} of {totalPrintPages}</p>
                    {(searchQuery || selectedStatus !== 'All') && (
                      <p className="text-[8.5px] font-bold text-teal-700 mt-0.5">
                        {searchQuery ? `"${searchQuery}" ` : ''}{selectedStatus !== 'All' ? `[${selectedStatus}]` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Exactly 25 rows Table */}
                <table className="w-full text-left print-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Job ID</th>
                      <th>Customer Name</th>
                      <th>Model / Specs</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Gear Price</th>
                      <th className="text-right">TC Amt</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map(o => (
                      <tr key={o.id}>
                        <td>{o.order_date || '—'}</td>
                        <td className="font-bold">#{o.id}</td>
                        <td className="font-bold">{o.customers?.name || 'Customer Deleted'}</td>
                        <td>{o.model || 'Standard'} (OD: {o.od || '—'}, NT: {o.nt || '—'})</td>
                        <td className="text-center font-bold">{o.qty || 1}</td>
                        <td className="text-right font-bold">₹{Number(o.gear_price || 0).toLocaleString('en-IN')}</td>
                        <td className="text-right">₹{Number(o.tc_amt || 0).toLocaleString('en-IN')}</td>
                        <td className="text-center font-bold">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer on Every Page */}
              <div className="flex justify-between items-end pt-2 mt-2 border-t border-gray-300 text-xs">
                <div>
                  <p className="font-bold text-gray-800">KHAKARE ENGINEERING</p>
                  <p className="text-[9px] text-gray-500">A4 Production Statement - Page {pageIndex + 1} of {totalPrintPages}</p>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-gray-400 mb-1"></div>
                  <p className="font-bold text-gray-700">Authorized Signature</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* WEB INTERFACE VIEW (25 Records per view + Pagination Controls)            */}
        {/* ========================================================================= */}
        <main className="print:hidden flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pt-6">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1a2b3c]">Date-wise Reports</h1>
              <p className="text-xs md:text-sm text-gray-500">Complete database production statements with 25 records per view.</p>
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

          {/* Date Filter Box */}
          <div className="bg-white/50 backdrop-blur-2xl p-5 rounded-3xl border border-white/70 shadow-xs flex flex-col md:flex-row items-end gap-4">
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
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-white/80 hover:bg-white active:scale-95 text-gray-600 text-xs md:text-sm font-bold rounded-xl border border-gray-200 shadow-xs transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#1a2b3c] block truncate">
                {loading ? '...' : totalOrders.toLocaleString('en-IN')}
              </span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">TOTAL ORDERS</p>
            </div>
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-blue-600 block truncate">
                {loading ? '...' : `${totalQty.toLocaleString('en-IN')} Pcs`}
              </span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">TOTAL OUTPUT</p>
            </div>
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#3db2a8] block truncate">
                {loading ? '...' : `₹${totalGearAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              </span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">GEAR AMOUNT</p>
            </div>
            <div className="bg-white/50 backdrop-blur-2xl p-4 md:p-5 rounded-3xl border border-white/70 shadow-xs min-w-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600 block truncate">
                {loading ? '...' : `₹${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              </span>
              <p className="text-[11px] md:text-xs font-bold text-gray-400 uppercase mt-1">GRAND TOTAL</p>
            </div>
          </div>

          {/* Search Bar & Status Tabs */}
          <div className="bg-white/50 backdrop-blur-2xl p-4 rounded-[2rem] border border-white/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, Model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/90 border border-gray-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-gray-700 placeholder-gray-400 font-medium focus:outline-none focus:border-[#3db2a8] shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {statusOptions.map((status) => {
                const isActive = selectedStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1a2b3c] text-white shadow-md'
                        : 'bg-white/60 hover:bg-white text-gray-600 hover:text-[#1a2b3c] border border-white/80'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Container - Showing 25 records on screen */}
          <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] border border-white/70 shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs md:text-sm min-w-[700px]">
                <thead className="text-[11px] md:text-xs uppercase font-bold text-gray-500 bg-white/40 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Model / Specs</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Gear Price</th>
                    <th className="py-3 px-4 text-right">TC Amt</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60 font-medium">
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">Loading complete database records...</td></tr>
                  ) : screenRecords.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">No records found matching current criteria.</td></tr>
                  ) : (
                    screenRecords.map(o => (
                      <tr key={o.id} className="hover:bg-white/40 transition">
                        <td className="py-2.5 px-4 text-gray-600">{o.order_date || '—'}</td>
                        <td className="py-2.5 px-4 font-bold text-[#3db2a8]">#{o.id}</td>
                        <td className="py-2.5 px-4 font-bold text-[#1a2b3c]">{o.customers?.name || 'Customer Deleted'}</td>
                        <td className="py-2.5 px-4 text-gray-700">
                          {o.model || 'Standard'} (OD: {o.od || '—'}, NT: {o.nt || '—'})
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-teal-700">{o.qty || 1}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-gray-900">₹{Number(o.gear_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">₹{Number(o.tc_amt || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar: Exact 1 to 25 Display */}
            <div className="p-4 border-t border-gray-100/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/30">
              <span className="text-xs md:text-sm font-semibold text-gray-500">
                Showing <strong className="text-gray-800">{totalOrders > 0 ? indexOfFirstRecord + 1 : 0}</strong> to <strong className="text-gray-800">{Math.min(indexOfLastRecord, totalOrders)}</strong> of <strong className="text-[#3db2a8]">{totalOrders.toLocaleString('en-IN')}</strong> records
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white/80 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs font-bold text-[#1a2b3c]">Page {currentPage}</span>
                  <span className="text-xs text-gray-400">/ {totalPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white/80 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* AI ORB MODAL */}
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