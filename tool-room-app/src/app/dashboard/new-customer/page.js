'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  CheckCircle,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState(null);

  // Owner & Header state
  const [ownerInfo, setOwnerInfo] = useState({ name: 'Owner', avatar: '' });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase.from('app_settings').select('owner_name, avatar_url').eq('id', 1).single();
        if (data) {
          setOwnerInfo({
            name: data.owner_name || 'Owner',
            avatar: data.avatar_url || ''
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();

    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Customer Name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        contact_no: contactNo.trim(),
        city: city.trim(),
        address: address.trim(),
        is_active: true
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setCreatedCustomer(data);
    } catch (err) {
      alert('Error creating customer: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setName('');
    setContactNo('');
    setCity('');
    setAddress('');
    setGstNumber('');
    setNotes('');
    setCreatedCustomer(null);
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
          <Link href="/dashboard/new-order" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <PlusCircle className="w-5 h-5 text-gray-400" />
            <span className="text-sm">New Order</span>
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <ClipboardList className="w-5 h-5 text-gray-400" />
            <span className="text-sm">View Orders</span>
          </Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-xs border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <UserPlus className="w-5 h-5 text-[#3db2a8]" />
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
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#1a2b3c]">New Customer Registration</h1>
                <p className="text-xs md:text-sm text-gray-500 font-medium">Add a new party/client profile to your workshop database</p>
              </div>
              <Link href="/dashboard/customers" className="px-4 py-2.5 bg-white/80 hover:bg-white text-gray-700 text-xs md:text-sm font-bold rounded-2xl shadow-xs border border-gray-200 transition">
                View Customers
              </Link>
            </div>

            {/* Success Feedback Card */}
            {createdCustomer ? (
              <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-emerald-500 shadow-xl space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-sm md:text-base">Customer Added Successfully!</h3>
                    <p className="text-xs text-gray-500">{createdCustomer.name} is now registered in the system.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs md:text-sm font-bold rounded-xl transition cursor-pointer"
                  >
                    + Add Another Customer
                  </button>
                  <Link
                    href={`/dashboard/new-order`}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#3db2a8] to-teal-500 hover:opacity-95 text-white text-xs md:text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition"
                  >
                    <span>Create Order for this Customer</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-2xl rounded-3xl border border-white/70 shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-xs font-black tracking-wider uppercase text-gray-400 mb-3">CUSTOMER PROFILE</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Customer / Company Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Industries / Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#3db2a8] mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Contact / Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#3db2a8] mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">City / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Aurangabad, Pune"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#3db2a8] mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-black tracking-wider uppercase text-gray-400 mb-3">ADDRESS DETAILS</h2>
                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Workshop / Factory Address</label>
                    <textarea
                      rows="3"
                      placeholder="Full address, Plot No., MIDC area..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#3db2a8] mt-1 resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Link href="/dashboard/customers" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs md:text-sm rounded-xl transition">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-2.5 bg-gradient-to-r from-[#3db2a8] to-teal-500 hover:opacity-90 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer transition"
                  >
                    {saving ? 'Saving...' : 'Save Customer Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}