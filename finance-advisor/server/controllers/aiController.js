const OpenAI = require('openai');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Initialize OpenAI client
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// @desc    Get AI-powered financial insights
// @route   POST /api/ai/insights
// @access  Private
const getFinancialInsights = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get last 3 months of transactions
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: threeMonthsAgo }
    }).sort({ date: -1 });

    if (transactions.length === 0) {
      return res.json({
        insights: generateDefaultInsights(),
        source: 'default'
      });
    }

    // Calculate spending summary
    const summary = calculateSpendingSummary(transactions);
    
    const openai = getOpenAIClient();
    
    if (!openai) {
      // Return rule-based insights if OpenAI is not configured
      return res.json({
        insights: generateRuleBasedInsights(summary, user),
        source: 'rule-based'
      });
    }

    // Generate AI insights
    const prompt = buildInsightsPrompt(summary, user);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful personal finance advisor. Provide actionable, specific advice based on the user\'s spending data. Be encouraging but honest about areas for improvement.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      insights: parseAIResponse(aiResponse),
      summary,
      source: 'openai'
    });
  } catch (error) {
    console.error('AI insights error:', error);
    
    // Fallback to rule-based insights on error
    try {
      const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 }).limit(100);
      const summary = calculateSpendingSummary(transactions);
      const user = await User.findById(req.user._id);
      
      return res.json({
        insights: generateRuleBasedInsights(summary, user),
        source: 'rule-based',
        note: 'Using rule-based analysis'
      });
    } catch (fallbackError) {
      res.status(500).json({ message: 'Error generating insights' });
    }
  }
};

// @desc    Get budget suggestions
// @route   POST /api/ai/budget-suggestions
// @access  Private
const getBudgetSuggestions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get last month's transactions
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: oneMonthAgo }
    });

    const summary = calculateSpendingSummary(transactions);
    
    const openai = getOpenAIClient();
    
    if (!openai) {
      return res.json({
        suggestions: generateRuleBasedBudget(summary, user),
        source: 'rule-based'
      });
    }

    const prompt = `Based on the following monthly spending data, suggest a realistic budget:

Monthly Income: $${summary.totalIncome.toFixed(2)}
Monthly Expenses: $${summary.totalExpenses.toFixed(2)}
Current Savings Goal: $${user.savingsGoal || 0}

Spending by Category:
${Object.entries(summary.byCategory)
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`)
  .join('\n')}

Please provide:
1. A recommended monthly budget for each category
2. Areas where spending could be reduced
3. A realistic savings target
4. Tips for sticking to the budget

Format your response as JSON with keys: categoryBudgets (object), reductionAreas (array), savingsTarget (number), tips (array)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial planning expert. Provide practical budget recommendations in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.5
    });

    let suggestions;
    try {
      const responseText = completion.choices[0].message.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : generateRuleBasedBudget(summary, user);
    } catch {
      suggestions = generateRuleBasedBudget(summary, user);
    }

    res.json({
      suggestions,
      currentSpending: summary,
      source: 'openai'
    });
  } catch (error) {
    console.error('Budget suggestions error:', error);
    
    try {
      const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 }).limit(100);
      const summary = calculateSpendingSummary(transactions);
      const user = await User.findById(req.user._id);
      
      return res.json({
        suggestions: generateRuleBasedBudget(summary, user),
        source: 'rule-based'
      });
    } catch (fallbackError) {
      res.status(500).json({ message: 'Error generating budget suggestions' });
    }
  }
};

// @desc    Get saving tips
// @route   POST /api/ai/saving-tips
// @access  Private
const getSavingTips = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense'
    }).sort({ date: -1 }).limit(200);

    const summary = calculateSpendingSummary(transactions);
    
    const openai = getOpenAIClient();
    
    if (!openai) {
      return res.json({
        tips: generateRuleBasedSavingTips(summary),
        source: 'rule-based'
      });
    }

    const topCategories = Object.entries(summary.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const prompt = `A user wants to save more money. Their top spending categories are:
${topCategories.map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`).join('\n')}

