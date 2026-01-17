
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, HouseStats } from '../types';
import { authService } from '../services/authService';

interface AdminPanelProps {
  onClose: () => void;
  currentUser: User;
  onRefreshUser: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUser, onRefreshUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [houseStats, setHouseStats] = useState<HouseStats>(authService.getHouseStats());
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'treasury'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  // User Management State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');
  
  // Harvest Confirmation State
  const [isHarvestConfirmOpen, setIsHarvestConfirmOpen] = useState(false);
  const [harvestInput, setHarvestInput] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(authService.getUsers());
    setWithdrawals(authService.getWithdrawalRequests());
    setHouseStats(authService.getHouseStats());
  };

  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      totalUserBalances: users.reduce((acc, u) => acc + u.balance, 0),
      pendingWithdrawals: withdrawals.filter(w => w.status === 'Pending').length,
    };
  }, [users, withdrawals]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => 
      w.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.upiId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [withdrawals, searchTerm]);

  const handleDeleteUser = (username: string) => {
    if (username === currentUser.username) {
      alert("Security Protocol: You cannot delete your own administrative account.");
      return;
    }
    if (confirm(`CRITICAL: Are you sure you want to permanently delete user "${username}"?`)) {
      authService.deleteUser(username);
      refreshData();
    }
  };

  const handleToggleBan = (user: User) => {
    if (user.username === currentUser.username) {
      alert("Nexus Shield: You cannot ban yourself.");
      return;
    }
    const updated = { ...user, isBanned: !user.isBanned };
    authService.saveUser(updated);
    refreshData();
  };

  const handleToggleAdmin = (user: User) => {
    if (user.username === currentUser.username) {
      alert("Access Denied: You cannot revoke your own root access.");
      return;
    }
    const updated = { ...user, isAdmin: !user.isAdmin };
    authService.saveUser(updated);
    refreshData();
  };

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const amount = parseFloat(newBalance);
    if (isNaN(amount)) return;

    const updated = { ...editingUser, balance: amount };
    authService.saveUser(updated);
    setEditingUser(null);
    setNewBalance('');
    refreshData();
    onRefreshUser();
  };

  const handleWithdrawalAction = (id: string, status: 'Approved' | 'Rejected') => {
    if (confirm(`Confirm ${status} for this withdrawal request?`)) {
      authService.updateWithdrawalStatus(id, status);
      refreshData();
      onRefreshUser();
    }
  };

  const handleWithdrawHouseProfit = () => {
    if (houseStats.totalProfit <= 0) {
      alert("No profits available to harvest at this time.");
      return;
    }
    setHarvestInput('');
    setIsHarvestConfirmOpen(true);
  };

  const executeHarvest = () => {
    if (harvestInput !== 'CONFIRM') return;

    const profitToWithdraw = houseStats.totalProfit;
    
    authService.updateHouseStats({
      totalTreasury: houseStats.totalTreasury - profitToWithdraw,
      totalProfit: 0 
    });

    const updatedAdmin = { ...currentUser, balance: currentUser.balance + profitToWithdraw };
    authService.saveUser(updatedAdmin);
    
    setHouseStats(authService.getHouseStats());
    onRefreshUser();
    setIsHarvestConfirmOpen(false);
    alert(`Success: Profit of ₹${profitToWithdraw.toLocaleString('en-IN')} moved to Admin Bank Account.`);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8">
      
      {/* Balance Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-6">Modify Balance: {editingUser.username}</h3>
            <form onSubmit={handleUpdateBalance} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">New Credit Amount (INR)</label>
                <input 
                  type="number" 
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white font-black text-2xl focus:outline-none focus:border-emerald-500"
                  placeholder={editingUser.balance.toString()}
                  autoFocus
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-xl uppercase text-xs">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-black font-black py-4 rounded-xl uppercase text-xs">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Harvest Confirmation Overlay */}
      {isHarvestConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl mx-auto border border-amber-500/20 text-amber-500">
                ⚠️
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Secure Payout</h3>
              <p className="text-zinc-400 text-sm">
                You are about to harvest <span className="text-emerald-500 font-bold">₹{houseStats.totalProfit.toLocaleString('en-IN')}</span> from the treasury.
              </p>
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest pt-2">
                Please type <span className="text-zinc-300">CONFIRM</span> to proceed
              </p>
            </div>
            
            <input 
              type="text"
              value={harvestInput}
              onChange={(e) => setHarvestInput(e.target.value)}
              placeholder="Type CONFIRM here..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-center text-white font-black tracking-[0.2em] focus:outline-none focus:border-emerald-500 transition-all mb-6 uppercase"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setIsHarvestConfirmOpen(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={executeHarvest}
                disabled={harvestInput !== 'CONFIRM'}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs"
              >
                Harvest
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900/20">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Nexus Command</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Financial Oversight</h2>
            </div>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab('users')}
                className={`text-xs font-black uppercase tracking-widest ${activeTab === 'users' ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                User Management
              </button>
              <button 
                onClick={() => setActiveTab('withdrawals')}
                className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${activeTab === 'withdrawals' ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                Payout Requests {stats.pendingWithdrawals > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
              </button>
              <button 
                onClick={() => setActiveTab('treasury')}
                className={`text-xs font-black uppercase tracking-widest ${activeTab === 'treasury' ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                House Vault
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">🔍</span>
                <input 
                  type="text"
                  placeholder="Scan users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 font-medium"
                />
             </div>
             <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Treasury Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-zinc-900 border-b border-zinc-900">
          <div className="bg-zinc-950 p-6 flex flex-col">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">House Liquidity</span>
            <span className="text-2xl font-black text-emerald-500">₹{houseStats.totalTreasury.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-zinc-950 p-6 flex flex-col">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Unrealized Profits</span>
            <span className="text-2xl font-black text-white">₹{houseStats.totalProfit.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-zinc-950 p-6 flex flex-col">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Platform Volume</span>
            <span className="text-2xl font-black text-zinc-400">₹{houseStats.totalVolume.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-zinc-950 p-6 flex flex-col">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Active Accounts</span>
            <span className="text-2xl font-black text-white">{stats.totalUsers}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'users' && (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-zinc-600 uppercase border-b border-zinc-900">
                  <th className="pb-6 px-4 text-left font-black tracking-widest">User Identity</th>
                  <th className="pb-6 px-4 text-left font-black tracking-widest">Status/Role</th>
                  <th className="pb-6 px-4 text-left font-black tracking-widest">Balance</th>
                  <th className="pb-6 px-4 text-right font-black tracking-widest">Global Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredUsers.map((u) => (
                  <tr key={u.username} className={`group hover:bg-white/[0.02] transition-colors ${u.isBanned ? 'bg-red-500/[0.03] opacity-60' : ''}`}>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black uppercase ${u.isBanned ? 'bg-red-500/20 text-red-500' : (u.isAdmin ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-500')}`}>
                          {u.username.substring(0, 2)}
                        </div>
                        <div>
                          <p className={`font-black ${u.isBanned ? 'text-red-400' : 'text-white'}`}>{u.username}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        {u.isBanned && <span className="text-[9px] font-black px-3 py-1.5 rounded-full uppercase border bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">Banned</span>}
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase border ${u.isAdmin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}>
                          {u.isAdmin ? 'Admin' : 'Player'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                       <button 
                        onClick={() => { setEditingUser(u); setNewBalance(u.balance.toString()); }}
                        className="group flex flex-col text-left hover:bg-emerald-500/10 p-2 rounded-xl transition-all"
                       >
                         <span className="font-black text-emerald-400 text-lg">₹{u.balance.toLocaleString('en-IN')}</span>
                         <span className="text-[8px] font-black text-zinc-700 group-hover:text-emerald-500 uppercase">Click to edit</span>
                       </button>
                    </td>
                    <td className="py-6 px-4 text-right">
                      <div className="flex justify-end items-center gap-4">
                        <button 
                          onClick={() => handleToggleAdmin(u)}
                          className={`text-[9px] font-black uppercase transition-colors ${u.isAdmin ? 'text-emerald-500 hover:text-white' : 'text-zinc-600 hover:text-emerald-500'}`}
                        >
                          {u.isAdmin ? 'Demote' : 'Promote'}
                        </button>
                        <button 
                          onClick={() => handleToggleBan(u)}
                          className={`text-[9px] font-black uppercase transition-colors ${u.isBanned ? 'text-emerald-500 hover:text-white' : 'text-red-500 hover:text-red-300'}`}
                        >
                          {u.isBanned ? 'Unban' : 'Suspend'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.username)}
                          className="text-[9px] font-black uppercase text-zinc-800 hover:text-red-500 transition-colors"
                        >
                          Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'withdrawals' && (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-zinc-600 uppercase border-b border-zinc-900">
                  <th className="pb-6 px-4 text-left font-black tracking-widest">Player / Dest.</th>
                  <th className="pb-6 px-4 text-left font-black tracking-widest">Requested Amount</th>
                  <th className="pb-6 px-4 text-left font-black tracking-widest">Status</th>
                  <th className="pb-6 px-4 text-right font-black tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="group hover:bg-white/[0.02]">
                    <td className="py-6 px-4">
                      <div>
                        <p className="font-black text-white">{w.username}</p>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase">{w.upiId}</p>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <p className="font-black text-white text-lg">₹{w.amount.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-zinc-600 font-bold">{new Date(w.timestamp).toLocaleString()}</p>
                    </td>
                    <td className="py-6 px-4">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase border ${
                        w.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        w.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-right">
                      {w.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleWithdrawalAction(w.id, 'Approved')}
                            className="bg-emerald-500 text-black text-[9px] font-black px-3 py-1.5 rounded-lg hover:bg-emerald-400"
                          >
                            APPROVE
                          </button>
                          <button 
                            onClick={() => handleWithdrawalAction(w.id, 'Rejected')}
                            className="bg-red-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg hover:bg-red-400"
                          >
                            REJECT
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'treasury' && (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-8 text-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-4xl border border-emerald-500/20 shadow-2xl">
                🏛️
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Nexus Global Vault</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  The Vault holds the collective liquidity of the platform. Profits are calculated as the total stakes placed minus the payouts awarded to winners.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Collected Stakes</span>
                  <span className="text-xl font-black text-white">₹{houseStats.totalVolume.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Available Profit</span>
                  <span className="text-xl font-black text-emerald-500">₹{houseStats.totalProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={handleWithdrawHouseProfit}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-[2rem] transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-sm active:scale-95"
              >
                Withdraw Profits to Admin Bank
              </button>
              <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">
                * Simulated transfer to external administrative project account.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-900 bg-zinc-950/50 flex justify-between items-center px-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Financial Gateway Secure</span>
          </div>
          <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Profit-To-Admin Routing Enabled</p>
        </div>
      </div>
    </div>
  );
};
