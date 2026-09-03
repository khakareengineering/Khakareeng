'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFileToBucket } from '@/lib/storage';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  UserPlus, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Owner Info
  const [ownerInfo, setOwnerInfo] = useState({ name: 'Owner', avatar: '' });

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
    fetchInitialData();
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInitialData = async () => {
    try {
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

      // 2. Fetch Active Customers
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

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('कृपया आधी Customer निवडा किंवा New Customer मधून ॲड करा!');
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

      // 2. Insert Job Card linked to customer
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

      alert('New Order Job Card Saved Successfully!');
      router.push('/dashboard/orders');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans text-gray-800 antialiased overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#1a2b3c]/30 backdrop-blur-xs z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar with Brand Logo */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-28 flex items-center justify-between px-5 border-b border-white/40">
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <img 
              src="/logo.png" 
              alt="Khakare Engineering Logo" 
              className="h-20 w-auto max-w-[210px] object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" 
            />
          </Link>
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8] ml-2" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <LayoutDashboard className="w-5 h-5 text-gray-400" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link href="/dashboard/new-order" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-xs border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <PlusCircle className="w-5 h-5 text-[#3db2a8]" />
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
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <BarChart3 className="w-5 h-5 text-gray-400" />
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
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-gray-600 hover:bg-white/50 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm md:text-base font-extrabold text-[#1a2b3c] tracking-tight">Khakare Engineering</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="w-10 h-10 md:w-11 md:h-11 bg-white/90 rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                {ownerInfo.avatar ? (
                  <img src={ownerInfo.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-[#1a2b3c] text-base">{ownerInfo.name.charAt(0)}</span>
                )}
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                    <p className="text-sm font-bold text-[#1a2b3c]">{ownerInfo.name}</p>
                  </div>
                  <Link href="/dashboard/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#3db2a8] hover:bg-slate-50 transition">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-[#1a2b3c] tracking-tight">Create New Order</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1 font-medium">Search customer by ID or Name and create a gear manufacturing job card.</p>
          </div>

          <form onSubmit={handleSaveOrder} className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Step 1: Select Customer */}
            <div className="bg-white/50 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-xs border border-white/70">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm md:text-base font-extrabold text-[#1a2b3c]">1. Customer Selection</h2>
                <Link href="/dashboard/new-customer" className="text-xs md:text-sm font-bold text-[#3db2a8] hover:underline">
                  + Add New Customer
                </Link>
              </div>

              {selectedCustomerId ? (
                <div className="flex items-center justify-between bg-[#3db2a8]/10 border border-[#3db2a8]/30 px-5 py-3.5 rounded-2xl">
                  <div>
                    <span className="text-[10px] md:text-xs font-bold uppercase text-[#3db2a8] block">Selected Customer:</span>
                    <span className="text-xs md:text-sm font-bold text-[#1a2b3c]">{selectedCustomerName}</span>
                  </div>
                  <button type="button" onClick={() => { setSelectedCustomerId(null); setSelectedCustomerName(''); }} className="text-xs text-red-500 font-bold hover:underline cursor-pointer">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by Customer ID (e.g. #1001) or Name (e.g. Rahul)..."
                    className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
                  />
                  {filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-gray-100">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="px-4 py-3 hover:bg-[#3db2a8]/10 cursor-pointer text-xs md:text-sm flex justify-between items-center transition-colors"
                        >
                          <span className="font-bold text-[#1a2b3c]">#{c.id} - {c.name}</span>
                          <span className="text-gray-400 text-xs">{c.city || 'No City'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Specs */}
            <div className="bg-white/50 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-xs border border-white/70">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200/60">
                <h2 className="text-sm md:text-base font-extrabold text-[#1a2b3c]">2. Gear Specifications & Status</h2>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs md:text-sm font-bold text-[#1a2b3c] focus:outline-none cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="In-Production">In-Production</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs md:text-sm">
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">QTY</label><input type="number" value={specs.qty} onChange={(e) => setSpecs({...specs, qty: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 5" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">OD</label><input type="text" value={specs.od} onChange={(e) => setSpecs({...specs, od: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 45mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">NT</label><input type="text" value={specs.nt} onChange={(e) => setSpecs({...specs, nt: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 24" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">MODEL</label><input type="text" value={specs.model} onChange={(e) => setSpecs({...specs, model: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. EN8 Gear" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">ANGLE</label><input type="text" value={specs.angle} onChange={(e) => setSpecs({...specs, angle: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 20°" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">ROOT</label><input type="text" value={specs.root} onChange={(e) => setSpecs({...specs, root: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 2mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">THICKNESS</label><input type="text" value={specs.thickness} onChange={(e) => setSpecs({...specs, thickness: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 15mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">LENGTH</label><input type="text" value={specs.length} onChange={(e) => setSpecs({...specs, length: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 100mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">BORE KEYWAY</label><input type="text" value={specs.bore_keyway} onChange={(e) => setSpecs({...specs, bore_keyway: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 20mm" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">MATERIAL GRADE</label><input type="text" value={specs.material_grade} onChange={(e) => setSpecs({...specs, material_grade: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. EN8" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">HARDNESS</label><input type="text" value={specs.hardness} onChange={(e) => setSpecs({...specs, hardness: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="e.g. 30 HRC" /></div>
                <div><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">GEAR AMT</label><input type="number" step="any" value={specs.gear_price} onChange={(e) => setSpecs({...specs, gear_price: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="₹ Price" /></div>
                <div className="col-span-2 md:col-span-2"><label className="block font-bold text-gray-500 mb-1 uppercase text-[10px]">TC AMT (TEETH CUTTING)</label><input type="number" step="any" value={specs.tc_amt} onChange={(e) => setSpecs({...specs, tc_amt: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="₹ TC Amount" /></div>
              </div>
            </div>

            {/* Step 3: Media & Remarks */}
            <div className="bg-white/50 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-xs border border-white/70">
              <h2 className="text-sm md:text-base font-extrabold text-[#1a2b3c] mb-6 pb-3 border-b border-gray-200/60">3. Uploads & Remarks (Auto Compressed)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs md:text-sm">
                <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/40 hover:bg-white/70 cursor-pointer text-center transition-colors">
                  <span className="font-bold text-[#1a2b3c]">Upload Photos (Multiple)</span>
                  <p className="text-xs text-gray-500 mt-1">{photoFiles.length} photos selected</p>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'photos')} className="hidden" />
                </label>
                <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/40 hover:bg-white/70 cursor-pointer text-center transition-colors">
                  <span className="font-bold text-[#1a2b3c]">Upload Drawings (Multiple)</span>
                  <p className="text-xs text-gray-500 mt-1">{drawingFiles.length} drawings selected</p>
                  <input type="file" accept="image/*,.pdf" multiple onChange={(e) => handleFileUpload(e, 'drawings')} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block font-bold text-gray-500 mb-2 uppercase text-xs">Remarks / Instructions</label>
                <textarea rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3db2a8]" placeholder="Add any special instructions..."></textarea>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-white/80 hover:bg-white text-gray-600 font-bold rounded-2xl text-xs md:text-sm transition-all border border-gray-200">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-[#3db2a8] hover:bg-[#359d94] disabled:opacity-50 text-white font-bold py-3 px-8 rounded-2xl shadow-md text-xs md:text-sm cursor-pointer transition-all">
                {isSubmitting ? 'Saving Order...' : 'Save Order & Job Card'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}