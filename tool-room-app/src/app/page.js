'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('username, password')
        .eq('id', 1)
        .single();

      if (error) throw error;

      if (data && data.username === username.trim() && data.password === password.trim()) {
        router.push('/dashboard');
      } else {
        setErrorMsg('Invalid Username or Password! Please try again.');
      }
    } catch (err) {
      setErrorMsg('Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f0f4f8] font-sans antialiased items-center justify-center relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/50 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/80 z-10 relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#1a2b3c] tracking-tight">Khakare Engineering</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Tool Room App Login</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl mb-4 text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 text-xs" autoComplete="off">
          <div>
            <label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">Username</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/70 border border-white/90 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3db2a8] text-xs font-semibold text-[#1a2b3c]"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1.5 uppercase text-[10px]">Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/70 border border-white/90 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3db2a8] text-xs font-semibold text-[#1a2b3c]"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3db2a8] hover:bg-[#359d94] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-xs cursor-pointer mt-2"
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}