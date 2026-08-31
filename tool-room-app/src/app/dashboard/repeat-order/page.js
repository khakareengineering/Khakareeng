'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFileToBucket } from '@/lib/storage';

export default function RepeatOrderPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Autocomplete / Selection
  const [customersList, setCustomersList] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  // Job Card State
  const [status, setStatus] = useState('Pending');
  const [specs, setSpecs] = useState({
    qty: '',
    od: '',
    nt: '',
    model: '',
    angle: '',
    root: '',
    thickness: '',
    length: '',
    bore_keyway: '',
    material_grade: '',
    hardness: '',
    gear_price: '',
    tc_amt: ''
  });
  const [remarks, setRemarks] = useState('');

  // Files State
  const [photoFiles, setPhotoFiles] = useState([]);
  const [drawingFiles, setDrawingFiles] = useState([]);

  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchCustomers();
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, city, contact_no')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomersList(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err.message);
    }
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (type === 'photos') {
      setPhotoFiles((prev) => [...prev, ...files]);
    } else {
      setDrawingFiles((prev) => [...prev, ...files]);
    }
  };

  const filteredCustomers = customerSearch.trim() === '' ? [] : customersList.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.id.toString().includes(customerSearch) ||
    c.city?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSelectCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setSelectedCustomerName(`${c.name} (#${c.id}) - ${c.city || ''}`);
    setCustomerSearch('');
  };

  const handleSaveRepeatOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('कृपया आधी Existing Customer निवडा!');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload media files
      const photoUrls = [];
      for (const file of photoFiles) {
        const url = await uploadFileToBucket(file, 'photos');
        if (url) photoUrls.push(url);
      }

      const drawingUrls = [];
      for (const file of drawingFiles) {
        const url = await uploadFileToBucket(file, 'drawings');
        if (url) drawingUrls.push(url);
      }

      // 2. Insert Repeat Job Card linked to customer
      const { error } = await supabase
        .from('job_cards')
        .insert([{
          customer_id: selectedCustomerId,
          status: status,
          qty: specs.qty ? parseInt(specs.qty) : null,
          od: specs.od,
          nt: specs.nt,
          model: specs.model,
          angle: specs.angle,
          root: specs.root,
          thickness: specs.thickness,
          length: specs.length,
          bore_keyway: specs.bore_keyway,
          material_grade: specs.material_grade,
          hardness: specs.hardness,
          gear_price: specs.gear_price ? parseFloat(specs.gear_price) : 0,
          tc_amt: specs.tc_amt ? parseFloat(specs.tc_amt) : 0,
          photos: photoUrls,
          drawings: drawingUrls,
          remarks: remarks
        }]);

      if (error) throw error;

      alert('Repeat Order Job Card Saved Successfully!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating repeat order:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
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
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">Dashboard</Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">New Customer</Link>
          <Link href="/dashboard/repeat-order" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap"><div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>Repeat Order</Link>
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
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">Quick Order Management</span>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto mb-6">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1a2b3c] tracking-tight">Create Repeat Order</h1>
            <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">Search existing customer by ID or Name and add a new gear order instantly.</p>
          </div>

          <form onSubmit={handleSaveRepeatOrder} className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Step 1: Select Customer */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60">
              <h2 className="text-[15px] font-extrabold text-[#1a2b3c] mb-4">1. Select Existing Customer</h2>
              {selectedCustomerId ? (
                <div className="flex items-center justify-between bg-[#3db2a8]/10 border border-[#3db2a8]/30 px-5 py-3.5 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#3db2a8] block">Selected Customer:</span>
                    <span className="text-sm font-bold text-[#1a2b3c]">{selectedCustomerName}</span>
                  </div>
                  <button type="button" onClick={() => { setSelectedCustomerId(null); setSelectedCustomerName(''); }} className="text-xs text-red-500 font-bold hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Type Customer ID (e.g. #1001) or Name (e.g. Rahul)..."
                    className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
                  />
                  {filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-gray-100">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="px-4 py-3 hover:bg-[#3db2a8]/10 cursor-pointer text-xs flex justify-between items-center transition-colors"
                        >
                          <span className="font-bold text-[#1a2b3c]">#{c.id} - {c.name}</span>
                          <span className="text-gray-400 text-[11px]">{c.city || 'No City'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Specs */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-300/30">
                <h2 className="text-[15px] font-extrabold text-[#1a2b3c]">2. Gear Specifications & Status</h2>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white/50 border border-white/80 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="In-Production">In-Production</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">QTY</label><input type="number" value={specs.qty} onChange={(e) => setSpecs({...specs, qty: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 5" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">OD</label><input type="text" value={specs.od} onChange={(e) => setSpecs({...specs, od: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 45mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">NT</label><input type="text" value={specs.nt} onChange={(e) => setSpecs({...specs, nt: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 24" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">MODEL</label><input type="text" value={specs.model} onChange={(e) => setSpecs({...specs, model: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. EN8 Gear" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">ANGLE</label><input type="text" value={specs.angle} onChange={(e) => setSpecs({...specs, angle: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 20°" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">ROOT</label><input type="text" value={specs.root} onChange={(e) => setSpecs({...specs, root: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 2mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">THICKNESS</label><input type="text" value={specs.thickness} onChange={(e) => setSpecs({...specs, thickness: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 15mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">LENGTH</label><input type="text" value={specs.length} onChange={(e) => setSpecs({...specs, length: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 100mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">BORE KEYWAY</label><input type="text" value={specs.bore_keyway} onChange={(e) => setSpecs({...specs, bore_keyway: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 20mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">MATERIAL GRADE</label><input type="text" value={specs.material_grade} onChange={(e) => setSpecs({...specs, material_grade: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. EN8" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">HARDNESS</label><input type="text" value={specs.hardness} onChange={(e) => setSpecs({...specs, hardness: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 30 HRC" /></div>
                <div><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">GEAR PRICE</label><input type="number" step="any" value={specs.gear_price} onChange={(e) => setSpecs({...specs, gear_price: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="₹ Price" /></div>
                <div className="col-span-2 md:col-span-2"><label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">TC AMT (TEETH CUTTING)</label><input type="number" step="any" value={specs.tc_amt} onChange={(e) => setSpecs({...specs, tc_amt: e.target.value})} className="w-full bg-white/50 border border-white/80 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="₹ TC Amount" /></div>
              </div>
            </div>

            {/* Step 3: Media & Remarks */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60">
              <h2 className="text-[15px] font-extrabold text-[#1a2b3c] mb-6 pb-3 border-b border-gray-300/30">3. Uploads & Remarks (Auto Compressed)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs">
                <label className="border-2 border-dashed border-gray-300/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/20 hover:bg-white/40 cursor-pointer text-center transition-colors">
                  <span className="font-bold text-[#1a2b3c]">Upload Photos (Multiple)</span>
                  <p className="text-[11px] text-gray-500 mt-1">{photoFiles.length} photos selected</p>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'photos')} className="hidden" />
                </label>
                <label className="border-2 border-dashed border-gray-300/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/20 hover:bg-white/40 cursor-pointer text-center transition-colors">
                  <span className="font-bold text-[#1a2b3c]">Upload Drawings (Multiple)</span>
                  <p className="text-[11px] text-gray-500 mt-1">{drawingFiles.length} drawings selected</p>
                  <input type="file" accept="image/*,.pdf" multiple onChange={(e) => handleFileUpload(e, 'drawings')} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block font-bold text-gray-500 mb-2 uppercase text-xs">Remarks / Instructions</label>
                <textarea rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full bg-white/50 border border-white/80 rounded-xl px-4 py-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="Add any special instructions..."></textarea>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-white/60 hover:bg-white text-gray-600 font-bold rounded-2xl text-xs transition-all">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-[#3db2a8] hover:bg-[#359d94] disabled:opacity-50 text-white font-bold py-3 px-8 rounded-2xl shadow-lg text-xs cursor-pointer transition-all">
                {isSubmitting ? 'Saving Repeat Order...' : 'Save Repeat Order'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}