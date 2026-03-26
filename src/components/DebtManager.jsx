import React, { useState } from 'react';
import { 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Trash2,
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DebtManager = ({ debts, onAddDebt, onUpdateDebt, onDeleteDebt }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState('give'); // 'give' (receivable) or 'take' (payable)
  const [formData, setFormData] = useState({ person: '', amount: '', date: new Date().toISOString().split('T')[0], dueDate: '', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.person || !formData.amount) return;
    onAddDebt({ ...formData, type, id: Date.now(), status: 'pending', remaining: parseFloat(formData.amount) });
    setIsAdding(false);
    setFormData({ person: '', amount: '', date: new Date().toISOString().split('T')[0], dueDate: '', notes: '' });
  };

  const totals = debts.reduce((acc, debt) => {
    if (debt.status === 'completed') return acc;
    if (debt.type === 'give') acc.receivable += debt.remaining;
    else acc.payable += debt.remaining;
    return acc;
  }, { receivable: 0, payable: 0 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Debt Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--income)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Receivable (You Gave)</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--income)' }}>₹{totals.receivable.toLocaleString()}</h2>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid var(--expense)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Payable (You Took)</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--expense)' }}>₹{totals.payable.toLocaleString()}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem' }}>Active Debts</h3>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <UserPlus size={18} />
          Add Debt Entry
        </button>
      </div>

      {/* Adding Modal/Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card"
            style={{ padding: '2rem', border: '1px solid var(--primary)' }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Transaction Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    className={`btn ${type === 'give' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                    onClick={() => setType('give')}
                  >
                    I Gave Money
                  </button>
                  <button 
                    type="button"
                    className={`btn ${type === 'take' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, background: type === 'take' ? 'var(--expense)' : 'transparent' }}
                    onClick={() => setType('take')}
                  >
                    I Took Money
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Person Name</label>
                <input 
                  placeholder="e.g. Rahul Sharma"
                  value={formData.person}
                  onChange={e => setFormData({...formData, person: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debt List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {debts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
            <UserIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No debt records found.</p>
          </div>
        ) : (
          debts.map((debt) => (
            <div key={debt.id} className="glass-card" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.5rem', 
              padding: '1.25rem 1.5rem',
              borderLeft: `4px solid ${debt.type === 'give' ? 'var(--income)' : 'var(--expense)'}`
            }}>
              <div style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: debt.type === 'give' ? 'var(--income)' : 'var(--expense)'
              }}>
                {debt.type === 'give' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontWeight: 600 }}>{debt.person}</h4>
                  <span className={`status-badge ${debt.status === 'completed' ? 'status-income' : 'status-debt'}`} style={{ fontSize: '0.7rem' }}>
                    {debt.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> {debt.date}
                  </span>
                  {debt.type === 'give' ? (
                    <span style={{ color: 'var(--income)' }}>Receivable</span>
                  ) : (
                    <span style={{ color: 'var(--expense)' }}>Payable</span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Remaining</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{parseFloat(debt.remaining).toLocaleString()}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {debt.status !== 'completed' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => onUpdateDebt(debt.id, { remaining: 0, status: 'completed' })}
                  >
                    {debt.type === 'give' ? 'Received' : 'Repaid'}
                  </button>
                )}
                <button 
                  className="btn-ghost" 
                  style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', color: 'var(--expense)' }}
                  onClick={() => onDeleteDebt(debt.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebtManager;
