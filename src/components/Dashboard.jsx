import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  User,
  CreditCard as CreditIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const mockChartData = [
  { name: 'Mon', income: 4000, expense: 2400 },
  { name: 'Tue', income: 3000, expense: 1398 },
  { name: 'Wed', income: 2000, expense: 9800 },
  { name: 'Thu', income: 2780, expense: 3908 },
  { name: 'Fri', income: 1890, expense: 4800 },
  { name: 'Sat', income: 2390, expense: 3800 },
  { name: 'Sun', income: 3490, expense: 4300 },
];

const Dashboard = ({ totals, latestTransactions }) => {
  const stats = [
    { label: 'Available Balance', value: `₹${totals.balance.toLocaleString()}`, icon: Wallet, color: 'var(--primary)', glow: 'var(--primary-glow)' },
    { label: 'Total Income', value: `₹${totals.income.toLocaleString()}`, icon: TrendingUp, color: 'var(--income)', glow: 'var(--income-glow)' },
    { label: 'Monthly Expense', value: `₹${totals.expense.toLocaleString()}`, icon: TrendingDown, color: 'var(--expense)', glow: 'var(--expense-glow)' },
    { label: 'Debt Receivable', value: `₹${totals.receivable.toLocaleString()}`, icon: User, color: 'var(--debt)', glow: 'var(--debt-glow)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: stat.glow, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stat.color
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '2rem' 
      }}>
        {/* Main Chart */}
        <div className="glass-card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Cash Flow Analysis</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--income)' }} /> Income
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--expense)' }} /> Expense
                </span>
                <select style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                <option>Last 7 Days</option>
                </select>
            </div>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--income)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--income)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--expense)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-dim)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--text-dim)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--glass-bg)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    color: 'white'
                  }} 
                />
                <Area type="monotone" dataKey="income" stroke="var(--income)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="var(--expense)" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {latestTransactions.length > 0 ? latestTransactions.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {tx.type === 'income' ? <TrendingUp size={18} color="var(--income)" /> : <TrendingDown size={18} color="var(--expense)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tx.title}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.category} • {tx.date}</p>
                </div>
                <p style={{ 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)'
                }}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                </p>
              </div>
            )) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', marginTop: '20%' }}>
                    <p>No recent activity</p>
                </div>
            )}
          </div>

          <div className="glass-card" style={{ marginTop: '2rem', background: 'var(--bg-card-hover)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Clock size={16} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                 Payable Total: <span style={{ color: 'white', fontWeight: 600 }}>₹{totals.payable.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
