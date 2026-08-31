'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function ReportsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setIsProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      <style jsx>{`
        @keyframes pageFadeSlide { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .page-transition { animation: pageFadeSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-8">
          <span className="text-xl font-black text-[#1a2b3c] tracking-wider">RA-XIS<span className="text-[#3db2a8]">.</span></span>
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <nav className="flex-1 px-5 py-6 space-y-3 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Dashboard</Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">New Customer</Link>
          <Link href="/dashboard/repeat-order" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Repeat Order</Link>
          <Link href="/dashboard/view-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">View / Edit Customer</Link>
          <Link href="/dashboard/report" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap"><div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>Reports</Link>
        </nav>
        <div className="p-5"><Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">Logout</Link></div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-700 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(true)}><svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">Production Reports & Analytics</span>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 page-transition">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1a2b3c] tracking-tight">Date-wise Reports</h1>
              <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">Generate and export production summaries based on dates.</p>
            </div>
            <button className="bg-[#1a2b3c] hover:bg-[#2c4055] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all">Export PDF</button>
          </div>

          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-white/60 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div><label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">From Date</label><input type="date" className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" /></div>
              <div><label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">To Date</label><input type="date" className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" /></div>
              <div><button className="w-full bg-[#3db2a8] hover:bg-[#359d94] text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all">Filter Report</button></div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-white/60 overflow-hidden p-6">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[800px]">
                 <thead className="text-gray-400 border-b border-gray-300/30">
                   <tr>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Date</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Job ID</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Customer</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Model / Details</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Qty</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Status</th>
                   </tr>
                 </thead>
                 <tbody className="text-gray-600 divide-y divide-gray-300/20">
                   <tr className="hover:bg-white/40 transition-colors">
                     <td className="py-4 px-3 font-medium">Aug 30, 2026</td>
                     <td className="py-4 px-3 font-extrabold text-[#3db2a8]">#1045</td>
                     <td className="py-4 px-3 font-bold text-[#1a2b3c]">Rahul Industries</td>
                     <td className="py-4 px-3 font-medium">EN8 Gear, OD: 45mm</td>
                     <td className="py-4 px-3 font-bold">12</td>
                     <td className="py-4 px-3"><span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide text-blue-600 bg-blue-50">In-Production</span></td>
                   </tr>
                 </tbody>
               </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}