import React, { useState } from 'react';
import { 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Trash2,
  Calendar,
  User as UserIcon,
  FileDown,
  Search,
  Filter,
  SortDesc,
  RotateCcw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DebtManager = ({ debts, allTransactions = [], cards = [], onAddDebt, onUpdateDebt, onDeleteDebt }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [payingDebtId, setPayingDebtId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [type, setType] = useState('give'); // 'give' (receivable) or 'take' (payable)
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'completed'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ mode: 'all', status: 'all' });
  const [sortBy, setSortBy] = useState('date-desc');
  const [formData, setFormData] = useState({ 
    person: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    due_date: '', 
    notes: '',
    mode: 'Cash',
    customMode: ''
  });

  const downloadPDF = (debt) => {
    try {
      const doc = new jsPDF();
      const paidAmount = parseFloat(debt.amount) - parseFloat(debt.remaining);
      
      // Filter transactions related to this debt
      const relatedTransactions = allTransactions.filter(t => 
        t.category === 'Debt' && t.title.toLowerCase().includes(debt.person.toLowerCase())
      ).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Primary color
      doc.text('Debt Transaction Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      // Section 1: Summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Debt Summary', 14, 45);
      
      const summaryData = [
        ['Property', 'Details'],
        ['Person/Entity', debt.person],
        ['Type', debt.type === 'give' ? 'Receivable (You Gave)' : 'Payable (You Took)'],
        ['Status', debt.status.toUpperCase()],
        ['Initial Date', debt.date],
        ['Total Amount', `INR ${parseFloat(debt.amount).toLocaleString()}`],
        ['Total Paid', `INR ${paidAmount.toLocaleString()}`],
        ['Remaining Balance', `INR ${parseFloat(debt.remaining).toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'striped',
        headStyles: { fillStyle: [79, 70, 229] },
        margin: { left: 14, right: 14 }
      });
      
      // Section 2: Transaction History
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 100;
      doc.setFontSize(14);
      doc.text('Transaction History', 14, finalY + 15);
      
      const historyData = relatedTransactions.length > 0 ? relatedTransactions.map(t => [
        t.date,
        t.title,
        t.type.toUpperCase(),
        `INR ${parseFloat(t.amount).toLocaleString()}`
      ]) : [['-', 'No detailed transactions found', '-', '-']];
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Date', 'Description', 'Type', 'Amount']],
        body: historyData,
        theme: 'grid',
        headStyles: { fillStyle: [100, 116, 139] },
        margin: { left: 14, right: 14 }
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      doc.save(`Debt_Report_${debt.person.replace(/\s+/g, '_')}_${debt.date}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.person || !formData.amount) return;
    
    const finalMode = formData.mode === 'Other' ? formData.customMode : formData.mode;
    
    // Prepare data - ensure empty dates are null for PostgreSQL
    const debtToSave = {
      ...formData,
      mode: finalMode,
      due_date: formData.due_date || null,
      type,
      status: 'pending',
      remaining: parseFloat(formData.amount)
    };
    
    // Remove customMode from output
    delete debtToSave.customMode;
    
    onAddDebt(debtToSave);
    setIsAdding(false);
    setFormData({ 
      person: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      due_date: '', 
      notes: '',
      mode: 'Cash',
      customMode: ''
    });
  };

  const totals = debts.reduce((acc, debt) => {
    if (debt.status === 'completed') return acc;
    if (debt.type === 'give') acc.receivable += debt.remaining;
    else acc.payable += debt.remaining;
    return acc;
  }, { receivable: 0, payable: 0 });

  // Advanced Filtering and Sorting Logic
  const processedDebts = debts
    // 1. View Mode (Active or Completed)
    .filter(d => viewMode === 'active' ? d.status !== 'completed' : d.status === 'completed')
    // 2. Search
    .filter(d => d.person.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase())))
    // 3. Filter by Mode
    .filter(d => filters.mode === 'all' || d.mode === filters.mode)
    // 4. Filter by Status (Pending/Partial)
    .filter(d => {
      if (filters.status === 'all') return true;
      if (filters.status === 'partial') return parseFloat(d.remaining) < parseFloat(d.amount) && d.status !== 'completed';
      if (filters.status === 'pending') return parseFloat(d.remaining) === parseFloat(d.amount) && d.status !== 'completed';
      return true;
    })
    // 5. Sorting
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount-desc') return parseFloat(b.amount) - parseFloat(a.amount);
      if (sortBy === 'amount-asc') return parseFloat(a.amount) - parseFloat(b.amount);
      return 0;
    });

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

      {/* Search and Action Bar */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search by person or notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.8rem' }}
          />
        </div>
        
        {/* Filter Toggle */}
        <div style={{ position: 'relative' }}>
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border)' }}
          >
            <Filter size={18} />
            <span>Filters</span>
            {(filters.mode !== 'all' || filters.status !== 'all' || sortBy !== 'date-desc') && (
              <span style={{ width: '8px', height: '8px', background: 'var(--expense)', borderRadius: '50%', position: 'absolute', top: '10px', right: '10px' }} />
            )}
          </button>

          {/* Filter Dropdown */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="glass-card"
                style={{ 
                  position: 'absolute', top: '120%', right: 0, width: '320px', zIndex: 1000, 
                  padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid var(--border)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontWeight: 600 }}>Filter & Sort</h4>
                  <button 
                    onClick={() => {
                      setFilters({ mode: 'all', status: 'all' });
                      setSortBy('date-desc');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <RotateCcw size={12} /> Clear
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Sorting */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sort By</label>
                    <select 
                      value={sortBy} 
                      onChange={e => setSortBy(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="amount-desc">Amount: High to Low</option>
                      <option value="amount-asc">Amount: Low to High</option>
                    </select>
                  </div>

                  {/* Mode Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Transaction Mode</label>
                    <select 
                      value={filters.mode} 
                      onChange={e => setFilters({...filters, mode: e.target.value})}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <option value="all">All Modes</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      {cards.map(c => (
                        <option key={c.id} value={`${c.bank} (*${c.last_four})`}>{c.bank} (*{c.last_four})</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  {viewMode === 'active' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className={`btn ${filters.status === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setFilters({...filters, status: 'all'})}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                        >All</button>
                        <button 
                          className={`btn ${filters.status === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setFilters({...filters, status: 'pending'})}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                        >Pending</button>
                        <button 
                          className={`btn ${filters.status === 'partial' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setFilters({...filters, status: 'partial'})}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                        >Partial</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Mode of Transaction</label>
                <select 
                  value={formData.mode}
                  onChange={e => setFormData({...formData, mode: e.target.value})}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  {cards.map(card => (
                    <option key={card.id} value={`${card.bank} (*${card.last_four})`}>
                      {card.bank} (*{card.last_four})
                    </option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
              </div>

              {formData.mode === 'Other' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Custom Mode Name</label>
                  <input 
                    placeholder="e.g. GPay, Cheque, etc."
                    value={formData.customMode}
                    onChange={e => setFormData({...formData, customMode: e.target.value})}
                    required={formData.mode === 'Other'}
                  />
                </div>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Toggle Tabs */}
      <div style={{ 
        display: 'flex', 
        background: 'rgba(0,0,0,0.03)', 
        padding: '0.4rem', 
        borderRadius: '14px',
        width: 'fit-content'
      }}>
        <button 
          onClick={() => setViewMode('active')}
          style={{ 
            padding: '0.6rem 1.5rem', 
            borderRadius: '10px', 
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition)',
            border: 'none',
            background: viewMode === 'active' ? 'white' : 'transparent',
            boxShadow: viewMode === 'active' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            color: viewMode === 'active' ? 'var(--primary)' : 'var(--text-dim)'
          }}
        >
          Active Debts ({debts.filter(d => d.status !== 'completed').length})
        </button>
        <button 
          onClick={() => setViewMode('completed')}
          style={{ 
            padding: '0.6rem 1.5rem', 
            borderRadius: '10px', 
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition)',
            border: 'none',
            background: viewMode === 'completed' ? 'white' : 'transparent',
            boxShadow: viewMode === 'completed' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            color: viewMode === 'completed' ? 'var(--primary)' : 'var(--text-dim)'
          }}
        >
          Completed ({debts.filter(d => d.status === 'completed').length})
        </button>
      </div>

      {/* Debt List Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={viewMode}
          initial={{ opacity: 0, x: viewMode === 'active' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: viewMode === 'active' ? 10 : -10 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'active' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {processedDebts.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)', borderStyle: 'dashed' }}>
                  <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>{(searchTerm || filters.mode !== 'all' || filters.status !== 'all') ? 'No active debts match your filters.' : 'No active debts found.'}</p>
                </div>
              ) : (
                processedDebts.map((debt) => (
                    <DebtCard 
                      key={debt.id} 
                      debt={debt} 
                      onUpdateDebt={onUpdateDebt} 
                      onDeleteDebt={onDeleteDebt} 
                      downloadPDF={downloadPDF}
                      payingDebtId={payingDebtId}
                      setPayingDebtId={setPayingDebtId}
                      paymentAmount={paymentAmount}
                      setPaymentAmount={setPaymentAmount}
                    />
                  ))
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {processedDebts.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)', borderStyle: 'dashed' }}>
                  <CheckCircle2 size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>{(searchTerm || filters.mode !== 'all') ? 'No completed debts match your filters.' : 'No completed debts found.'}</p>
                </div>
              ) : (
                processedDebts.map((debt) => (
                    <DebtCard 
                      key={debt.id} 
                      debt={debt} 
                      onUpdateDebt={onUpdateDebt} 
                      onDeleteDebt={onDeleteDebt} 
                      downloadPDF={downloadPDF}
                      payingDebtId={payingDebtId}
                      setPayingDebtId={setPayingDebtId}
                      paymentAmount={paymentAmount}
                      setPaymentAmount={setPaymentAmount}
                    />
                  ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const DebtCard = ({ 
  debt, 
  onUpdateDebt, 
  onDeleteDebt, 
  downloadPDF, 
  payingDebtId, 
  setPayingDebtId, 
  paymentAmount, 
  setPaymentAmount 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass-card" style={{ 
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
          background: '#f8fafc',
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
            {debt.mode && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                 • {debt.mode}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', gap: '1.5rem', marginRight: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Paid</p>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--income)' }}>₹{(parseFloat(debt.amount) - parseFloat(debt.remaining)).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Remaining</p>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{parseFloat(debt.remaining).toLocaleString()}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn-ghost" 
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--primary)' }}
            onClick={() => downloadPDF(debt)}
            title="Download Report"
          >
            <FileDown size={18} />
          </button>
          {debt.status !== 'completed' && (
            <>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid var(--border)' }}
                onClick={() => {
                  setPayingDebtId(payingDebtId === debt.id ? null : debt.id);
                  setPaymentAmount('');
                }}
              >
                Partial
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => onUpdateDebt(debt.id, { status: 'completed' })}
              >
                {debt.type === 'give' ? 'Full Recv' : 'Full Pay'}
              </button>
            </>
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

      {/* Partial Payment Input Area */}
      <AnimatePresence>
        {payingDebtId === debt.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass-card" style={{ 
              margin: '0 1rem 1rem', 
              padding: '1rem', 
              background: 'var(--bg-card-hover)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '1px dashed var(--primary)'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Amount to {debt.type === 'give' ? 'Receive' : 'Repay'}
                </label>
                <input 
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={debt.remaining}
                  style={{ background: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => {
                    if (paymentAmount && parseFloat(paymentAmount) > 0) {
                      onUpdateDebt(debt.id, {}, parseFloat(paymentAmount));
                      setPayingDebtId(null);
                    }
                  }}
                >
                  Confirm
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => setPayingDebtId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DebtManager;
