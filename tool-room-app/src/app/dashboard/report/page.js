'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchReports();
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

  const fetchReports = async (from = '', to = '') => {
    try {
      setLoading(true);
      let query = supabase
        .from('job_cards')
        .select(`
          id,
          order_date,
          status,
          qty,
          od,
          nt,
          model,
          material_grade,
          gear_price,
          tc_amt,
          customers ( id, name, city )
        `)
        .order('order_date', { ascending: false });

      if (from) query = query.gte('order_date', from);
      if (to) query = query.lte('order_date', to);

      const { data, error } = await query;
      if (error) throw error;
      setReportsData(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReports(fromDate, toDate);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    // 2 seconds AI-Powered simulation
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In-Production': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Delivered': return 'bg-purple-50 text-purple-600 border border-purple-200';
      default: return 'bg-amber-50 text-amber-600 border border-amber-200';
    }
  };

  const totalGearAmt = reportsData.reduce((acc, curr) => acc + (parseFloat(curr.gear_price) || 0), 0);
  const totalTCAmt = reportsData.reduce((acc, curr) => acc + (parseFloat(curr.tc_amt) || 0), 0);
  const totalQty = reportsData.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0), 0);

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative print:bg-white print:overflow-visible">
      {/* CSS Styles */}
      <style jsx>{`
        /* Button Styles */
        .button {
          --black-700: hsla(0 0% 12% / 1);
          --border_radius: 9999px;
          --transtion: 0.3s ease-in-out;
          --offset: 2px;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transform-origin: center;
          padding: 0.75rem 1.6rem;
          background-color: transparent;
          border: none;
          border-radius: var(--border_radius);
          transform: scale(calc(1 + (var(--active, 0) * 0.1)));
          transition: transform var(--transtion);
        }

        .button::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background-color: var(--black-700);
          border-radius: var(--border_radius);
          box-shadow: inset 0 0.5px hsl(0, 0%, 100%), inset 0 -1px 2px 0 hsl(0, 0%, 0%),
            0px 4px 10px -4px hsla(0 0% 0% / calc(1 - var(--active, 0)));
          transition: all var(--transtion);
          z-index: 0;
        }

        .button:is(:hover, :focus-visible) {
          --active: 1;
        }
        .button:active {
          transform: scale(1);
        }

        .button .dots_border {
          --size_border: calc(100% + 2px);
          overflow: hidden;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: var(--size_border);
          height: var(--size_border);
          background-color: transparent;
          border-radius: var(--border_radius);
          z-index: -10;
        }

        .button .dots_border::before {
          content: "";
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          transform-origin: left;
          transform: rotate(0deg);
          width: 100%;
          height: 2rem;
          background-color: white;
          mask: linear-gradient(transparent 0%, white 120%);
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          to {
            transform: rotate(360deg);
          }
        }

        .button .sparkle {
          position: relative;
          z-index: 10;
          width: 1.5rem;
          height: 1.5rem;
        }

        .button .sparkle .path {
          fill: currentColor;
          stroke: currentColor;
          transform-origin: center;
          color: hsl(0, 0%, 100%);
        }

        .button:is(:hover, :focus) .sparkle .path {
          animation: path 1.5s linear 0.5s infinite;
        }

        .button .sparkle .path:nth-child(1) { --scale_path_1: 1.2; }
        .button .sparkle .path:nth-child(2) { --scale_path_2: 1.2; }
        .button .sparkle .path:nth-child(3) { --scale_path_3: 1.2; }

        @keyframes path {
          0%, 34%, 71%, 100% { transform: scale(1); }
          17% { transform: scale(var(--scale_path_1, 1)); }
          49% { transform: scale(var(--scale_path_2, 1)); }
          83% { transform: scale(var(--scale_path_3, 1)); }
        }

        .button .text_button {
          position: relative;
          z-index: 10;
          background-image: linear-gradient(
            90deg,
            hsla(0 0% 100% / 1) 0%,
            hsla(0 0% 100% / var(--active, 0)) 120%
          );
          background-clip: text;
          font-size: 0.85rem;
          font-weight: 700;
          color: transparent;
        }

        /* AI Loader Overlay Styles */
        .loader-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 190px;
          height: 190px;
          font-family: inherit;
          font-size: 1.1rem;
          font-weight: 600;
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
          animation: loader-letter-anim 1.8s infinite;
          z-index: 1;
        }

        .loader-letter:nth-child(1) { animation-delay: 0s; }
        .loader-letter:nth-child(2) { animation-delay: 0.08s; }
        .loader-letter:nth-child(3) { animation-delay: 0.16s; }
        .loader-letter:nth-child(4) { animation-delay: 0.24s; }
        .loader-letter:nth-child(5) { animation-delay: 0.32s; }
        .loader-letter:nth-child(6) { animation-delay: 0.40s; }
        .loader-letter:nth-child(7) { animation-delay: 0.48s; }
        .loader-letter:nth-child(8) { animation-delay: 0.56s; }
        .loader-letter:nth-child(9) { animation-delay: 0.64s; }
        .loader-letter:nth-child(10) { animation-delay: 0.72s; }
        .loader-letter:nth-child(11) { animation-delay: 0.80s; }
        .loader-letter:nth-child(12) { animation-delay: 0.88s; }
        .loader-letter:nth-child(13) { animation-delay: 0.96s; }

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

      {/* AI Loader Screen Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center print:hidden transition-all duration-300">
          <div className="loader-wrapper">
            <div className="loader"></div>
            <div className="flex tracking-wider z-10 font-bold drop-shadow-md">
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
          </div>
          <p className="text-white/80 text-xs font-semibold mt-6 tracking-wide animate-pulse">
            AI Engine preparing your PDF Report...
          </p>
        </div>
      )}

      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none print:hidden"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none print:hidden"></div>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-8">
          <span className="text-xl font-black text-[#1a2b3c] tracking-wider">RA-XIS<span className="text-[#3db2a8]">.</span></span>
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-5 py-6 space-y-3 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Dashboard</Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">New Customer</Link>
          <Link href="/dashboard/repeat-order" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Repeat Order</Link>
          <Link href="/dashboard/view-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">View / Edit Customer</Link>
          <Link href="/dashboard/report" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            Reports
          </Link>
        </nav>
        <div className="p-5">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">Logout</Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative print:overflow-visible">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50 print:hidden">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-700 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(true)}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">Production Reports & Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="flex items-center cursor-pointer group p-1" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-gray-600 mt-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                    <p className="text-sm font-bold text-[#1a2b3c]">Nikhil</p>
                  </div>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#3db2a8]">Settings</Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 print:p-0 print:overflow-visible">
          {/* Header Title & Animated Uiverse Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1a2b3c] tracking-tight">Date-wise Reports</h1>
              <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">Generate and export production summaries based on dates.</p>
            </div>

            {/* Original Uiverse Animated Button */}
            <div className="print:hidden">
              <button onClick={handleExportPDF} className="button" disabled={isExporting}>
                <div className="dots_border"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="sparkle"
                >
                  <path
                    className="path"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  ></path>
                </svg>
                <span className="text_button">{isExporting ? 'Generating...' : 'Export PDF / Print'}</span>
              </button>
            </div>
          </div>

          {/* Date Filter Bar */}
          <form onSubmit={handleFilter} className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-end gap-4 text-xs print:hidden">
            <div className="flex-1 w-full">
              <label className="block font-bold text-gray-500 mb-2 uppercase text-[10px]">FROM DATE</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block font-bold text-gray-500 mb-2 uppercase text-[10px]">TO DATE</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="submit"
                className="flex-1 md:flex-none px-8 py-3 bg-[#3db2a8] hover:bg-[#359d94] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Filter Report
              </button>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate(''); fetchReports('', ''); }}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/60 text-center">
              <span className="text-xl font-black text-[#1a2b3c]">{reportsData.length}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Total Orders</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/60 text-center">
              <span className="text-xl font-black text-[#1a2b3c]">{totalQty}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Total Qty (Pcs)</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/60 text-center">
              <span className="text-xl font-black text-[#3db2a8]">₹{totalGearAmt.toLocaleString('en-IN')}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Total Gear Amt</p>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/60 text-center">
              <span className="text-xl font-black text-emerald-700">₹{totalTCAmt.toLocaleString('en-IN')}</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Total TC Amt</p>
            </div>
          </div>

          {/* Report Data Table */}
          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-sm overflow-hidden print:bg-white print:border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/30 border-b border-white/50 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Job ID</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Model / Details</th>
                    <th className="py-4 px-6 text-center">QTY</th>
                    <th className="py-4 px-6 text-right">Gear Price</th>
                    <th className="py-4 px-6 text-right">TC Amt</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 print:divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-8 text-gray-500 font-medium">Generating reports...</td></tr>
                  ) : reportsData.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-8 text-gray-500 font-medium">No records found for selected period.</td></tr>
                  ) : (
                    reportsData.map((row) => (
                      <tr key={row.id} className="hover:bg-white/30 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-gray-500">{row.order_date}</td>
                        <td className="py-3.5 px-6 font-bold text-[#3db2a8]">#{row.id}</td>
                        <td className="py-3.5 px-6 font-bold text-[#1a2b3c]">{row.customers?.name || 'Customer Deleted'}</td>
                        <td className="py-3.5 px-6 text-gray-600">{row.model || '—'} {row.od ? `(OD: ${row.od})` : ''}</td>
                        <td className="py-3.5 px-6 text-center font-bold text-gray-700">{row.qty || '—'}</td>
                        <td className="py-3.5 px-6 text-right font-bold text-gray-800">{row.gear_price ? `₹${Number(row.gear_price).toLocaleString('en-IN')}` : '—'}</td>
                        <td className="py-3.5 px-6 text-right font-bold text-emerald-700">{row.tc_amt ? `₹${Number(row.tc_amt).toLocaleString('en-IN')}` : '—'}</td>
                        <td className="py-3.5 px-6 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(row.status)}`}>
                            {row.status}
                          </span>
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
    </div>
  );
}