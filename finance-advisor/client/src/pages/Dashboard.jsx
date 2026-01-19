import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionService } from '../services/api';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart, FiArrowRight } from 'react-icons/fi';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, transactionsRes] = await Promise.all([
        transactionService.getStats(),
        transactionService.getAll({ limit: 5 })
      ]);
      setStats(statsRes.data);
      setRecentTransactions(transactionsRes.data.transactions);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const categoryColors = {
    'Food & Dining': '#FF6384',
    'Transportation': '#36A2EB',
    'Shopping': '#FFCE56',
    'Entertainment': '#4BC0C0',
    'Bills & Utilities': '#9966FF',
    'Healthcare': '#FF9F40',
    'Education': '#C9CBCF',
    'Travel': '#7C4DFF',
    'Salary': '#00C853',
    'Investment': '#2196F3',
    'Freelance': '#FF5722',
    'Gift': '#E91E63',
    'Other Income': '#8BC34A',
    'Other Expense': '#607D8B'
  };

  const expenseCategories = stats?.categoryStats?.filter(c => c._id.type === 'expense') || [];
  
  const doughnutData = {
    labels: expenseCategories.map(c => c._id.category),
    datasets: [{
      data: expenseCategories.map(c => c.total),
      backgroundColor: expenseCategories.map(c => categoryColors[c._id.category] || '#999'),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15
        }
      }
    }
  };

  // Process monthly trends for bar chart
  const monthlyData = {};
  stats?.monthlyTrends?.forEach(item => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { income: 0, expense: 0 };
    }
    monthlyData[key][item._id.type] = item.total;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const monthLabels = sortedMonths.map(m => {
    const [year, month] = m.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Income',
        data: sortedMonths.map(m => monthlyData[m].income),
        backgroundColor: 'rgba(0, 200, 83, 0.7)',
        borderColor: '#00C853',
        borderWidth: 1
      },
      {
        label: 'Expenses',
        data: sortedMonths.map(m => monthlyData[m].expense),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: '#FF6384',
        borderWidth: 1
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '$' + value.toLocaleString()
        }
      }
    }
  };

  // Net savings trend
  const lineData = {
    labels: monthLabels,
    datasets: [{
      label: 'Net Savings',
      data: sortedMonths.map(m => monthlyData[m].income - monthlyData[m].expense),
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => '$' + value.toLocaleString()
        }
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your financial overview at a glance</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-icon">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>Total Income</h3>
            <p className="stat-value">{formatCurrency(stats?.summary?.totalIncome || 0)}</p>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon">
            <FiTrendingDown />
          </div>
          <div className="stat-content">
            <h3>Total Expenses</h3>
            <p className="stat-value">{formatCurrency(stats?.summary?.totalExpenses || 0)}</p>
          </div>
        </div>

        <div className="stat-card savings">
          <div className="stat-icon">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h3>Net Savings</h3>
            <p className="stat-value">{formatCurrency(stats?.summary?.netSavings || 0)}</p>
          </div>
        </div>

        <div className="stat-card rate">
          <div className="stat-icon">
            <FiPieChart />
          </div>
          <div className="stat-content">
            <h3>Savings Rate</h3>
            <p className="stat-value">{stats?.summary?.savingsRate || 0}%</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Spending by Category</h3>
          <div className="chart-container doughnut">
            {expenseCategories.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <p className="no-data">No expense data available</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Income vs Expenses</h3>
          <div className="chart-container bar">
            {sortedMonths.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Savings Trend</h3>
          <div className="chart-container line">
            {sortedMonths.length > 0 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <div className="section-header">
          <h3>Recent Transactions</h3>
          <Link to="/transactions" className="view-all">
            View All <FiArrowRight />
          </Link>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map(transaction => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-description">{transaction.description}</span>
                  <span className="transaction-category">{transaction.category}</span>
                </div>
                <div className="transaction-details">
                  <span className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                  <span className="transaction-date">{formatDate(transaction.date)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-transactions">
            <p>No transactions yet. <Link to="/transactions">Add your first transaction</Link></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
