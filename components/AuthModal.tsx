
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { INITIAL_BALANCE } from '../constants';

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = authService.getUsers();
      const userToFind = users.find(u => u.username === username);
      
      if (userToFind?.isBanned) {
        setError('Your account has been suspended by Nexus Administration.');
        return;
      }

      const user = authService.login(username, password, remember);
      if (user) {
        onSuccess(user);
      } else {
        setError('Invalid username or password');
      }
    } else {
      if (!username || !password || !email) {
        setError('All fields are required');
        return;
      }
      const newUser: User = {
        username,
        password,
        email,
        balance: INITIAL_BALANCE,
        currency: 'INR'
      };
      const success = authService.register(newUser);
      if (success) {
        authService.login(username, password, remember);
        onSuccess(newUser);
      } else {
        setError('Username already exists');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2">
              NEXUS<span className="text-emerald-500">BET</span>
            </h2>
            <p className="text-zinc-500 text-sm">
              {isLogin ? 'Welcome back, champion.' : 'Join the elite sports arena.'}
            </p>
          </div>

          <div className="flex bg-zinc-800 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isLogin ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isLogin ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`p-3 border rounded-lg text-center text-xs font-bold ${error.includes('suspended') ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                />
                <span className="text-xs text-zinc-400 font-medium">Remember me</span>
              </label>
              {isLogin && <button type="button" className="text-xs text-emerald-500 hover:underline font-medium">Forgot Password?</button>}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-widest text-sm mt-4"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
        
        <div className="bg-zinc-800/50 p-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">
            By continuing, you agree to our <span className="text-emerald-500 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-emerald-500 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
