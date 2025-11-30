import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import logo from './assets/nonna-logo.png';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = 'http://localhost:8000/api';

// ============== Logo Component ==============
const NonnaLogo = () => (
  <img src={logo} alt="Nonna" className="nonna-logo" />
);

// ============== Main App Component ==============
function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Notes-style input state
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Edit modal state
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get category ID by name
  const getCategoryId = (categoryName) => {
    const cat = categories.find(c => c.name === categoryName);
    return cat ? cat.id : categories[0]?.id;
  };

  // Parse natural language input with AI
  const handleParseInput = async () => {
    if (!inputText.trim()) return;
    
    setIsParsing(true);
    try {
      const response = await fetch(`${API_URL}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setParsedData({
          ...result.data,
          category_id: getCategoryId(result.data.category),
          date: new Date().toISOString().split('T')[0],
        });
        setShowConfirm(true);
      } else {
        alert('Could not parse transaction. Try: "Starbucks $8.45" or "Paycheck $2500"');
      }
    } catch (error) {
      console.error('Error parsing:', error);
      alert('Error connecting to AI. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Enter key in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isParsing) {
      handleParseInput();
    }
  };

  // Confirm and save parsed transaction
  const handleConfirmTransaction = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(parsedData.amount),
          description: parsedData.description,
          transaction_type: parsedData.transaction_type,
          category_id: parseInt(parsedData.category_id),
          date: new Date(parsedData.date).toISOString(),
        }),
      });

      if (response.ok) {
        setInputText('');
        setParsedData(null);
        setShowConfirm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  // Cancel parsed transaction
  const handleCancelParse = () => {
    setParsedData(null);
    setShowConfirm(false);
  };

  // Open edit modal
  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      amount: transaction.amount,
      description: transaction.description,
      transaction_type: transaction.transaction_type,
      category_id: transaction.category.id,
      date: transaction.date.split('T')[0],
    });
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save edited transaction
  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          amount: parseFloat(editFormData.amount),
          category_id: parseInt(editFormData.category_id),
          date: new Date(editFormData.date).toISOString(),
        }),
      });

      if (response.ok) {
        setEditingTransaction(null);
        setEditFormData(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  // Handle transaction deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    
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
          <NonnaLogo />
          <span className="tagline">Alla fine, tutto torna.</span>
        </div>
      </header>

      <main className="main">
        {/* AI Input Section */}
        <div className="ai-input-section">
          <div className="ai-input-container">
            <input
              type="text"
              className="ai-input"
              placeholder='Type a transaction... (e.g., "Starbucks $8.45" or "Paycheck $2500")'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isParsing}
            />
            <button 
              className="ai-input-btn"
              onClick={handleParseInput}
              disabled={isParsing || !inputText.trim()}
            >
              {isParsing ? '...' : '→'}
            </button>
          </div>
          
          {/* Confirmation Card */}
          {showConfirm && parsedData && (
            <div className="confirm-card">
              <div className="confirm-header">
                <span className="confirm-label">Nonna understood:</span>
              </div>
              <div className="confirm-details">
                <div className="confirm-row">
                  <span className="confirm-description">{parsedData.description}</span>
                  <span className={`confirm-amount ${parsedData.transaction_type}`}>
                    {parsedData.transaction_type === 'expense' ? '-' : '+'}
                    {formatCurrency(parsedData.amount)}
                  </span>
                </div>
                <div className="confirm-meta">
                  <select
                    value={parsedData.category_id}
                    onChange={(e) => setParsedData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="confirm-select"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={parsedData.date}
                    onChange={(e) => setParsedData(prev => ({ ...prev, date: e.target.value }))}
                    className="confirm-date"
                  />
                  <div className="confirm-type-toggle">
                    <button
                      className={parsedData.transaction_type === 'expense' ? 'active' : ''}
                      onClick={() => setParsedData(prev => ({ ...prev, transaction_type: 'expense' }))}
                    >
                      Expense
                    </button>
                    <button
                      className={parsedData.transaction_type === 'income' ? 'active' : ''}
                      onClick={() => setParsedData(prev => ({ ...prev, transaction_type: 'income' }))}
                    >
                      Income
                    </button>
                  </div>
                </div>
              </div>
              <div className="confirm-actions">
                <button className="btn-cancel" onClick={handleCancelParse}>Cancel</button>
                <button className="btn-confirm" onClick={handleConfirmTransaction}>Add Transaction</button>
              </div>
            </div>
          )}
        </div>

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
                <div className="empty-state-icon">👓</div>
                <p className="empty-state-text">No transactions yet. Type one above!</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="transaction-item"
                    onClick={() => handleEditClick(transaction)}
                  >
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
                          {transaction.category.name}
                        </div>
                      </div>
                    </div>
                    <div className="transaction-right">
                      <div className={`transaction-amount ${transaction.transaction_type}`}>
                        {transaction.transaction_type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="transaction-date">
                        {formatDate(transaction.date)}
                        <button
                          className="btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(transaction);
                          }}
                          title="Edit"
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Chart */}
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
      </main>

      {/* Edit Modal */}
      {editingTransaction && editFormData && (
        <div className="modal-overlay" onClick={() => setEditingTransaction(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Transaction</h3>
              <button className="modal-close" onClick={() => setEditingTransaction(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={editFormData.amount}
                    onChange={handleEditChange}
                    className="form-input"
                    step="0.01"
                    min="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editFormData.date}
                    onChange={handleEditChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category_id"
                    value={editFormData.category_id}
                    onChange={handleEditChange}
                    className="form-select"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    name="transaction_type"
                    value={editFormData.transaction_type}
                    onChange={handleEditChange}
                    className="form-select"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-delete"
                onClick={() => {
                  handleDelete(editingTransaction.id);
                  setEditingTransaction(null);
                }}
              >
                Delete
              </button>
              <div className="modal-footer-right">
                <button className="btn-cancel" onClick={() => setEditingTransaction(null)}>Cancel</button>
                <button className="btn-confirm" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
