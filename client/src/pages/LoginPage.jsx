import React, { useState } from 'react';
import { Lock, User, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, settings } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-slate-900 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 ring-1 ring-slate-900/10">
        {/* Brand Banner */}
        <div className="p-8 bg-slate-900 text-white text-center border-b border-slate-800 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-950 to-slate-800 border border-slate-700/60 shadow-md flex items-center justify-center mx-auto mb-3 text-white font-mono font-black text-xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-tr from-sky-400 to-indigo-200">K</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">{settings?.store_name || 'KiroPOS'}</h1>
          <p className="text-xs text-slate-400 mt-1">Punto de Venta Profesional & Control Comercial</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-semibold text-rose-700 animate-in fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
                placeholder="admin o cajero"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            <span>{loading ? 'Accediendo...' : 'Iniciar Turno'}</span>
            <ArrowRight className="w-4 h-4 text-sky-400" />
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acceso Rápido Demo</span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="px-3 py-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all border border-slate-200/60"
              >
                admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('cajero', 'cajero123')}
                className="px-3 py-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all border border-slate-200/60"
              >
                cajero
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
