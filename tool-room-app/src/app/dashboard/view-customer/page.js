'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function ViewCustomerPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewCustomer, setViewCustomer] = useState(null); 
  const [editCustomer, setEditCustomer] = useState(null); 
  const [expandedOrderId, setExpandedOrderId] = useState(null); 

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

  const generateRandomHistory = (count) => {
    const models = ['EN8 Gear', 'SS304 Pinion', 'Helical Gear', 'Bevel Gear', 'Spur Gear', 'MS Bracket'];
    const statuses = [
      { label: 'Completed', color: 'text-green-600 bg-green-50' },
      { label: 'Delivered', color: 'text-purple-600 bg-purple-50' },
      { label: 'In-Production', color: 'text-blue-600 bg-blue-50' },
      { label: 'Pending', color: 'text-orange-600 bg-orange-50' }
    ];
    let historyList = [];
    for (let i = 1; i <= count; i++) {
      const randModel = models[i % models.length];
      const randStatus = statuses[i % statuses.length];
      const randomPrice = (i * 2500 + 12000); 
      const randomDay = (i * 3) % 28 + 1;
      const randomMonth = (i % 8) + 1;
      historyList.push({
        orderId: `#${2000 + i}`,
        date: `2026-0${randomMonth > 9 ? '9' : randomMonth}-${randomDay > 9 ? randomDay : '0' + randomDay}`,
        model: randModel,
        status: randStatus.label,
        color: randStatus.color,
        qty: `${(i % 9) + 1}`,
        od: `${40 + (i * 2)}mm`,
        nt: `${20 + i}`,
        angle: `${15 + (i % 10)}°`,
        root: `${1 + (i % 3)}mm`,
        thickness: `${12 + (i % 10)}mm`,
        length: `${100 + (i * 4)}mm`,
        boreKeyway: `${18 + (i % 8)}mm`,
        materialGrade: i % 2 === 0 ? 'EN8' : 'SS304',
        hardness: `${35 + (i % 15)} HRC`,
        price: `₹${randomPrice.toLocaleString()}`
      });
    }
    return historyList.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const [customers, setCustomers] = useState([
    { id: '#1045', name: 'Rahul Industries', contact: '9876543210', city: 'Pune', date: '2026-08-30', address: 'MIDC, Pune', status: 'In-Production', color: 'text-blue-600 bg-blue-50', qty: '9', od: '141mm', nt: '52', model: 'SS304 Pinion', angle: '22°', root: '2mm', thickness: '17mm', length: '265mm', boreKeyway: '22mm', materialGrade: 'SS304', hardness: '47 HRC', price: '₹47,900', remarks: 'Precision required', history: generateRandomHistory(6) },
    { id: '#1044', name: 'Apex Engineering', contact: '9123456789', city: 'Mumbai', date: '2026-08-28', address: 'Andheri, Mumbai', status: 'Completed', color: 'text-green-600 bg-green-50', qty: '8', od: '60mm', nt: '30', model: 'SS304 Pinion', angle: '15°', root: '1.5mm', thickness: '20mm', length: '120mm', boreKeyway: '25mm', materialGrade: 'SS304', hardness: '35 HRC', price: '₹18,000', remarks: 'SS finishing', history: generateRandomHistory(4) }
  ]);

  const filteredCustomers = customers.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact.includes(searchQuery)
  );

  const handleFullEditSave = (e) => {
    e.preventDefault();
    setCustomers(customers.map(c => c.id === editCustomer.id ? editCustomer : c));
    setEditCustomer(null);
    alert('Job Card updated successfully!');
  };

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
          <Link href="/dashboard/view-customer" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap"><div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>View / Edit Customer</Link>
          <Link href="/dashboard/report" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Reports</Link>
        </nav>
        <div className="p-5"><Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">Logout</Link></div>
      </aside>

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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 page-transition">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1a2b3c] tracking-tight">Customer Database</h1>
              <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">Search, view sorted gear history, and update complete job cards.</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search ID, Name, Model, City..." className="bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 text-[12px] w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-[#3db2a8] shadow-sm" />
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,41,55,0.05)] border border-white/60 overflow-hidden p-6">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[950px]">
                 <thead className="text-gray-400 border-b border-gray-300/30">
                   <tr>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Customer ID ↕</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Customer Name ↕</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Model / Material</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Gear Price</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Contact</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">City</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Date</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider">Status</th>
                     <th className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="text-gray-600 divide-y divide-gray-300/20">
                   {filteredCustomers.length > 0 ? filteredCustomers.map((cust) => (
                     <tr key={cust.id} className="hover:bg-white/40 transition-colors">
                       <td onClick={() => { setViewCustomer(cust); setExpandedOrderId(null); }} className="py-4 px-3 font-extrabold text-[#3db2a8] cursor-pointer hover:underline">{cust.id}</td>
                       <td onClick={() => { setViewCustomer(cust); setExpandedOrderId(null); }} className="py-4 px-3 font-bold text-[#1a2b3c] cursor-pointer hover:underline">{cust.name}</td>
                       <td className="py-4 px-3 font-medium">{cust.model}</td>
                       <td className="py-4 px-3 font-extrabold text-[#1a2b3c]">{cust.price}</td>
                       <td className="py-4 px-3 font-medium">{cust.contact}</td>
                       <td className="py-4 px-3 font-medium">{cust.city}</td>
                       <td className="py-4 px-3 font-medium">{cust.date}</td>
                       <td className="py-4 px-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] md:text-[11px] font-bold tracking-wide ${cust.color}`}>{cust.status}</span></td>
                       <td className="py-4 px-3 text-center"><button onClick={() => setEditCustomer(cust)} className="bg-white/60 hover:bg-white text-[#1a2b3c] border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all">Edit</button></td>
                     </tr>
                   )) : <tr><td colSpan="9" className="py-8 text-center text-gray-400 font-semibold">No matching records.</td></tr>}
                 </tbody>
               </table>
            </div>
          </div>
        </main>
      </div>

      {viewCustomer && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 sticky top-0 bg-white/90 backdrop-blur-md z-10 pt-2 px-2">
              <div>
                <h3 className="text-xl font-black text-[#1a2b3c]">{viewCustomer.name}</h3>
                <p className="text-xs text-gray-500 font-medium">Customer ID: {viewCustomer.id} | City: {viewCustomer.city} | Orders: {viewCustomer.history.length}</p>
              </div>
              <button onClick={() => setViewCustomer(null)} className="w-9 h-9 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-500 rounded-full font-bold">✕</button>
            </div>
            <h4 className="text-sm font-bold text-[#3db2a8] uppercase tracking-wider mb-3 px-2">Complete Order History</h4>
            <div className="space-y-3 px-2 max-h-[50vh] overflow-y-auto pr-2">
              {viewCustomer.history.map((order, idx) => {
                const isExpanded = expandedOrderId === order.orderId;
                return (
                  <div key={idx} className="bg-white/70 border border-gray-200 rounded-2xl overflow-hidden shadow-xs transition-all">
                    <div onClick={() => setExpandedOrderId(isExpanded ? null : order.orderId)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-gray-400">{order.orderId}</span>
                        <div><span className="text-xs font-bold text-gray-400">{order.date}</span><p className="text-sm font-extrabold text-[#1a2b3c]">{order.model} <span className="text-xs text-gray-500">({order.qty} Pcs)</span></p></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right"><span className="text-sm font-black text-[#3db2a8] block">{order.price}</span></div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${order.color}`}>{order.status}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="bg-[#f8fafc] border-t border-gray-200 p-4">
                        <h5 className="text-[11px] font-extrabold text-[#1a2b3c] uppercase mb-3">Specifications</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          {['QTY', 'OD', 'NT', 'ANGLE'].map(s => <div key={s} className="bg-white p-2.5 rounded-xl border border-gray-100"><span className="text-gray-400 block text-[10px] font-bold">{s}</span><span className="font-extrabold">{order[s.toLowerCase()] || order.qty}</span></div>)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end px-2"><button onClick={() => setViewCustomer(null)} className="bg-[#1a2b3c] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md hover:bg-[#2c4055]">Close History</button></div>
          </div>
        </div>
      )}

      {editCustomer && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 sticky top-0 bg-white/90 backdrop-blur-md z-10 pt-2 px-2">
              <h3 className="text-xl font-black text-[#1a2b3c]">Edit Job Card: {editCustomer.id}</h3>
              <button onClick={() => setEditCustomer(null)} className="w-9 h-9 bg-gray-100 text-gray-600 hover:text-red-500 rounded-full font-bold">✕</button>
            </div>
            <form onSubmit={handleFullEditSave} className="space-y-6 px-2">
              <div className="bg-white/60 border border-gray-200 rounded-2xl p-5">
                <h4 className="text-sm font-extrabold text-[#1a2b3c] mb-4 pb-2 border-b border-gray-200">Customer Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-bold text-gray-500 mb-1">Name</label><input type="text" value={editCustomer.name} onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs" required /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 mb-1">City</label><input type="text" value={editCustomer.city} onChange={(e) => setEditCustomer({...editCustomer, city: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs" required /></div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3 pb-4">
                <button type="button" onClick={() => setEditCustomer(null)} className="bg-gray-100 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-xl">Cancel</button>
                <button type="submit" className="bg-[#3db2a8] text-white text-xs font-bold px-7 py-2.5 rounded-xl shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}