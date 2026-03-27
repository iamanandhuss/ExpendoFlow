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
  Loader2
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
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(transactions.filter(t => t.id !== id));
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
  };

  const updateDebt = async (id, updates) => {
    const { data, error } = await supabase.from('debts').update(updates).eq('id', id).select();
    if (data) {
      const updatedDebt = data[0];
      setDebts(debts.map(d => d.id === id ? updatedDebt : d));

      // If marked as completed, create settlement transaction
      if (updates.status === 'completed') {
        addTransaction({
          title: updatedDebt.type === 'give' ? `Debt Received from ${updatedDebt.person}` : `Debt Repaid to ${updatedDebt.person}`,
          amount: updatedDebt.amount,
          type: updatedDebt.type === 'give' ? 'income' : 'expense',
          category: 'Debt',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  };

  const deleteDebt = async (id) => {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (!error) setDebts(debts.filter(d => d.id !== id));
  };

  const addCard = async (card) => {
    const { id, ...cardData } = card;
    const { data, error } = await supabase.from('credit_cards').insert([{ ...cardData, user_id: session.user.id }]).select();
    if (data) setCards([data[0], ...cards]);
  };

  const updateCardUsage = async (cardId, usage) => {
    const card = cards.find(c => c.id === cardId);
    const newUsed = card.used + usage.amount;
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
    if (data) setCards(cards.map(c => c.id === cardId ? data[0] : c));
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
            {activeTab === 'transactions' && <Transactions transactions={transactions} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} />}
            {activeTab === 'debts' && <DebtManager debts={debts} onAddDebt={addDebt} onUpdateDebt={updateDebt} onDeleteDebt={deleteDebt} />}
            {activeTab === 'cards' && <CreditCards cards={cards} onAddCard={addCard} onAddUsage={updateCardUsage} onAddPayment={addCardPayment} onDeleteCard={deleteCard} />}
            
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
    </div>
  );
}

export default App;