Their savings goal is: $${user.savingsGoal || 'Not set'}
Current monthly savings rate: ${summary.savingsRate}%

Provide 5-7 specific, actionable saving tips tailored to their spending patterns. Focus on practical ways to reduce spending in their top categories.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a frugal living expert. Provide specific, practical money-saving tips.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    const tips = completion.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(tip => tip.length > 10);

    res.json({
      tips,
      topSpendingCategories: topCategories,
      source: 'openai'
    });
  } catch (error) {
    console.error('Saving tips error:', error);
    
    try {
      const transactions = await Transaction.find({ user: req.user._id, type: 'expense' }).limit(100);
      const summary = calculateSpendingSummary(transactions);
      
      return res.json({
        tips: generateRuleBasedSavingTips(summary),
        source: 'rule-based'
      });
    } catch (fallbackError) {
      res.status(500).json({ message: 'Error generating saving tips' });
    }
  }
};

// Helper functions
function calculateSpendingSummary(transactions) {
  const summary = {
    totalIncome: 0,
    totalExpenses: 0,
    byCategory: {},
    transactionCount: transactions.length,
    savingsRate: 0
  };

  transactions.forEach(t => {
    if (t.type === 'income') {
      summary.totalIncome += t.amount;
    } else {
      summary.totalExpenses += t.amount;
      summary.byCategory[t.category] = (summary.byCategory[t.category] || 0) + t.amount;
    }
  });

  if (summary.totalIncome > 0) {
    summary.savingsRate = ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome * 100).toFixed(2);
  }

  return summary;
}

function buildInsightsPrompt(summary, user) {
  return `Analyze this financial data and provide insights:

Income: $${summary.totalIncome.toFixed(2)}
Expenses: $${summary.totalExpenses.toFixed(2)}
Net: $${(summary.totalIncome - summary.totalExpenses).toFixed(2)}
Savings Rate: ${summary.savingsRate}%
Monthly Budget Goal: $${user.monthlyBudget || 'Not set'}
Savings Goal: $${user.savingsGoal || 'Not set'}

Spending by Category:
${Object.entries(summary.byCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)} (${(amount / summary.totalExpenses * 100).toFixed(1)}%)`)
  .join('\n')}

