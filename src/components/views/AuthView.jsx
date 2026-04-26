import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function AuthView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-2xl font-black text-center mb-6 text-green-600 tracking-tight">Login MyQuranPlan</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-bold border border-red-100">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium" placeholder="Masukkan email..." />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium" placeholder="Masukkan password..." />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-sm">
            {loading ? 'Memproses...' : 'Masuk Aplikasi'}
          </button>
        </form>
      </div>
    </div>
  );
}