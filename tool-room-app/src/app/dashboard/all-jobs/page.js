'use client';
import Link from 'next/link';
import { useState, useRef, useEffect, Fragment } from 'react';

export default function AllJobsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [tempStatuses, setTempStatuses] = useState({});

  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [jobCards, setJobCards] = useState([
    { orderId: '#1045', customerName: 'Customer Company 1', date: '2026-08-30', status: 'In-Production', model: 'EN8 Gear', color: 'text-blue-600 bg-blue-50' },
    { orderId: '#1044', customerName: 'Customer Company 2', date: '2026-08-29', status: 'Completed', model: 'SS304 Pinion', color: 'text-green-600 bg-green-50' },
    { orderId: '#1043', customerName: 'Customer Company 3', date: '2026-08-28', status: 'Pending', model: 'EN8 Gear', color: 'text-orange-600 bg-orange-50' },
    { orderId: '#1042', customerName: 'Customer Company 4', date: '2026-08-27', status: 'Delivered', model: 'SS304 Pinion', color: 'text-purple-600 bg-purple-50' },
    { orderId: '#1041', customerName: 'Customer Company 5', date: '2026-08-26', status: 'In-Production', model: 'EN8 Gear', color: 'text-blue-600 bg-blue-50' },
    { orderId: '#1040', customerName: 'Customer Company 6', date: '2026-08-25', status: 'Completed', model: 'SS304 Pinion', color: 'text-green-600 bg-green-50' }
  ]);

  const filteredJobs = jobCards.filter(job => {
    const matchesSearch = 
      job.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleStatusSelect = (orderId, newStatus) => {
    setTempStatuses(prev => ({ ...prev, [orderId]: newStatus }));
  };

  const handleSaveStatus = (orderId) => {
    const newStatus = tempStatuses[orderId];
    if (!newStatus) return;
    let newColor = 'text-gray-600 bg-gray-50';
    if (newStatus === 'Pending') newColor = 'text-orange-600 bg-orange-50';
    if (newStatus === 'In-Production') newColor = 'text-blue-600 bg-blue-50';
    if (newStatus === 'Completed') newColor = 'text-green-600 bg-green-50';
    if (newStatus === 'Delivered') newColor = 'text-purple-600 bg-purple-50';

    setJobCards(prev => prev.map(job => {
      if (job.orderId === orderId) {
        return { ...job, status: newStatus, color: newColor };
      }
      return job;
    }));
    alert(`Order ${orderId} status updated successfully to ${newStatus}!`);
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      
      <style jsx>{`
        @keyframes pageFadeSlide { 
          from { opacity: 0; transform: translateY(20px) scale(0.98); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        .page-transition { 
          animation: pageFadeSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
      `}</style>
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-8">
          <span className="text-xl font-black text-[#1a2b3c] tracking-wider">
            RA-XIS<span className="text-[#3db2a8]">.</span>
          </span>
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <nav className="flex-1 px-5 py-6 space-y-3 overflow-y-auto">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap"
          >
            Dashboard
          </Link>
          <Link 
            href="/dashboard/new-customer" 
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap"
          >
            New Customer
          </Link>
          <Link 
            href="/dashboard/repeat-order" 
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap"
          >
            Repeat Order
          </Link>
          <Link 
            href="/dashboard/view-customer" 
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap"
          >
            View / Edit Customer
          </Link>
          <Link 
            href="/dashboard/report" 
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap"
          >
            Reports
          </Link>
        </nav>
        
        <div className="p-5">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-700 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(true)}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">All Job Cards Management</span>
          </div>

          <div className="flex items-center gap-4" ref={profileMenuRef}>
            <Link 
              href="/dashboard"
              className="bg-white/60 hover:bg-white text-[#1a2b3c] border border-gray-200 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all"
            >
              Back to Dashboard
            </Link>

            <div className="relative cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
              <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md">
                 <svg className="w-6 h-6 text-gray-600 mt-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>
            </div>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                  <p className="text-sm font-bold text-[#1a2b3c]">Nikhil</p>
                </div>
                <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-[#3db2a8]/10 hover:text-[#3db2a8]">Settings</Link>
                <div className="border-t border-gray-100 my-1"></div>
                <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">Logout</Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 page-transition">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1a2b3c] tracking-tight">All Job Cards (Recent 30)</h1>
              <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">Click any row to expand and instantly update its status.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Name, Model..." 
                className="bg-white/60 border border-white/80 rounded-xl px-4 py-2 text-xs w-full md:w-60 focus:outline-none focus:ring-2 focus:ring-[#3db2a8] shadow-sm" 
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/60 border border-white/80 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In-Production">In-Production</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.05)] border border-white/60 overflow-hidden p-6">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[850px]">
                 <thead className="text-gray-400 border-b border-gray-300/30">
                   <tr>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Order ID</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Customer Name</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Date</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Status</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Model / Material</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="text-gray-600 divide-y divide-gray-300/20">
                   {filteredJobs.length > 0 ? (
                     filteredJobs.map((job) => {
                       const isExpanded = expandedOrderId === job.orderId;
                       const currentStatus = tempStatuses[job.orderId] || job.status;

                       return (
                         <Fragment key={job.orderId}>
                           <tr 
                             onClick={() => setExpandedOrderId(isExpanded ? null : job.orderId)}
                             className="hover:bg-white/60 transition-colors cursor-pointer"
                           >
                             <td className="py-4 px-3 font-extrabold text-[#3db2a8]">{job.orderId}</td>
                             <td className="py-4 px-3 font-bold text-[#1a2b3c]">{job.customerName}</td>
                             <td className="py-4 px-3 font-medium text-gray-500">{job.date}</td>
                             <td className="py-4 px-3">
                               <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] md:text-[11px] font-bold tracking-wide ${job.color}`}>
                                 {job.status}
                               </span>
                             </td>
                             <td className="py-4 px-3 font-medium">{job.model}</td>
                             <td className="py-4 px-3 text-center">
                               <span className="text-xs font-bold text-[#3db2a8] underline">
                                 {isExpanded ? 'Close' : 'Update Status'}
                               </span>
                             </td>
                           </tr>

                           {isExpanded && (
                             <tr className="bg-[#f8fafc]">
                               <td colSpan="6" className="p-4 border-t border-gray-200">
                                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                                   <div className="flex items-center gap-3">
                                     <span className="text-xs font-bold text-gray-500 uppercase">Change Status for {job.orderId}:</span>
                                     <select 
                                       value={currentStatus}
                                       onChange={(e) => handleStatusSelect(job.orderId, e.target.value)}
                                       className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#1a2b3c] focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
                                     >
                                       <option value="Pending">Pending</option>
                                       <option value="In-Production">In-Production</option>
                                       <option value="Completed">Completed</option>
                                       <option value="Delivered">Delivered</option>
                                     </select>
                                   </div>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handleSaveStatus(job.orderId); }}
                                     className="bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs font-bold px-6 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                                   >
                                     Save Status
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           )}
                         </Fragment>
                       );
                     })
                   ) : (
                     <tr>
                       <td colSpan="6" className="py-8 text-center text-gray-400 font-semibold">
                         No job cards found matching your filter.
                       </td>
                     </tr>
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