Provide:
1. Overall financial health assessment
2. Top 3 areas of concern
3. Top 3 positive observations
4. 3 specific actionable recommendations`;
}

function parseAIResponse(response) {
  const sections = response.split(/\d+\.\s+/);
  return {
    raw: response,
    healthAssessment: sections[1]?.trim() || 'Analysis complete',
    concerns: extractListItems(sections[2] || ''),
    positives: extractListItems(sections[3] || ''),
    recommendations: extractListItems(sections[4] || '')
  };
}

function extractListItems(text) {
  return text
    .split(/[-•]\s*/)
    .map(item => item.trim())
    .filter(item => item.length > 5);
}

function generateDefaultInsights() {
  return {
    healthAssessment: 'Start tracking your transactions to get personalized insights!',
    concerns: ['No transaction data available yet'],
    positives: ['You\'ve taken the first step by setting up your account'],
    recommendations: [
      'Add your first transaction manually or upload a CSV file',
      'Set a monthly budget goal in your profile',
      'Define a savings target to track your progress'
    ]
  };
}

function generateRuleBasedInsights(summary, user) {
  const insights = {
    healthAssessment: '',
    concerns: [],
    positives: [],
    recommendations: []
  };

  // Health assessment
  const savingsRate = parseFloat(summary.savingsRate);
  if (savingsRate >= 20) {
    insights.healthAssessment = 'Excellent! You\'re saving more than 20% of your income.';
  } else if (savingsRate >= 10) {
    insights.healthAssessment = 'Good progress! You\'re saving between 10-20% of your income.';
  } else if (savingsRate > 0) {
    insights.healthAssessment = 'You\'re saving some money, but there\'s room for improvement.';
  } else {
    insights.healthAssessment = 'Your expenses exceed your income. Let\'s work on a budget.';
  }

  // Find top spending categories
  const sortedCategories = Object.entries(summary.byCategory)
    .sort((a, b) => b[1] - a[1]);

  // Concerns
  if (savingsRate < 10) {
    insights.concerns.push('Your savings rate is below the recommended 10-20%');
  }
  
  const topCategory = sortedCategories[0];
  if (topCategory && topCategory[1] > summary.totalExpenses * 0.4) {
    insights.concerns.push(`${topCategory[0]} accounts for over 40% of your spending`);
  }

  if (summary.byCategory['Entertainment'] > summary.totalIncome * 0.1) {
    insights.concerns.push('Entertainment spending is high relative to income');
  }

  // Positives
  if (savingsRate > 0) {
    insights.positives.push(`You're saving ${savingsRate}% of your income`);
  }
  
  if (summary.transactionCount > 10) {
    insights.positives.push('You\'re actively tracking your finances');
  }

  if (!summary.byCategory['Entertainment'] || summary.byCategory['Entertainment'] < summary.totalIncome * 0.05) {
    insights.positives.push('Your entertainment spending is well controlled');
  }

  // Recommendations
  if (savingsRate < 20) {
    insights.recommendations.push('Try to increase your savings rate to at least 20%');
  }

  if (sortedCategories.length > 0) {
    insights.recommendations.push(`Review your ${sortedCategories[0][0]} spending for potential savings`);
  }

  if (!user.monthlyBudget) {
    insights.recommendations.push('Set a monthly budget to better track your spending');
  }

  if (!user.savingsGoal) {
    insights.recommendations.push('Define a savings goal to stay motivated');
  }

  return insights;
}

function generateRuleBasedBudget(summary, user) {
  const monthlyIncome = summary.totalIncome || 3000;
  
  // 50/30/20 rule as baseline
  const needs = monthlyIncome * 0.5;
  const wants = monthlyIncome * 0.3;
  const savings = monthlyIncome * 0.2;

  return {
    categoryBudgets: {
      'Bills & Utilities': needs * 0.4,
      'Food & Dining': needs * 0.3,
      'Transportation': needs * 0.2,
      'Healthcare': needs * 0.1,
      'Shopping': wants * 0.4,
      'Entertainment': wants * 0.3,
      'Travel': wants * 0.2,
      'Other': wants * 0.1
    },
    reductionAreas: Object.entries(summary.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat),
    savingsTarget: savings,
    tips: [
      'Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings',
      'Track every expense for a month to identify spending patterns',
      'Set up automatic transfers to savings on payday',
      'Review subscriptions and cancel unused services',
      'Use cash for discretionary spending to stay within budget'
    ]
  };
}

function generateRuleBasedSavingTips(summary) {
  const tips = [
    'Create a meal plan to reduce food waste and dining out expenses',
    'Use public transportation or carpool when possible',
    'Cancel unused subscriptions and memberships',
    'Wait 24-48 hours before making non-essential purchases',
    'Set up automatic savings transfers on payday',
    'Use cashback apps and credit card rewards wisely',
    'Compare prices before major purchases'
  ];

  // Add category-specific tips
  if (summary.byCategory['Food & Dining'] > 500) {
    tips.unshift('Consider meal prepping to reduce restaurant spending');
  }
  
  if (summary.byCategory['Entertainment'] > 200) {
    tips.unshift('Look for free entertainment options in your area');
  }

  if (summary.byCategory['Shopping'] > 300) {
    tips.unshift('Implement a 30-day waiting period for non-essential purchases');
  }

  return tips.slice(0, 7);
}

module.exports = {
  getFinancialInsights,
  getBudgetSuggestions,
  getSavingTips
};
