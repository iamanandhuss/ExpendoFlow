import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Wallet, 
  Handshake, 
  CreditCard as CreditCardIcon, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut,
  Bell,
  User,
  History,
  TrendingUp,
  Clock,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// Components
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import DebtManager from './components/DebtManager';
import CreditCards from './components/CreditCards';
import Auth from './components/auth/Auth';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  // Global State
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else {
        setProfile(null);
        setTransactions([]);
        setDebts([]);
        setCards([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async (userId) => {
    setLoading(true);
    try {
      const [profileRes, txRes, debtRes, cardRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('debts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('credit_cards').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (txRes.data) setTransactions(txRes.data);
      if (debtRes.data) setDebts(debtRes.data);
      if (cardRes.data) setCards(cardRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers - Sync with Supabase
  const addTransaction = async (tx) => {
    const { id, ...txData } = tx;
    const { data, error } = await supabase.from('transactions').insert([{ ...txData, user_id: session.user.id }]).select();
    if (data) setTransactions([data[0], ...transactions]);
    if (error) console.error('Error adding transaction:', error);
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(transactions.filter(t => t.id !== id));
    else console.error('Error deleting transaction:', error);
  };

  const addDebt = async (debt) => {
    const { id, ...debtData } = debt;
    const { data, error } = await supabase.from('debts').insert([{ ...debtData, user_id: session.user.id }]).select();
    if (data) {
      const newDebt = data[0];
      setDebts([newDebt, ...debts]);
      
      // Sync with Transactions
      addTransaction({
        title: newDebt.type === 'give' ? `Debt Given to ${newDebt.person}` : `Debt Taken from ${newDebt.person}`,
        amount: newDebt.amount,
        type: newDebt.type === 'give' ? 'expense' : 'income',
        category: 'Debt',
        date: newDebt.date
      });
    }
    if (error) console.error('Error adding debt:', error);
  };

  const updateDebt = async (id, updates, paymentAmount = null) => {
    // If it's a partial payment, we calculate the new remaining
    let finalUpdates = { ...updates };
    const debt = debts.find(d => d.id === id);
    
    if (paymentAmount) {
      const newRemaining = Math.max(0, parseFloat(debt.remaining) - parseFloat(paymentAmount));
      finalUpdates.remaining = newRemaining;
      if (newRemaining <= 0) finalUpdates.status = 'completed';
      
      // Create transaction for this partial payment
      addTransaction({
        title: debt.type === 'give' ? `Partial Receipt from ${debt.person}` : `Partial Repayment to ${debt.person}`,
        amount: paymentAmount,
        type: debt.type === 'give' ? 'income' : 'expense',
        category: 'Debt',
        date: new Date().toISOString().split('T')[0]
      });
    } else if (updates.status === 'completed' && debt.status !== 'completed') {
      // Full settlement if marked completed without specific paymentAmount
      addTransaction({
        title: debt.type === 'give' ? `Full Receipt from ${debt.person}` : `Full Repayment to ${debt.person}`,
        amount: debt.remaining,
        type: debt.type === 'give' ? 'income' : 'expense',
        category: 'Debt',
        date: new Date().toISOString().split('T')[0]
      });
      finalUpdates.remaining = 0;
    }

    const { data, error } = await supabase.from('debts').update(finalUpdates).eq('id', id).select();
    if (data) {
      setDebts(debts.map(d => d.id === id ? data[0] : d));
    }
    if (error) console.error('Error updating debt:', error);
  };

  const deleteDebt = async (id) => {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (!error) setDebts(debts.filter(d => d.id !== id));
  };

  const confirmAction = (title, message, onConfirm, isDestructive = true) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      isDestructive,
      onConfirm: async () => {
        await onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateTransaction = async (id, updates) => {
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select();
    if (data) setTransactions(transactions.map(t => t.id === id ? data[0] : t));
    if (error) console.error('Error updating transaction:', error);
  };

  const addCard = async (card) => {
    const { id, ...cardData } = card;
    const { data, error } = await supabase.from('credit_cards').insert([{ ...cardData, user_id: session.user.id }]).select();
    if (data) setCards([data[0], ...cards]);
    if (error) console.error('Error adding card:', error);
  };

  const updateCardUsage = async (cardId, usage) => {
    const card = cards.find(c => c.id === cardId);
    const newUsed = parseFloat(card.used) + parseFloat(usage.amount);
    const { data, error } = await supabase.from('credit_cards').update({ used: newUsed }).eq('id', cardId).select();
    if (data) {
      setCards(cards.map(c => c.id === cardId ? data[0] : c));
      addTransaction({
        title: `CC: ${usage.title}`,
        amount: usage.amount,
        type: 'expense',
        category: 'Credit Card',
        date: usage.date
      });
    }
  };

  const addCardPayment = async (cardId, amount) => {
    const card = cards.find(c => c.id === cardId);
    const newUsed = Math.max(0, card.used - amount);
    const { data, error } = await supabase.from('credit_cards').update({ used: newUsed }).eq('id', cardId).select();
    if (data) {
      setCards(cards.map(c => c.id === cardId ? data[0] : c));
      
      // Add transaction for card payment
      addTransaction({
        title: `CC Payment: ${card.bank}`,
        amount: amount,
        type: 'expense',
        category: 'Credit Card',
        date: new Date().toISOString().split('T')[0]
      });
    }
    if (error) console.error('Error adding card payment:', error);
  };

  const deleteCard = async (id) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (!error) setCards(cards.filter(c => c.id !== id));
  };

  const updateProfile = async (updates) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', session.user.id).select().single();
    if (data) setProfile(data);
    return { data, error };
  };

  const calculateTotals = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Balance is now simple income - expense because debts are tracked as transactions
    const balance = income - expense;

    const receivable = debts.filter(d => d.type === 'give' && d.status !== 'completed').reduce((sum, d) => sum + parseFloat(d.remaining), 0);
    const payable = debts.filter(d => d.type === 'take' && d.status !== 'completed').reduce((sum, d) => sum + parseFloat(d.remaining), 0);

    return {
      balance,
      income,
      expense,
      receivable,
      payable
    };
  };

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  if (loading && transactions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  const totals = calculateTotals();
  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'transactions', icon: History, label: 'Transactions' },
    { id: 'debts', icon: Handshake, label: 'Debt Manager' },
    { id: 'cards', icon: CreditCardIcon, label: 'Credit Cards' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar" style={{ 
        width: '280px', background: 'var(--glass-bg)', borderRight: '1px solid var(--border)',
        padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 100
      }}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ 
            width: '40px', height: '40px', background: 'var(--primary)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            <Wallet size={24} color="white" />
          </div>
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700 }}>FinTrack</h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', width: '100%', border: 'none', padding: '0.8rem 1rem' }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="user-profile glass-card" style={{ padding: '1rem', marginTop: '2rem', background: 'white', borderColor: 'var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <User size={18} />
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {profile?.full_name || session.user.email.split('@')[0]}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Sync Active</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Real-time overview of your personal finances.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="glass-card" style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Bell size={20} />
            </button>
            <button className="btn btn-primary" onClick={() => setActiveTab('transactions')}>
              <Plus size={20} />
               Quick Entry
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard totals={totals} latestTransactions={transactions.slice(0, 5)} allTransactions={transactions} />}
            {activeTab === 'transactions' && (
              <Transactions 
                transactions={transactions} 
                onAddTransaction={addTransaction} 
                onUpdateTransaction={(id, updates) => confirmAction('Update Transaction', 'Are you sure you want to save these changes? This will permanently modify the record.', () => updateTransaction(id, updates), false)}
                onDeleteTransaction={(id) => confirmAction('Delete Transaction', 'Are you sure you want to delete this record? This action cannot be undone.', () => deleteTransaction(id))} 
              />
            )}
            {activeTab === 'debts' && (
              <DebtManager 
                debts={debts} 
                allTransactions={transactions} 
                cards={cards} 
                onAddDebt={addDebt} 
                onUpdateDebt={(id, updates, paymentAmount = null) => {
                  // If it's a simple status change or payment, don't necessarily show warning unless it's a full edit
                  const isFullEdit = updates.person || updates.amount || updates.date;
                  if (isFullEdit) {
                    confirmAction('Update Debt Entry', 'Are you sure you want to save these changes to the debt record?', () => updateDebt(id, updates, paymentAmount), false);
                  } else {
                    updateDebt(id, updates, paymentAmount);
                  }
                }} 
                onDeleteDebt={(id) => confirmAction('Delete Debt', 'Are you sure you want to delete this debt entry? This will permanently remove the record.', () => deleteDebt(id))} 
              />
            )}
            {activeTab === 'cards' && (
              <CreditCards 
                cards={cards} 
                onAddCard={addCard} 
                onAddUsage={updateCardUsage} 
                onAddPayment={(id, amount) => confirmAction('Confirm Payment', `Are you sure you want to record a payment of ₹${amount.toLocaleString()}?`, () => addCardPayment(id, amount), false)}
                onDeleteCard={(id) => confirmAction('Delete Card', 'Are you sure you want to delete this credit card? All card history will be removed.', () => deleteCard(id))} 
              />
            )}
            
            {activeTab === 'settings' && (
              <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <User size={40} color="var(--primary)" />
                  </div>
                  <h3>Account Settings</h3>
                  <p style={{ color: 'var(--text-muted)' }}>{session.user.email}</p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const name = e.target.display_name.value;
                  const { error } = await updateProfile({ full_name: name });
                  if (!error) alert('Profile updated!');
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Display Name</label>
                    <input type="text" name="display_name" defaultValue={profile?.full_name} placeholder="Your full name" />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Profile</button>
                    <button type="button" className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Sign Out</button>
                  </div>
                </form>
                
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={() => fetchAllData(session.user.id)}>Force Sync Refresh</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 10000, padding: '1rem'
          }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ 
                width: '100%', maxWidth: '400px', padding: '2rem', background: 'white', 
                position: 'relative', zIndex: 1, borderRadius: '24px', textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ef4444'
              }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{confirmDialog.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>{confirmDialog.message}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  className="btn btn-ghost" 
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className="btn" 
                  style={{ 
                    flex: 1, padding: '0.75rem', 
                    background: confirmDialog.isDestructive !== false ? '#ef4444' : 'var(--primary)', 
                    color: 'white', 
                    border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' 
                  }}
                >
                  {confirmDialog.isDestructive !== false ? 'Delete' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
