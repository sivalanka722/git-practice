import { useState, useEffect } from 'react';
import { aiService } from '../services/api';
import { toast } from 'react-toastify';
import { FiTrendingUp, FiAlertCircle, FiCheckCircle, FiTarget, FiDollarSign, FiPieChart, FiRefreshCw } from 'react-icons/fi';

const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [budgetSuggestions, setBudgetSuggestions] = useState(null);
  const [savingTips, setSavingTips] = useState(null);
  const [loading, setLoading] = useState({
    insights: true,
    budget: true,
    tips: true
  });
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    fetchInsights();
    fetchBudgetSuggestions();
    fetchSavingTips();
  };

  const fetchInsights = async () => {
    try {
      setLoading(prev => ({ ...prev, insights: true }));
      const response = await aiService.getInsights();
      setInsights(response.data);
    } catch (error) {
      toast.error('Failed to load insights');
    } finally {
      setLoading(prev => ({ ...prev, insights: false }));
    }
  };

  const fetchBudgetSuggestions = async () => {
    try {
      setLoading(prev => ({ ...prev, budget: true }));
      const response = await aiService.getBudgetSuggestions();
      setBudgetSuggestions(response.data);
    } catch (error) {
      toast.error('Failed to load budget suggestions');
    } finally {
      setLoading(prev => ({ ...prev, budget: false }));
    }
  };

  const fetchSavingTips = async () => {
    try {
      setLoading(prev => ({ ...prev, tips: true }));
      const response = await aiService.getSavingTips();
      setSavingTips(response.data);
    } catch (error) {
      toast.error('Failed to load saving tips');
    } finally {
      setLoading(prev => ({ ...prev, tips: false }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderInsightsTab = () => {
    if (loading.insights) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analyzing your finances...</p>
        </div>
      );
    }

    if (!insights) {
      return <p className="no-data">No insights available</p>;
    }

    const { insights: data, source } = insights;

    return (
      <div className="insights-content">
        {source && (
          <div className="source-badge">
            Powered by {source === 'openai' ? 'AI' : 'Smart Analysis'}
          </div>
        )}

        <div className="insight-card health">
          <div className="insight-header">
            <FiTrendingUp className="insight-icon" />
            <h3>Financial Health Assessment</h3>
          </div>
          <p>{data.healthAssessment}</p>
        </div>

        <div className="insights-grid">
          <div className="insight-card concerns">
            <div className="insight-header">
              <FiAlertCircle className="insight-icon" />
              <h3>Areas of Concern</h3>
            </div>
            <ul>
              {data.concerns?.length > 0 ? (
                data.concerns.map((concern, index) => (
                  <li key={index}>{concern}</li>
                ))
              ) : (
                <li>No major concerns identified</li>
              )}
            </ul>
          </div>

          <div className="insight-card positives">
            <div className="insight-header">
              <FiCheckCircle className="insight-icon" />
              <h3>Positive Observations</h3>
            </div>
            <ul>
              {data.positives?.length > 0 ? (
                data.positives.map((positive, index) => (
                  <li key={index}>{positive}</li>
                ))
              ) : (
                <li>Keep tracking to see positive trends</li>
              )}
            </ul>
          </div>
        </div>

        <div className="insight-card recommendations">
          <div className="insight-header">
            <FiTarget className="insight-icon" />
            <h3>Recommendations</h3>
          </div>
          <ul>
            {data.recommendations?.length > 0 ? (
              data.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))
            ) : (
              <li>Add more transactions to get personalized recommendations</li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderBudgetTab = () => {
    if (loading.budget) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating budget suggestions...</p>
        </div>
      );
    }

    if (!budgetSuggestions) {
      return <p className="no-data">No budget suggestions available</p>;
    }

    const { suggestions, currentSpending } = budgetSuggestions;

    return (
      <div className="budget-content">
        <div className="budget-summary">
          <div className="summary-card">
            <FiDollarSign className="summary-icon" />
            <div>
              <h4>Recommended Savings</h4>
              <p className="summary-value">{formatCurrency(suggestions.savingsTarget || 0)}/month</p>
            </div>
          </div>
        </div>

        <div className="budget-section">
          <h3>Suggested Category Budgets</h3>
          <div className="budget-grid">
            {suggestions.categoryBudgets && Object.entries(suggestions.categoryBudgets).map(([category, amount]) => (
              <div key={category} className="budget-item">
                <span className="budget-category">{category}</span>
                <span className="budget-amount">{formatCurrency(amount)}</span>
                {currentSpending?.byCategory?.[category] && (
                  <span className={`budget-diff ${currentSpending.byCategory[category] > amount ? 'over' : 'under'}`}>
                    Current: {formatCurrency(currentSpending.byCategory[category])}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {suggestions.reductionAreas?.length > 0 && (
          <div className="budget-section">
            <h3>Areas to Reduce Spending</h3>
            <div className="reduction-list">
              {suggestions.reductionAreas.map((area, index) => (
                <div key={index} className="reduction-item">
                  <FiAlertCircle />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestions.tips?.length > 0 && (
          <div className="budget-section">
            <h3>Budget Tips</h3>
            <ul className="tips-list">
              {suggestions.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderTipsTab = () => {
    if (loading.tips) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating saving tips...</p>
        </div>
      );
    }

    if (!savingTips) {
      return <p className="no-data">No saving tips available</p>;
    }

    const { tips, topSpendingCategories } = savingTips;

    return (
      <div className="tips-content">
        {topSpendingCategories?.length > 0 && (
          <div className="spending-overview">
            <h3>Your Top Spending Categories</h3>
            <div className="spending-bars">
              {topSpendingCategories.map(([category, amount], index) => (
                <div key={category} className="spending-bar-item">
                  <div className="spending-bar-label">
                    <span>{category}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                  <div className="spending-bar">
                    <div 
                      className="spending-bar-fill"
                      style={{ 
                        width: `${(amount / topSpendingCategories[0][1]) * 100}%`,
                        backgroundColor: `hsl(${index * 40}, 70%, 50%)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tips-section">
          <h3>Personalized Saving Tips</h3>
          <div className="tips-grid">
            {tips?.map((tip, index) => (
              <div key={index} className="tip-card">
                <div className="tip-number">{index + 1}</div>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="insights-page">
      <div className="page-header">
        <div>
          <h1>AI Financial Insights</h1>
          <p>Smart analysis and recommendations for your finances</p>
        </div>
        <button className="btn btn-outline" onClick={fetchAllData}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="insights-tabs">
        <button
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <FiPieChart /> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <FiDollarSign /> Budget
        </button>
        <button
          className={`tab-btn ${activeTab === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          <FiTarget /> Saving Tips
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'budget' && renderBudgetTab()}
        {activeTab === 'tips' && renderTipsTab()}
      </div>
    </div>
  );
};

export default Insights;
