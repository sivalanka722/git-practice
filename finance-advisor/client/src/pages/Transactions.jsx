import { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiFilter, FiX, FiDownload } from 'react-icons/fi';

const CATEGORIES = {
  expense: [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Other Expense'
  ],
  income: [
    'Salary',
    'Investment',
    'Freelance',
    'Gift',
    'Other Income'
  ]
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 20,
        ...filters
      };
      
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await transactionService.getAll(params);
      setTransactions(response.data.transactions);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.totalPages,
        total: response.data.total
      }));
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTransaction) {
        await transactionService.update(editingTransaction._id, formData);
        toast.success('Transaction updated');
      } else {
        await transactionService.create(formData);
        toast.success('Transaction added');
      }
      
      setShowModal(false);
      resetForm();
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await transactionService.delete(id);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: new Date(transaction.date).toISOString().split('T')[0],
      notes: transaction.notes || ''
    });
    setShowModal(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await transactionService.upload(formData);
      toast.success(response.data.message);
      setShowUploadModal(false);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingTransaction(null);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadSampleCSV = () => {
    const csvContent = `date,description,amount
2024-01-15,Grocery Store,-85.50
2024-01-14,Monthly Salary,3500.00
2024-01-13,Netflix Subscription,-15.99
2024-01-12,Gas Station,-45.00
2024-01-11,Restaurant Dinner,-65.00`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Manage your income and expenses</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => setShowUploadModal(true)}
          >
            <FiUpload /> Upload CSV
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <FiPlus /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="form-group">
              <label>Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <optgroup label="Expenses">
                  {CATEGORIES.expense.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                <optgroup label="Income">
                  {CATEGORIES.income.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-outline" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Transactions List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : transactions.length > 0 ? (
        <>
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction._id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>
                      <div className="transaction-desc">
                        {transaction.description}
                        {transaction.notes && (
                          <span className="transaction-notes">{transaction.notes}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`category-badge ${transaction.type}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon"
                          onClick={() => handleEdit(transaction)}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(transaction._id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                className="btn btn-outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <h3>No transactions found</h3>
          <p>Add your first transaction or upload a CSV file to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                    onClick={() => setFormData({ 
                      ...formData, 
                      type: 'expense',
                      category: CATEGORIES.expense[0]
                    })}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}
                    onClick={() => setFormData({ 
                      ...formData, 
                      type: 'income',
                      category: CATEGORIES.income[0]
                    })}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Grocery shopping"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES[formData.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload CSV</h2>
              <button className="btn-icon" onClick={() => setShowUploadModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="upload-content">
              <p>Upload a CSV file with your bank transactions. The file should have columns for:</p>
              <ul>
                <li><strong>date</strong> - Transaction date</li>
                <li><strong>description</strong> - Transaction description</li>
                <li><strong>amount</strong> - Transaction amount (negative for expenses)</li>
              </ul>
              
              <div className="upload-area">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleUpload}
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="upload-label">
                  <FiUpload />
                  <span>Click to upload or drag and drop</span>
                  <span className="upload-hint">CSV files only, max 5MB</span>
                </label>
              </div>

              <button className="btn btn-outline" onClick={downloadSampleCSV}>
                <FiDownload /> Download Sample CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
