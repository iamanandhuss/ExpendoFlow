import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2,
  Calendar,
  Tag,
  FileText
} from 'lucide-react';

const TRANSACTION_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Travel', 'Rent', 'EMI', 'Shopping', 'Health', 'Entertainment', 'Personal', 'Other']
};

const Transactions = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({ 
    title: '', 
    amount: '', 
    type: 'expense', 
    category: 'Food', 
    date: new Date().toISOString().split('T')[0],
    notes: '' 
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    onAddTransaction({ ...formData, id: Date.now(), amount: parseFloat(formData.amount) });
    setIsAdding(false);
    setFormData({ 
      title: '', amount: '', type: 'expense', category: 'Food', 
      date: new Date().toISOString().split('T')[0], notes: '' 
    });
  };

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('all')}
          >All</button>
          <button 
            className={`btn ${filterType === 'income' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('income')}
          >Income</button>
          <button 
            className={`btn ${filterType === 'expense' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('expense')}
          >Expense</button>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Add New
        </button>
      </div>

      {isAdding && (
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
            <div style={{ gridColumn: '1 / span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Description</label>
              <input 
                placeholder="e.g. Dinner with Friends"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value, category: TRANSACTION_CATEGORIES[e.target.value][0]})}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {TRANSACTION_CATEGORIES[formData.type].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Amount (₹)</label>
              <input 
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Date</label>
              <input 
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Entry</button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <th style={{ padding: '1rem' }}>Transaction</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', 
                      background: tx.type === 'income' ? 'var(--income-glow)' : 'var(--expense-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {tx.type === 'income' ? <ArrowUpRight size={16} color="var(--income)" /> : <ArrowDownLeft size={16} color="var(--expense)" />}
                    </div>
                    <span style={{ fontWeight: 500 }}>{tx.title}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '6px', 
                    background: 'var(--bg-card-hover)', color: 'var(--text-muted)' 
                  }}>
                    {tx.category}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{tx.date}</td>
                <td style={{ 
                  padding: '1rem', textAlign: 'right', fontWeight: 700,
                  color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)'
                }}>
                  {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    className="btn-ghost" 
                    style={{ border: 'none', color: 'var(--expense)', padding: '0.4rem' }}
                    onClick={() => onDeleteTransaction(tx.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No transactions found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
