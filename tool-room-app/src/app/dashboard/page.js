'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('This Month');
  
  // View Orders Modal State
  const [isViewOrdersModalOpen, setIsViewOrdersModalOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilterType, setOrderFilterType] = useState('All');
  const [expandedOrderKey, setExpandedOrderKey] = useState(null);

  const [customersData, setCustomersData] = useState([
    {
      customerId: '#1045',
      customerName: 'Rahul Industries',
      city: 'Pune',
      orders: [
        { orderId: '#2045', date: '2026-08-30', model: 'EN8 Gear', qty: '9 Pcs', status: 'In-Production', color: 'text-blue-600 bg-blue-50' },
        { orderId: '#2012', date: '2026-07-15', model: 'Helical Pinion', qty: '5 Pcs', status: 'Delivered', color: 'text-purple-600 bg-purple-50' },
        { orderId: '#1980', date: '2026-06-10', model: 'Spur Gear', qty: '12 Pcs', status: 'Completed', color: 'text-green-600 bg-green-50' },
        { orderId: '#1920', date: '2026-05-01', model: 'Bevel Gear', qty: '3 Pcs', status: 'Pending', color: 'text-orange-600 bg-orange-50' }
      ]
    },
    {
      customerId: '#1044',
      customerName: 'Apex Engineering',
      city: 'Mumbai',
      orders: [
        { orderId: '#2044', date: '2026-08-28', model: 'SS304 Pinion', qty: '8 Pcs', status: 'Completed', color: 'text-green-600 bg-green-50' }
      ]
    }
  ]);

  const [tempOrderStatuses, setTempOrderStatuses] = useState({});
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

  let flattenedOrders = [];
  customersData.forEach(cust => {
    cust.orders.forEach(ord => {
      flattenedOrders.push({ ...ord, customerId: cust.customerId, customerName: cust.customerName, city: cust.city });
    });
  });

  const filteredModalOrders = flattenedOrders.filter(order => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.model.toLowerCase().includes(orderSearchQuery.toLowerCase());
    const matchesStatus = orderFilterType === 'All' || order.status === orderFilterType;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleOrderStatusSelection = (orderId, newStatus) => {
    setTempOrderStatuses(prev => ({ ...prev, [orderId]: newStatus }));
  };

  const handleSaveAllOrderStatuses = () => {
    setCustomersData(prevCustomers => 
      prevCustomers.map(cust => ({
        ...cust,
        orders: cust.orders.map(ord => {
          const updatedStatus = tempOrderStatuses[ord.orderId];
          if (!updatedStatus) return ord;
          let newColor = 'text-gray-600 bg-gray-50';
          if (updatedStatus === 'Pending') newColor = 'text-orange-600 bg-orange-50';
          if (updatedStatus === 'In-Production') newColor = 'text-blue-600 bg-blue-50';
          if (updatedStatus === 'Completed') newColor = 'text-green-600 bg-green-50';
          if (updatedStatus === 'Delivered') newColor = 'text-purple-600 bg-purple-50';
          return { ...ord, status: updatedStatus, color: newColor };
        })
      }))
    );
    setTempOrderStatuses({});
    alert('Order Status updated successfully!');
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      
      {/* Page Animation */}
      <style jsx>{`
        @keyframes pageFadeSlide { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .page-transition { animation: pageFadeSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Background Blobs */}
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
              <div className="flex items-center cursor-pointer group p-1" onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsFilterOpen(false); }}>
                <div className="relative w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <div className="absolute inset-0 rounded-full overflow-hidden p-[1.5px]"><div className="w-full h-full rounded-full border-[2px] border-transparent border-t-[#3db2a8] border-r-[#3db2a8]/40 animate-spin"></div></div>
                  <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md z-10"><svg className="w-6 h-6 text-gray-600 mt-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg></div>
                </div>
              </div>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100"><p className="text-xs text-gray-400 font-semibold">Logged in as</p><p className="text-sm font-bold text-[#1a2b3c]">Nikhil</p></div>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-[#3db2a8]/10 hover:text-[#3db2a8]">Settings</Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 page-transition">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 relative z-30 gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a2b3c] tracking-tight">Hello, Nikhil</h1>
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
              <button onClick={() => { setIsViewOrdersModalOpen(true); setExpandedOrderKey(null); }} className="bg-[#1a2b3c] hover:bg-[#2c4055] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2">
                <svg className="w-4 h-4 text-[#3db2a8]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                View Orders
              </button>
              <Link href="/dashboard/repeat-order" className="bg-[#3db2a8] hover:bg-[#359d94] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                Repeat Order
              </Link>
              <div className="relative">
                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-white/80 shadow-sm rounded-xl px-4 py-2.5 text-[11px] md:text-xs font-bold text-gray-700 hover:bg-white transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {selectedFilter}
                  <svg className="w-3.5 h-3.5 ml-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur-2xl rounded-xl shadow-xl border border-white/80 py-1.5 z-50">
                    {['This Week', 'This Month', 'This Year'].map(filter => (
                      <button key={filter} onClick={() => { setSelectedFilter(filter); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#3db2a8]/10 hover:text-[#3db2a8] transition-colors ${selectedFilter === filter ? 'text-[#3db2a8] font-bold bg-[#3db2a8]/5' : 'text-gray-600'}`}>{filter}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
             <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.03)] border border-white/60 flex flex-col justify-center gap-2 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between w-full"><p className="text-3xl md:text-4xl font-black text-[#3db2a8]">124</p><p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Jobs</p></div>
             </div>
             <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.03)] border border-white/60 flex flex-col justify-center gap-2 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between w-full"><p className="text-3xl md:text-4xl font-black text-[#3db2a8]">18</p><p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">In-Production</p></div>
             </div>
             <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.03)] border border-white/60 flex flex-col justify-center gap-2 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between w-full"><p className="text-3xl md:text-4xl font-black text-[#3db2a8]">96</p><p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completed</p></div>
             </div>
             <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.03)] border border-white/60 flex flex-col justify-center gap-2 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between w-full"><p className="text-3xl md:text-4xl font-black text-[#3db2a8]">45</p><p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customers</p></div>
             </div>
          </div>

          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.05)] border border-white/60 p-6 md:p-8 mb-6 md:mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-[#1a2b3c] text-[14px] md:text-[15px]">Recent Job Cards</h3>
              <Link href="/dashboard/all-jobs" className="text-xs text-[#3db2a8] font-bold hover:underline transition-all">View All</Link>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[600px]">
                 <thead className="text-gray-400 border-b border-gray-300/30">
                   <tr>
                     <th className="pb-3 md:pb-4 font-bold text-xs tracking-wide">Order ID</th>
                     <th className="pb-3 md:pb-4 font-bold text-xs tracking-wide">Customer Name</th>
                     <th className="pb-3 md:pb-4 font-bold text-xs tracking-wide">Status</th>
                     <th className="pb-3 md:pb-4 font-bold text-xs tracking-wide">Model / Material</th>
                   </tr>
                 </thead>
                 <tbody className="text-gray-600 divide-y divide-gray-300/20">
                   {filteredModalOrders.slice(0, 4).map(order => (
                     <tr key={order.orderId} className="hover:bg-white/30 transition-colors">
                       <td className="py-4 font-extrabold text-[#1a2b3c] text-[12px] md:text-[13px]">{order.orderId}</td>
                       <td className="py-4 font-bold text-[12px] md:text-[13px]">{order.customerName}</td>
                       <td className="py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] md:text-[11px] font-bold tracking-wide ${order.color}`}>{order.status}</span></td>
                       <td className="py-4 font-extrabold text-[#1a2b3c] text-[12px] md:text-[13px]">{order.model}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>

          {/* Job Growth */}
          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.05)] border border-white/60 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between mb-8">
             <div className="flex flex-col items-center gap-2 px-8 mb-6 md:mb-0">
                <svg className="w-8 h-8 text-[#3db2a8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                <span className="font-extrabold text-[#1a2b3c] text-[14px] mt-1">Job Growth</span>
             </div>
             <div className="flex-1 flex justify-around md:border-l border-gray-300/30 px-2 md:px-6 w-full">
                <div className="text-center">
                   <p className="text-[28px] font-black text-[#3db2a8] flex items-center justify-center gap-1">11 <span className="text-[10px] text-green-600 flex items-center bg-green-100/60 px-1 py-0.5 rounded">6%</span></p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Weekly</p>
                </div>
                <div className="w-px bg-gray-300/30 hidden md:block"></div>
                <div className="text-center">
                   <p className="text-[28px] font-black text-[#f87171] flex items-center justify-center gap-1">32 <span className="text-[10px] text-red-500 flex items-center bg-red-100/60 px-1 py-0.5 rounded">4%</span></p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Monthly</p>
                </div>
                <div className="w-px bg-gray-300/30 hidden md:block"></div>
                <div className="text-center">
                   <p className="text-[28px] font-black text-[#3db2a8] flex items-center justify-center gap-1">973 <span className="text-[10px] text-green-600 flex items-center bg-green-100/60 px-1 py-0.5 rounded">12%</span></p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Yearly</p>
                </div>
             </div>
          </div>
        </main>
      </div>

      {/* VIEW ORDERS MODAL */}
      {isViewOrdersModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 sticky top-0 bg-white/90 backdrop-blur-md z-10 pt-2 px-2">
              <div>
                <h3 className="text-xl font-black text-[#1a2b3c]">View & Manage Orders</h3>
                <p className="text-xs text-gray-500 font-medium">Click any order to update status.</p>
              </div>
              <button onClick={() => setIsViewOrdersModalOpen(false)} className="w-9 h-9 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-500 rounded-full font-bold">✕</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6 px-2">
              <input type="text" value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} placeholder="Search..." className="flex-1 bg-white/70 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" />
              <select value={orderFilterType} onChange={(e) => setOrderFilterType(e.target.value)} className="bg-white/70 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3db2a8]">
                <option value="All">All Status</option><option value="Pending">Pending</option><option value="In-Production">In-Production</option><option value="Completed">Completed</option><option value="Delivered">Delivered</option>
              </select>
            </div>
            <div className="space-y-3 px-2 max-h-[45vh] overflow-y-auto pr-1">
              {filteredModalOrders.map(order => {
                const isExpanded = expandedOrderKey === order.orderId;
                const currentSelectedStatus = tempOrderStatuses[order.orderId] || order.status;
                return (
                  <div key={order.orderId} className="bg-white/80 border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
                    <div onClick={() => setExpandedOrderKey(isExpanded ? null : order.orderId)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-[#3db2a8]">{order.orderId}</span>
                        <div><span className="text-[11px] font-bold text-gray-400">{order.date}</span><p className="text-sm font-extrabold text-[#1a2b3c]">{order.customerName} <span className="text-xs text-gray-500 font-normal">({order.model} - {order.qty})</span></p></div>
                      </div>
                      <div className="flex items-center gap-3"><span className={`text-xs font-bold px-3 py-1 rounded-md ${order.color}`}>{order.status}</span></div>
                    </div>
                    {isExpanded && (
                      <div className="bg-[#f8fafc] border-t border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-extrabold text-gray-500 uppercase block mb-1">Update Status:</span>
                          <select value={currentSelectedStatus} onChange={(e) => handleOrderStatusSelection(order.orderId, e.target.value)} className="bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1a2b3c] focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"><option value="Pending">Pending</option><option value="In-Production">In-Production</option><option value="Completed">Completed</option><option value="Delivered">Delivered</option></select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3 px-2 pt-3 border-t border-gray-200">
              <button onClick={() => setIsViewOrdersModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-xl">Cancel</button>
              <button onClick={handleSaveAllOrderStatuses} className="bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs font-bold px-7 py-2.5 rounded-xl shadow-md">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}