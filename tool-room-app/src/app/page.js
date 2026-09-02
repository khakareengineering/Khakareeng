'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const u = username.trim();
    const p = password;

    if (u.toLowerCase() === 'admin' && p === 'admin@333') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAuthenticated', 'true');
      }
      router.push('/dashboard');
    } else {
      setErrorMsg('Invalid Username or Password! Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f0f4f8] flex items-center justify-center p-4 relative overflow-hidden font-sans antialiased text-gray-800">
      
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/25 rounded-full blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/15 rounded-full blur-[110px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Login Glass Card */}
        <div className="w-full bg-white/50 backdrop-blur-2xl p-7 md:p-9 rounded-[2.5rem] border border-white/80 shadow-[0_20px_50px_rgba(26,43,60,0.06)]">
          <div className="mb-6 text-center">
            <h2 className="text-xl md:text-2xl font-black text-[#1a2b3c] tracking-tight">Khakare Engineering</h2>
            <p className="text-xs text-gray-400 mt-1">Enter your credentials to access workshop controls</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                USERNAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/90 border border-gray-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs md:text-sm text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:border-[#3db2a8] focus:ring-2 focus:ring-[#3db2a8]/20 transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/90 border border-gray-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs md:text-sm text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:border-[#3db2a8] focus:ring-2 focus:ring-[#3db2a8]/20 transition shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 bg-[#1a2b3c] hover:bg-[#243b53] text-white font-bold text-xs md:text-sm rounded-2xl shadow-lg shadow-[#1a2b3c]/20 flex items-center justify-center gap-2 transition duration-300 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 text-[#3db2a8]" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-400 font-medium mt-8 text-center">
          © {new Date().getFullYear()} Khakare Engineering. All rights reserved.
        </p>

      </div>
    </div>
  );
}