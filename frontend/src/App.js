import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = 'http://localhost:8000/api';

// ============== Glasses Logo Component ==============
const GlassesIcon = () => (
  <svg viewBox="0 0 220 80" className="logo-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="45" rx="30" ry="28" stroke="#1a1a1a" strokeWidth="2"/>
    <path d="M 30 35 Q 45 20 60 18 Q 75 20 90 35" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round"/>
    <ellipse cx="160" cy="45" rx="30" ry="28" stroke="#1a1a1a" strokeWidth="2"/>
    <path d="M 130 35 Q 145 20 160 18 Q 175 20 190 35" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round"/>
    <line x1="90" y1="32" x2="130" y2="32" stroke="#1a1a1a" strokeWidth="2"/>
  </svg>
);

// ============== Main App Component ==============
function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    transaction_type: 'expense',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [transRes, catRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/transactions`),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/analytics/summary`),
      ]);

      const [transData, catData, analyticsData] = await Promise.all([
        transRes.json(),
        catRes.json(),
        analyticsRes.json(),
      ]);

      setTransactions(transData);
      setCategories(catData);
      setAnalytics(analyticsData);

      // Set default category
      if (catData.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: catData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [formData.category_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          category_id: parseInt(formData.category_id),
          date: new Date(formData.date).toISOString(),
        }),
      });

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        }));
        fetchData();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  // Handle transaction deletion
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Chart data
  const chartData = analytics?.by_category?.length > 0 ? {
    labels: analytics.by_category.map(c => c.category_name),
    datasets: [{
      data: analytics.by_category.map(c => c.total),
      backgroundColor: analytics.by_category.map(c => c.category_color),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: 'DM Sans' },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = formatCurrency(context.raw);
            const percentage = analytics.by_category[context.dataIndex].percentage;
            return ` ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '65%',
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <GlassesIcon />
            <h1>Nonna</h1>
          </div>
          <span className="tagline">Financial wisdom, passed down.</span>
        </div>
      </header>

      <main className="main">
        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card income">
            <div className="summary-label">Total Income</div>
            <div className="summary-value positive">
              {formatCurrency(analytics?.total_income || 0)}
            </div>
          </div>
          <div className="summary-card expenses">
            <div className="summary-label">Total Expenses</div>
            <div className="summary-value negative">
              {formatCurrency(analytics?.total_expenses || 0)}
            </div>
          </div>
          <div className="summary-card balance">
            <div className="summary-label">Net Balance</div>
            <div className={`summary-value ${(analytics?.net_balance || 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(analytics?.net_balance || 0)}
            </div>
          </div>
        </div>

        <div className="dashboard">
          {/* Transactions Section */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Transactions</h2>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <p className="empty-state-text">No transactions yet. Add your first one!</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-info">
                      <div
                        className="transaction-category"
                        style={{ backgroundColor: transaction.category.color }}
                      />
                      <div className="transaction-details">
                        <div className="transaction-description">
                          {transaction.description}
                        </div>
                        <div className="transaction-meta">
                          {transaction.category.name} • {formatDate(transaction.date)}
                        </div>
                      </div>
                    </div>
                    <div className={`transaction-amount ${transaction.transaction_type}`}>
                      {transaction.transaction_type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="transaction-actions">
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(transaction.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Add Transaction Form */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <h2 className="card-title">Add Transaction</h2>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={formData.transaction_type === 'expense' ? 'active' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'expense' }))}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={formData.transaction_type === 'income' ? 'active' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'income' }))}
                  >
                    Income
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="What was this for?"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Add Transaction
                </button>
              </form>
            </div>

            {/* Spending Chart */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Spending by Category</h2>
              </div>

              {chartData ? (
                <div className="chart-container">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-state-text">Add expenses to see your breakdown</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
