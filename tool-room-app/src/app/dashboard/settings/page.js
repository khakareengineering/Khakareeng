'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabase';
import { uploadFileToBucket } from '@/lib/storage';
import getCroppedImg from '@/lib/cropImage';
import LiquidProgressBar from '@/components/LiquidProgressBar';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  UserPlus, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Database
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [ownerName, setOwnerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Storage Quota State
  const [dbUsageMB, setDbUsageMB] = useState(0.05);
  const [dbUsagePercent, setDbUsagePercent] = useState(1);
  const [mediaUsageMB, setMediaUsageMB] = useState(0);
  const [mediaUsagePercent, setMediaUsagePercent] = useState(0);

  // Crop State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Profile Menu State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettingsAndStorage();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSettingsAndStorage = async () => {
    try {
      setLoading(true);

      // 1. Fetch Owner Settings
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        setOwnerName(data.owner_name || 'Owner');
        setAvatarUrl(data.avatar_url || '');
        setUsername(data.username || 'admin');
        setPassword(data.password || 'admin123');
      }

      // 2. Fetch Database Record Footprint (500 MB quota)
      const { count: jobCount } = await supabase.from('job_cards').select('*', { count: 'exact', head: true });
      const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      
      const estimatedDbBytes = ((jobCount || 0) * 2048) + ((custCount || 0) * 1024) + (1024 * 60); 
      const calcDbMB = Number((estimatedDbBytes / (1024 * 1024)).toFixed(2));
      setDbUsageMB(calcDbMB > 0.01 ? calcDbMB : 0.05);
      setDbUsagePercent(Math.max(1, Math.min(100, Math.round(((calcDbMB > 0.01 ? calcDbMB : 0.05) / 500) * 100))));

      // 3. Scan Single 'job-card-media' Bucket Folders
      let totalStorageBytes = 0;
      const folders = ['photos', 'drawings', 'avatars'];
      
      for (const folder of folders) {
        try {
          const { data: files } = await supabase.storage
            .from('job-card-media')
            .list(folder, { limit: 100 });

          if (files && Array.isArray(files)) {
            files.forEach(f => {
              if (f.metadata && f.metadata.size) {
                totalStorageBytes += f.metadata.size;
              }
            });
          }
        } catch (bErr) {
          console.warn(`Scan error in folder ${folder}:`, bErr);
        }
      }

      // Total MB calculation for 1 GB (1024 MB)
      const calcMediaMB = Number((totalStorageBytes / (1024 * 1024)).toFixed(2));
      setMediaUsageMB(calcMediaMB);
      setMediaUsagePercent(Math.min(100, Math.round((calcMediaMB / 1024) * 100)));

    } catch (err) {
      console.error('Error loading settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleApplyCrop = async () => {
    try {
      setSaving(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload to Storage
      const newUrl = await uploadFileToBucket(file, 'avatars');

      if (newUrl) {
        await supabase
          .from('app_settings')
          .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
          .eq('id', 1);

        setAvatarUrl(newUrl);
        setIsCropModalOpen(false);
        setImageSrc(null);
        alert('Profile picture updated successfully!');
        fetchSettingsAndStorage();
      }
    } catch (e) {
      alert('Error cropping/uploading image: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove the profile picture?')) return;
    try {
      setSaving(true);
      await supabase
        .from('app_settings')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', 1);

      setAvatarUrl('');
      alert('Profile picture removed!');
      fetchSettingsAndStorage();
    } catch (err) {
      alert('Error removing photo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from('app_settings')
        .update({
          owner_name: ownerName.trim(),
          username: username.trim(),
          password: password.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
      alert('Settings & Login Credentials Updated Successfully!');
      router.refresh();
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
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
          <Link href="/dashboard/new-customer" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#1a2b3c] hover:bg-white/40 rounded-2xl font-semibold transition-all whitespace-nowrap">
            <UserPlus className="w-4 h-4 text-gray-400" />
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
          <span className="text-sm font-bold text-gray-500">Settings & Credentials</span>
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full overflow-hidden border border-white/80 flex items-center justify-center shadow-md cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-[#1a2b3c]">{ownerName ? ownerName.charAt(0) : 'O'}</span>
                )}
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                    <p className="text-sm font-bold text-[#1a2b3c]">{ownerName}</p>
                  </div>
                  <Link href="/dashboard/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#3db2a8]">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-xl md:text-2xl font-black text-[#1a2b3c] tracking-tight">System Settings & Storage</h1>
            <p className="text-gray-500 text-xs mt-1 font-medium">Manage Owner identity, credentials, and live Supabase storage limits.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            
            {/* 1. TOP: Profile Photo & Credentials Form */}
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Profile Avatar Circle + Crop */}
              <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center relative flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-400 font-black">{ownerName ? ownerName[0]?.toUpperCase() : 'O'}</span>
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="font-extrabold text-[#1a2b3c] text-sm">Owner Profile Photo</h3>
                  <p className="text-xs text-gray-500">Upload a photo. You can crop it seamlessly into a perfect circle.</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={onSelectFile} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#3db2a8] hover:bg-[#359d94] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Change Photo
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner Identity & Security Credentials */}
              <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60 space-y-4">
                <h2 className="text-[15px] font-extrabold text-[#1a2b3c] pb-2 border-b border-gray-300/30">Owner Details & Security Credentials</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full bg-white/70 border border-white/90 rounded-xl px-4 py-2.5 font-bold text-[#1a2b3c] focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
                      placeholder="e.g. Nikhil"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">Username *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/70 border border-white/90 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
                      placeholder="Enter login username"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">Password *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/70 border border-white/90 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3db2a8]"
                      placeholder="Enter login password"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#3db2a8] hover:bg-[#359d94] disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl shadow-md text-xs cursor-pointer transition-all"
                  >
                    {saving ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </div>
            </form>

            {/* 2. BOTTOM: Supabase Live Storage Usage (Liquid Progress Bars) */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/60 space-y-4">
              <div className="border-b border-gray-200/40 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-extrabold text-[#1a2b3c] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#3db2a8]" />
                    <span>Supabase Live Storage Usage</span>
                  </h2>
                  <p className="text-[11px] text-gray-500">Live storage monitoring for PostgreSQL records and media files</p>
                </div>
                <button
                  onClick={fetchSettingsAndStorage}
                  className="text-[11px] font-bold text-[#3db2a8] hover:underline"
                >
                  ↻ Refresh Stats
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                {/* 1. Database Quota (500 MB) */}
                <LiquidProgressBar
                  title="Database Records"
                  percentage={dbUsagePercent}
                  usedText={`${dbUsageMB} MB`}
                  totalText="500 MB"
                  liquidColor="#3db2a8"
                  waveAccent="rgba(61, 178, 168, 0.4)"
                />

                {/* 2. Media Bucket Storage (1 GB) */}
                <LiquidProgressBar
                  title="Media Bucket (Images)"
                  percentage={mediaUsagePercent}
                  usedText={`${mediaUsageMB} MB`}
                  totalText="1 GB"
                  liquidColor="#1a2b3c"
                  waveAccent="rgba(26, 43, 60, 0.4)"
                />
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Crop Modal */}
      {isCropModalOpen && imageSrc && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full flex flex-col items-center">
            <h3 className="font-extrabold text-[#1a2b3c] text-sm mb-4">Crop Profile Picture</h3>
            <div className="relative w-full h-64 bg-gray-900 rounded-2xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="w-full mt-4 flex items-center gap-3">
              <span className="text-xs text-gray-400 font-bold">Zoom:</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(e.target.value)}
                className="w-full accent-[#3db2a8]"
              />
            </div>
            <div className="flex gap-2 justify-end w-full mt-6">
              <button
                type="button"
                onClick={() => { setIsCropModalOpen(false); setImageSrc(null); }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleApplyCrop}
                className="px-6 py-2 bg-[#3db2a8] hover:bg-[#359d94] text-white font-bold text-xs rounded-xl shadow-md"
              >
                {saving ? 'Uploading...' : 'Save & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
