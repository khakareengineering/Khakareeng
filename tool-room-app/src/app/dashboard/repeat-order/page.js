'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function RepeatOrderPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Search & Customer State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // File uploads state
  const [photos, setPhotos] = useState([]);
  const [drawings, setDrawings] = useState([]);

  // Form specs state
  const [orderStatus, setOrderStatus] = useState('Pending');
  const [qty, setQty] = useState('');
  const [od, setOd] = useState('');
  const [nt, setNt] = useState('');
  const [model, setModel] = useState('');
  const [angle, setAngle] = useState('');
  const [root, setRoot] = useState('');
  const [thickness, setThickness] = useState('');
  const [length, setLength] = useState('');
  const [boreKeyway, setBoreKeyway] = useState('');
  const [materialGrade, setMaterialGrade] = useState('');
  const [hardness, setHardness] = useState('');
  const [price, setPrice] = useState('');
  const [remarks, setRemarks] = useState('');

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

  // Demo existing customer database for searching
  const existingCustomers = [
    { id: '#1045', name: 'Rahul Industries', contact: '9876543210', city: 'Pune' },
    { id: '#1044', name: 'Apex Engineering', contact: '9123456789', city: 'Mumbai' },
    { id: '#1043', name: 'Sai Tools Ltd.', contact: '9988776655', city: 'Nashik' },
    { id: '#1042', name: 'Precision Gears', contact: '9765432109', city: 'Nagpur' }
  ];

  const filteredCustomers = searchTerm.trim() === '' ? [] : existingCustomers.filter(c =>
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side image compression handler
  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/webp', 0.7);

          if (type === 'photos') {
            setPhotos((prev) => [...prev, compressedDataUrl]);
          } else {
            setDrawings((prev) => [...prev, compressedDataUrl]);
          }
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveOrder = (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please search and select a customer first!');
      return;
    }
    alert(`Repeat Order successfully added for ${selectedCustomer.name} (${selectedCustomer.id})!`);
    router.push('/dashboard/view-customer');
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar with Repeat Order option */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-8">
          <span className="text-xl font-black text-[#1a2b3c] tracking-wider">RA-XIS<span className="text-[#3db2a8]">.</span></span>
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <nav className="flex-1 px-5 py-6 space-y-3 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            New Customer
          </Link>
          {/* Active Repeat Order Link */}
          <Link href="/dashboard/repeat-order" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            Repeat Order
          </Link>
          <Link href="/dashboard/view-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            View / Edit Customer
          </Link>
          <Link href="/dashboard/report" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            Reports
          </Link>
        </nav>
        
        <div className="p-5">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-700 hover:text-[#3db2a8] focus:outline-none" onClick={() => setIsMobileMenuOpen(true)}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">Quick Order Management</span>
          </div>

          <div className="relative" ref={profileMenuRef}>
            <div className="flex items-center cursor-pointer group p-1" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
              <div className="relative w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <div className="absolute inset-0 rounded-full overflow-hidden p-[1.5px]">
                  <div className="w-full h-full rounded-full border-[2px] border-transparent border-t-[#3db2a8] border-r-[#3db2a8]/40 animate-spin"></div>
                </div>
                <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md z-10">
                   <svg className="w-6 h-6 text-gray-600 mt-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>
              </div>
            </div>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                  <p className="text-sm font-bold text-[#1a2b3c]">Nikhil</p>
                </div>
                <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-[#3db2a8]/10 hover:text-[#3db2a8]">
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">
                  Logout
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto mb-6">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1a2b3c] tracking-tight">Create Repeat Order</h1>
            <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">Search existing customer by ID or Name and add a new gear order instantly.</p>
          </div>

          <form onSubmit={handleSaveOrder} className="max-w-4xl mx-auto space-y-6 pb-12">
            
            {/* Step 1: Search Customer */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2rem] shadow-sm border border-white/60 relative">
              <h2 className="text-[14px] font-extrabold text-[#1a2b3c] mb-3">1. Select Existing Customer</h2>
              
              {selectedCustomer ? (
                <div className="bg-white/80 border border-[#3db2a8] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#3db2a8]">{selectedCustomer.id}</span>
                    <h3 className="text-sm font-black text-[#1a2b3c]">{selectedCustomer.name}</h3>
                    <p className="text-xs text-gray-500">Contact: {selectedCustomer.contact} | City: {selectedCustomer.city}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedCustomer(null)}
                    className="bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-500 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Change Customer
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type Customer ID (e.g. #1045) or Name (e.g. Rahul)..."
                    className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
                  />
                  {filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white py-2 z-30">
                      {filteredCustomers.map(cust => (
                        <div 
                          key={cust.id}
                          onClick={() => { setSelectedCustomer(cust); setSearchTerm(''); }}
                          className="px-4 py-2.5 hover:bg-[#3db2a8]/10 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-[#3db2a8] mr-2">{cust.id}</span>
                            <span className="text-xs font-extrabold text-[#1a2b3c]">{cust.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{cust.city}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Gear Specifications & Status */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-300/30">
                <h2 className="text-[14px] font-extrabold text-[#1a2b3c]">2. Gear Specifications & Status</h2>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Status:</label>
                  <select 
                    value={orderStatus} 
                    onChange={(e) => setOrderStatus(e.target.value)} 
                    className="bg-white/60 border border-white/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In-Production">In-Production</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Qty</label><input type="text" value={qty} onChange={(e) => setQty(e.target.value)} required className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 5" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">OD</label><input type="text" value={od} onChange={(e) => setOd(e.target.value)} required className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 45mm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">NT</label><input type="text" value={nt} onChange={(e) => setNt(e.target.value)} required className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 24" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Model</label><input type="text" value={model} onChange={(e) => setModel(e.target.value)} required className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. EN8 Gear" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Angle</label><input type="text" value={angle} onChange={(e) => setAngle(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 20°" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Root</label><input type="text" value={root} onChange={(e) => setRoot(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 2mm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Thickness</label><input type="text" value={thickness} onChange={(e) => setThickness(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 15mm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Length</label><input type="text" value={length} onChange={(e) => setLength(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 100mm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Bore Keyway</label><input type="text" value={boreKeyway} onChange={(e) => setBoreKeyway(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 20mm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Material Grade</label><input type="text" value={materialGrade} onChange={(e) => setMaterialGrade(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. EN8" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Hardness</label><input type="text" value={hardness} onChange={(e) => setHardness(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2" placeholder="e.g. 30 HRC" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Gear Price</label><input type="text" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full bg-white/60 border border-white/80 rounded-xl px-3 py-2 font-bold text-[#3db2a8]" placeholder="₹ Total Amount" /></div>
              </div>
            </div>

            {/* Step 3: Uploads & Remarks */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60">
              <h2 className="text-[14px] font-extrabold text-[#1a2b3c] mb-6 pb-3 border-b border-gray-300/30">3. Uploads & Remarks (Auto Compressed)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <label className="border-2 border-dashed border-gray-300/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/20 hover:bg-white/40 transition-colors cursor-pointer text-center">
                  <span className="text-[13px] font-bold text-[#1a2b3c]">Upload Photos (Multiple)</span>
                  <p className="text-[11px] text-gray-500 mt-1">{photos.length} photos selected</p>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'photos')} className="hidden" />
                </label>

                <label className="border-2 border-dashed border-gray-300/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/20 hover:bg-white/40 transition-colors cursor-pointer text-center">
                  <span className="text-[13px] font-bold text-[#1a2b3c]">Upload Drawings (Multiple)</span>
                  <p className="text-[11px] text-gray-500 mt-1">{drawings.length} drawings selected</p>
                  <input type="file" accept="image/*,.pdf" multiple onChange={(e) => handleFileUpload(e, 'drawings')} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">Remarks / Instructions</label>
                <textarea rows="2" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-xs" placeholder="Add any special instructions..."></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => router.push('/dashboard')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-6 py-3 rounded-xl cursor-pointer transition-all">
                Cancel
              </button>
              <button type="submit" className="bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs font-bold px-8 py-3 rounded-xl shadow-md cursor-pointer transition-all">
                Save Repeat Order
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}