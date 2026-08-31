'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'root' && password === 'root') {
      setError('');
      router.push('/dashboard');
    } else {
      setError('Invalid Username or Password!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-4 sm:p-8 font-sans relative overflow-hidden">
      
      {/* Background Blobs for Glass Effect consistency */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3db2a8]/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2b3c]/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_32px_rgba(31,41,55,0.05)] z-10">
        
        {/* Avatar Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-white/80">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mt-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-center text-red-500 text-sm font-semibold bg-red-50 py-2 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8 mt-2">
          
          {/* Username Input */}
          <div className="relative flex items-center border-b border-gray-300 focus-within:border-[#3db2a8] pb-2 transition-colors duration-300">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mr-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <input
              type="text"
              placeholder="Username"
              style={{ WebkitBoxShadow: '0 0 0 30px rgba(255,255,255,0.5) inset' }}
              className="w-full bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 text-base sm:text-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative flex items-center border-b border-gray-300 focus-within:border-[#3db2a8] pb-2 transition-colors duration-300">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mr-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              placeholder="Password"
              style={{ WebkitBoxShadow: '0 0 0 30px rgba(255,255,255,0.5) inset' }}
              className="w-full bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 text-base sm:text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mt-4">
            <label className="flex items-center cursor-pointer hover:text-gray-700 transition">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-gray-600 focus:ring-[#3db2a8] w-4 h-4 cursor-pointer" />
              Remember me
            </label>
            <a href="#" className="italic hover:text-gray-800 transition-colors">Forgot Password?</a>
          </div>

          {/* Uiverse Custom Styled Button with 20% Increased Shadow */}
          <div className="pt-6 flex justify-center">
            <button
              type="submit"
              className="flex items-center justify-center outline-none cursor-pointer w-[150px] h-[48px] rounded-[30px] border border-[#9ca3af] text-[#4b5563] text-sm font-semibold tracking-wide transition-all duration-200 hover:shadow-lg active:scale-95"
              style={{
                backgroundImage: 'linear-gradient(to top, #e5e7eb 0%, #ffffff 80%, #ffffff 100%)',
                textShadow: '0 1px #fff',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)', // शॅडो २०% नी वाढवली आहे
              }}
            >
              LOGIN
            </button>
          </div>

        </form>
      </div>
    </div>
  );
} 