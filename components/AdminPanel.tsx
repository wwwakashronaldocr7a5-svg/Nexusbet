
import React, { useState, useEffect, useMemo } from 'react';
import { User, WithdrawalRequest, HouseStats, Transaction } from '../types';
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
  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'kyc' | 'ledger' | 'treasury'>('users');
  
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  
  const [isHarvestConfirmOpen, setIsHarvestConfirmOpen] = useState(false);
  const [harvestInput, setHarvestInput] = useState('');

  useEffect(() => { refreshData(); }, []);

  const refreshData = () => {
    setUsers(authService.getUsers());
    setWithdrawals(authService.getWithdrawalRequests());
    setHouseStats(authService.getHouseStats());
    setLedger(authService.getGlobalLedger());
  };

  const pendingKycUsers = useMemo(() => users.filter(u => u.kycStatus === 'Pending'), [users]);

  const handleKycAction = (username: string, status: 'Verified' | 'Rejected') => {
    const user = users.find(u => u.username === username);
    if (!user) return;
    authService.saveUser({ ...user, kycStatus: status });
    refreshData();
  };

  const handleWithdrawalAction = (id: string, status: 'Approved' | 'Rejected') => {
    if (confirm(`Confirm ${status} for this withdrawal?`)) {
      authService.updateWithdrawalStatus(id, status);
      refreshData();
      onRefreshUser();
    }
  };

  const handleBanUser = (username: string) => {
    if (confirm(`Are you sure you want to ${users.find(u => u.username === username)?.isBanned ? 'Unban' : 'Ban'} this user?`)) {
      authService.toggleUserBan(username);
      refreshData();
    }
  };

  const handleBalanceAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser || !adjustAmount) return;
    authService.adjustUserBalance(adjustingUser.username, parseFloat(adjustAmount), adjustReason);
    setAdjustingUser(null);
    setAdjustAmount('');
    setAdjustReason('');
    refreshData();
    onRefreshUser();
  };

  const executeHarvest = () => {
    if (harvestInput !== 'CONFIRM') return;
    const profit = houseStats.totalProfit;
    authService.updateHouseStats({ totalTreasury: houseStats.totalTreasury - profit, totalProfit: 0 });
    authService.saveUser({ ...currentUser, balance: currentUser.balance + profit });
    setHarvestInput('');
    setIsHarvestConfirmOpen(false);
    refreshData();
    onRefreshUser();
    alert(`₹${profit.toLocaleString()} harvested.`);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900/20">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Nexus Command</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Financial Oversight</h2>
            </div>
            <div className="flex gap-4 mt-2 overflow-x-auto no-scrollbar">
              {['users', 'withdrawals', 'kyc', 'ledger', 'treasury'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)} 
                  className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${activeTab === tab ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {tab}
                  {tab === 'withdrawals' && withdrawals.some(w => w.status === 'Pending') && <span className="ml-1 w-2 h-2 rounded-full bg-red-500 inline-block"></span>}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-all">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.username} className={`bg-zinc-900/50 p-6 rounded-3xl border ${u.isBanned ? 'border-red-500/30' : 'border-zinc-800'} flex items-center justify-between`}>
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-zinc-500 font-black ${u.isBanned ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800'}`}>
                        {u.isBanned ? '🚫' : u.username[0].toUpperCase()}
                      </div>
                      <div>
                         <p className="font-black text-white flex items-center gap-2">
                           {u.username}
                           {u.isBanned && <span className="text-[8px] bg-red-500 text-white px-1.5 rounded uppercase">Suspended</span>}
                         </p>
                         <p className="text-[10px] text-zinc-600 font-bold uppercase">{u.email} • KYC: {u.kycStatus}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right">
                         <p className="text-emerald-400 font-black text-lg">₹{u.balance.toLocaleString()}</p>
                         <div className="flex gap-3 justify-end mt-1">
                            <button onClick={() => setAdjustingUser(u)} className="text-[8px] font-black text-zinc-500 uppercase hover:text-emerald-500 transition-colors">Adjust</button>
                            <button onClick={() => handleBanUser(u.username)} className={`text-[8px] font-black uppercase transition-colors ${u.isBanned ? 'text-emerald-500 hover:text-emerald-400' : 'text-red-500 hover:text-red-400'}`}>
                              {u.isBanned ? 'Reactivate' : 'Suspend'}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-2">
               <div className="grid grid-cols-5 px-6 mb-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  <span>Type</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Method</span>
                  <span>Time</span>
               </div>
               {ledger.map(tx => (
                 <div key={tx.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 grid grid-cols-5 items-center hover:bg-zinc-900/60 transition-colors">
                    <span className={`text-[10px] font-black uppercase ${tx.type.includes('Winnings') || tx.type === 'Bonus' || tx.type === 'Deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type.replace('_', ' ')}
                    </span>
                    <span className="font-black text-white">₹{tx.amount.toLocaleString()}</span>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full inline-block w-fit uppercase ${
                      tx.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                      tx.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.status}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase truncate pr-4">{tx.method || 'Internal Slip'}</span>
                    <span className="text-[10px] text-zinc-600 font-medium">{new Date(tx.timestamp).toLocaleString()}</span>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              {withdrawals.filter(w => w.status === 'Pending').length === 0 ? (
                <div className="py-20 text-center opacity-20">
                   <p className="text-4xl">🏧</p>
                   <p className="text-xs font-black uppercase tracking-widest mt-4">No pending payout requests</p>
                </div>
              ) : (
                withdrawals.filter(w => w.status === 'Pending').map(w => {
                  const user = users.find(u => u.username === w.username);
                  return (
                    <div key={w.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between">
                       <div>
                          <p className="text-2xl font-black text-white">₹{w.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                            {w.username} → {w.upiId} 
                            <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">Balance: ₹{user?.balance.toLocaleString()}</span>
                          </p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleWithdrawalAction(w.id, 'Approved')} className="bg-emerald-500 text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Approve Payout</button>
                          <button onClick={() => handleWithdrawalAction(w.id, 'Rejected')} className="bg-zinc-800 text-red-500 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-zinc-700 hover:bg-zinc-700 transition-all">Decline</button>
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="space-y-4">
              {pendingKycUsers.length === 0 ? (
                <div className="py-20 text-center opacity-20"><p className="text-4xl">🛡️</p><p className="text-xs font-black uppercase tracking-widest mt-4">Queue Clear</p></div>
              ) : (
                pendingKycUsers.map(u => (
                  <div key={u.username} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h4 className="font-black text-white text-lg">{u.kycDetails?.fullName}</h4>
                           <p className="text-[10px] text-emerald-500 font-bold uppercase">{u.kycDetails?.idType}: {u.kycDetails?.idNumber}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleKycAction(u.username, 'Verified')} className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Approve</button>
                           <button onClick={() => handleKycAction(u.username, 'Rejected')} className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Reject</button>
                        </div>
                     </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'treasury' && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
               <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-4xl border border-emerald-500/20">🏛️</div>
               <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                     <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Platform Vol.</p>
                     <p className="text-xl font-black text-white">₹{houseStats.totalVolume.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                     <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Net Profit</p>
                     <p className="text-xl font-black text-emerald-500">₹{houseStats.totalProfit.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                     <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Vault Reserve</p>
                     <p className="text-xl font-black text-white">₹{houseStats.totalTreasury.toLocaleString()}</p>
                  </div>
               </div>
               <button onClick={() => setIsHarvestConfirmOpen(true)} className="w-full max-w-md bg-emerald-500 text-black font-black py-6 rounded-3xl uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 active:scale-95">Harvest Platform Profit</button>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
           <form onSubmit={handleBalanceAdjustment} className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Adjust Wallet</h3>
              <p className="text-zinc-500 text-xs mb-6 font-medium">Username: <span className="text-white">{adjustingUser.username}</span></p>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Amount (Negative to debit)</label>
                    <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white font-black" placeholder="e.g. 500 or -500" required />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Reason</label>
                    <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm" placeholder="Manual Deposit / Correction" required />
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                 <button type="button" onClick={() => setAdjustingUser(null)} className="flex-1 text-zinc-500 font-black uppercase text-[10px]">Cancel</button>
                 <button type="submit" className="flex-1 bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase text-[10px]">Update</button>
              </div>
           </form>
        </div>
      )}
      
      {/* Harvest Confirm */}
      {isHarvestConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-md">
           <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 w-full max-w-sm text-center">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">Confirm Harvest</h3>
              <p className="text-zinc-500 text-xs mb-6 font-medium">Type <span className="text-emerald-500 font-bold uppercase">CONFIRM</span> to harvest profits to your account.</p>
              <input type="text" value={harvestInput} onChange={(e) => setHarvestInput(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-center text-white font-black uppercase mb-6" placeholder="..." />
              <div className="flex gap-4">
                 <button onClick={() => setIsHarvestConfirmOpen(false)} className="flex-1 text-zinc-600 font-black uppercase text-[10px]">Cancel</button>
                 <button onClick={executeHarvest} disabled={harvestInput !== 'CONFIRM'} className="flex-1 bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase text-[10px] disabled:opacity-20">Execute</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
