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
  ArrowRight
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

      {isMobileMenuOpen && <div className="fixed inset-0 bg-[#1a2b3c]/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* 6-Item Standard Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-8">
          <span className="text-xl font-black text-[#1a2b3c] tracking-wider">RA-XIS<span className="text-[#3db2a8]">.</span></span>
          <button className="md:hidden text-gray-500 hover:text-[#3db2a8]" onClick={() => setIsMobileMenuOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <nav className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <LayoutDashboard className="w-4 h-4 text-gray-400" />
            Dashboard
          </Link>
          <Link href="/dashboard/new-order" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <PlusCircle className="w-4 h-4 text-gray-400" />
            New Order
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            View Orders
          </Link>
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm border border-white/50 text-[#3db2a8] font-bold rounded-2xl relative transition-all whitespace-nowrap">
            <div className="absolute left-1.5 top-2 bottom-2 w-1.5 bg-[#3db2a8] rounded-full"></div>
            <UserPlus className="w-4 h-4 text-[#3db2a8]" />
            New Customer
          </Link>
          <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <Users className="w-4 h-4 text-gray-400" />
            View Customers
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            Reports
          </Link>
        </nav>

        <div className="p-5 border-t border-white/40">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-white/40 rounded-2xl font-semibold transition-colors whitespace-nowrap">
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
        <header className="h-20 bg-white/30 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 md:px-8 relative z-50">
          <span className="text-sm font-bold text-gray-500">Khakare Engineering Tool Room</span>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="w-10 h-10 bg-white/90 rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                {ownerInfo.avatar ? <img src={ownerInfo.avatar} alt="Profile" className="w-full h-full object-cover" /> : <span className="font-bold text-[#1a2b3c]">{ownerInfo.name.charAt(0)}</span>}
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                    <p className="text-sm font-bold text-[#1a2b3c]">{ownerInfo.name}</p>
                  </div>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#3db2a8]">Settings</Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-[#1a2b3c]">New Customer Registration</h1>
                <p className="text-xs text-gray-500">Add a new party/client profile to your workshop database</p>
              </div>
              <Link href="/dashboard/customers" className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 text-xs font-bold rounded-xl shadow-sm border border-gray-200">
                View Customers
              </Link>
            </div>

            {/* Success Feedback Card */}
            {createdCustomer ? (
              <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-emerald-500 shadow-xl space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-sm">Customer Added Successfully!</h3>
                    <p className="text-xs text-gray-500">{createdCustomer.name} is now registered in the system.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    + Add Another Customer
                  </button>
                  <Link
                    href={`/dashboard/new-order`}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#3db2a8] to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                  >
                    <span>Create Order for this Customer</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-sm p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-xs font-black tracking-wider uppercase text-gray-400 mb-3">CUSTOMER PROFILE</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Customer / Company Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Industries / Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#3db2a8] mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Contact / Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#3db2a8] mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">City / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Aurangabad, Pune"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#3db2a8] mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-black tracking-wider uppercase text-gray-400 mb-3">ADDRESS DETAILS</h2>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Workshop / Factory Address</label>
                    <textarea
                      rows="3"
                      placeholder="Full address, Plot No., MIDC area..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#3db2a8] mt-1 resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Link href="/dashboard/customers" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">Cancel</Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-2.5 bg-gradient-to-r from-[#3db2a8] to-teal-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-50"
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