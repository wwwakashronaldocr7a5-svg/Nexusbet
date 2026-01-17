
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications'>('account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(user.notifications || {
    matchStart: true,
    goalAlerts: true,
    promos: false
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (user.password !== currentPassword) {
      setMessage({ type: 'error', text: 'Incorrect current password' });
      return;
    }

    const updatedUser = { ...user, password: newPassword };
    authService.saveUser(updatedUser);
    setMessage({ type: 'success', text: 'Password updated successfully' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onUpdate();
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    const newPrefs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newPrefs);
    const updatedUser = { ...user, notifications: newPrefs };
    authService.saveUser(updatedUser);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Settings</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Manage your Nexus Account</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex bg-zinc-950 border-b border-zinc-900">
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'account' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Notifications
          </button>
        </div>

        <div className="p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center border ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'account' ? (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] text-xs active:scale-95 mt-4"
              >
                Update Password
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-2xl border border-zinc-700">
                <div>
                  <p className="text-sm font-bold text-white">Match Start Alerts</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">Get notified when games kick off</p>
                </div>
                <button 
                  onClick={() => handleToggleNotification('matchStart')}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.matchStart ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.matchStart ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-2xl border border-zinc-700">
                <div>
                  <p className="text-sm font-bold text-white">Goal Alerts</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">Instant updates for every score change</p>
                </div>
                <button 
                  onClick={() => handleToggleNotification('goalAlerts')}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.goalAlerts ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.goalAlerts ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-2xl border border-zinc-700">
                <div>
                  <p className="text-sm font-bold text-white">Promotional Offers</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">Nexus exclusive rewards and bonuses</p>
                </div>
                <button 
                  onClick={() => handleToggleNotification('promos')}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications.promos ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.promos ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="pt-6 text-center">
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Settings are synced to your secure profile</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
