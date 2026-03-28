import React, { useState } from 'react';
import { 
  CreditCard as CardIcon, 
  Plus, 
  TrendingDown, 
  Calendar, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSACTION_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Debt', 'Other'],
  expense: ['Food', 'Travel', 'Rent', 'EMI', 'Shopping', 'Health', 'Entertainment', 'Personal', 'Debt', 'Credit Card', 'Other']
};

const CreditCards = ({ cards, onAddCard, onAddUsage, onAddPayment, onDeleteCard }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingUsage, setIsAddingUsage] = useState(null); // card id
  const [isAddingPayment, setIsAddingPayment] = useState(null); // card id
  const [formData, setFormData] = useState({ bank: '', credit_limit: '', last_four: '', due_date_day: '15' });
  const [usageData, setUsageData] = useState({ amount: '', title: '', date: new Date().toISOString().split('T')[0] });
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!formData.bank || !formData.credit_limit) return;
    
    // Remove 'transactions' as it doesn't exist in Supabase schema
    const { ...cardData } = formData;
    
    onAddCard({ 
      ...cardData, 
      credit_limit: parseFloat(formData.credit_limit), 
      used: 0,
      due_date_day: formData.due_date_day ? parseInt(formData.due_date_day) : null
    });
    
    setIsAdding(false);
    setFormData({ bank: '', credit_limit: '', last_four: '', due_date_day: '15' });
  };

  const handleAddUsageSubmit = (cardId) => {
    if (!usageData.amount) return;
    onAddUsage(cardId, { ...usageData, amount: parseFloat(usageData.amount) });
    setIsAddingUsage(null);
    setUsageData({ amount: '', title: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleAddPaymentSubmit = (cardId) => {
    if (!paymentAmount) return;
    onAddPayment(cardId, parseFloat(paymentAmount));
    setIsAddingPayment(null);
    setPaymentAmount('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem' }}>My Credit Cards</h3>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Add New Card
        </button>
      </div>

      {isAdding && (
        <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
          <form onSubmit={handleAddCard} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Bank Name</label>
              <input placeholder="e.g. HDFC Bank" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Card Last 4 Digits</label>
              <input placeholder="1234" maxLength="4" value={formData.last_four} onChange={e => setFormData({...formData, last_four: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Credit Limit (₹)</label>
              <input type="number" placeholder="50000" value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: e.target.value})} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Statement Date (Day of Month)</label>
              <input type="number" min="1" max="31" value={formData.due_date_day} onChange={e => setFormData({...formData, due_date_day: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Card</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {cards.map(card => {
          const usedPercentage = (card.used / card.credit_limit) * 100;
          return (
            <div key={card.id} className="glass-card" style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              minHeight: '220px',
              color: 'white',
              boxShadow: '0 20px 25px -5px var(--primary-glow)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{card.bank}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>•••• •••• •••• {card.last_four || 'XXXX'}</p>
                </div>
                <CardIcon size={32} style={{ opacity: 0.8, color: 'white' }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Utilized: ₹{parseFloat(card.used).toLocaleString()}</span>
                  <span style={{ fontWeight: 600 }}>₹{parseFloat(card.credit_limit).toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min((parseFloat(card.used) / parseFloat(card.credit_limit)) * 100, 100)}%`, 
                    background: (parseFloat(card.used) / parseFloat(card.credit_limit)) * 100 > 80 ? '#fbbf24' : 'white',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                    transition: 'width 1s ease-out'
                  }} />
                </div>
                {(parseFloat(card.used) / parseFloat(card.credit_limit)) * 100 > 80 && (
                  <p style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={10} /> High credit utilization!
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }} onClick={() => setIsAddingUsage(card.id)}>
                    Add Spend
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}
                    onClick={() => {
                      setIsAddingPayment(card.id);
                      setPaymentAmount(card.used.toString());
                    }}
                  >
                    Pay Due
                  </button>
                </div>
                <button className="btn-ghost" style={{ border: 'none', color: 'rgba(255,255,255,0.8)', padding: '0.4rem' }} onClick={() => onDeleteCard(card.id)}>
                  <Trash2 size={16} />
                </button>
              </div>

              <AnimatePresence>
                {isAddingUsage === card.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ 
                      paddingTop: '1.25rem', 
                      marginTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem' 
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', opacity: 0.8 }}>Spend Description</label>
                        <input 
                          placeholder="e.g. Amazon Shopping" 
                          style={{ 
                            padding: '0.6rem 0.8rem', 
                            fontSize: '0.85rem', 
                            background: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            borderRadius: '8px',
                            color: 'white',
                            outline: 'none'
                          }}
                          value={usageData.title}
                          onChange={e => setUsageData({...usageData, title: e.target.value})}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', opacity: 0.8 }}>Amount (₹)</label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          style={{ 
                            padding: '0.6rem 0.8rem', 
                            fontSize: '0.85rem', 
                            background: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            borderRadius: '8px',
                            color: 'white',
                            outline: 'none'
                          }}
                          value={usageData.amount}
                          onChange={e => setUsageData({...usageData, amount: e.target.value})}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, height: '2.5rem', fontSize: '0.8rem', background: 'white', color: 'var(--primary)', border: 'none' }} onClick={() => handleAddUsageSubmit(card.id)}>
                          Add Spend
                        </button>
                        <button className="btn btn-ghost" style={{ flex: 1, height: '2.5rem', fontSize: '0.8rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setIsAddingUsage(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isAddingPayment === card.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ 
                      paddingTop: '1.25rem', 
                      marginTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem' 
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', opacity: 0.8 }}>Payment Amount (₹)</label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          style={{ 
                            padding: '0.6rem 0.8rem', 
                            fontSize: '0.85rem', 
                            background: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            borderRadius: '8px',
                            color: 'white',
                            outline: 'none'
                          }}
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, height: '2.5rem', fontSize: '0.8rem', background: 'white', color: 'var(--primary)', border: 'none' }} onClick={() => handleAddPaymentSubmit(card.id)}>
                          Confirm Payment
                        </button>
                        <button className="btn btn-ghost" style={{ flex: 1, height: '2.5rem', fontSize: '0.8rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setIsAddingPayment(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      {cards.length === 0 && (
         <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-dim)' }}>
            <CreditCard size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No credit cards tracked yet.</p>
         </div>
      )}
    </div>
  );
};

export default CreditCards;
