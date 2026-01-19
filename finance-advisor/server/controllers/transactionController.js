const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const fs = require('fs');

// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, category, type, page = 1, limit = 50 } = req.query;
    
    let query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) query.category = category;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, type, category, date, notes, isRecurring } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      description,
      amount: Math.abs(amount),
      type,
      category,
      date: date || new Date(),
      notes,
      isRecurring
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { description, amount, type, category, date, notes, isRecurring } = req.body;

    transaction.description = description || transaction.description;
    transaction.amount = amount !== undefined ? Math.abs(amount) : transaction.amount;
    transaction.type = type || transaction.type;
    transaction.category = category || transaction.category;
    transaction.date = date || transaction.date;
    transaction.notes = notes !== undefined ? notes : transaction.notes;
    transaction.isRecurring = isRecurring !== undefined ? isRecurring : transaction.isRecurring;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload CSV and parse transactions
// @route   POST /api/transactions/upload
// @access  Private
const uploadTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        const transactions = [];
        
        for (const row of results) {
          try {
            // Try to parse common CSV formats
            const description = row.description || row.Description || row.memo || row.Memo || row.name || row.Name || '';
            const amountStr = row.amount || row.Amount || row.value || row.Value || '0';
            const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0;
            const dateStr = row.date || row.Date || row.transaction_date || row.TransactionDate || new Date().toISOString();
            const category = categorizeTransaction(description);
            const type = amount < 0 ? 'expense' : 'income';

            if (description && amount !== 0) {
              transactions.push({
                user: req.user._id,
                description: description.substring(0, 200),
                amount: Math.abs(amount),
                type,
                category,
                date: new Date(dateStr),
                notes: `Imported from CSV`
              });
            }
          } catch (err) {
            errors.push({ row, error: err.message });
          }
        }

        if (transactions.length > 0) {
          await Transaction.insertMany(transactions);
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: `Successfully imported ${transactions.length} transactions`,
          imported: transactions.length,
          errors: errors.length,
          errorDetails: errors.slice(0, 5)
        });
      })
      .on('error', (error) => {
        fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Error parsing CSV file', error: error.message });
      });
  } catch (error) {
    console.error('Upload transactions error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to categorize transactions based on description
function categorizeTransaction(description) {
  const desc = description.toLowerCase();
  
  const categories = {
    'Food & Dining': ['restaurant', 'food', 'cafe', 'coffee', 'pizza', 'burger', 'grocery', 'supermarket', 'uber eats', 'doordash', 'grubhub'],
    'Transportation': ['uber', 'lyft', 'gas', 'fuel', 'parking', 'transit', 'metro', 'bus', 'train', 'airline', 'flight'],
    'Shopping': ['amazon', 'walmart', 'target', 'store', 'shop', 'mall', 'clothing', 'electronics'],
    'Entertainment': ['netflix', 'spotify', 'hulu', 'movie', 'theater', 'concert', 'game', 'steam'],
    'Bills & Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'utility', 'insurance', 'rent', 'mortgage'],
    'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health', 'dental', 'vision'],
    'Education': ['school', 'university', 'college', 'course', 'book', 'tuition', 'education'],
    'Travel': ['hotel', 'airbnb', 'vacation', 'travel', 'booking'],
    'Salary': ['salary', 'payroll', 'wage', 'direct deposit'],
    'Investment': ['dividend', 'interest', 'investment', 'stock', 'crypto'],
    'Freelance': ['freelance', 'consulting', 'contract', 'gig']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }

  return 'Other Expense';
}

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = { user: req.user._id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Get category breakdown
    const categoryStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get monthly trends
    const monthlyTrends = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get totals
    const totals = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const income = totals.find(t => t._id === 'income')?.total || 0;
    const expenses = totals.find(t => t._id === 'expense')?.total || 0;

    res.json({
      categoryStats,
      monthlyTrends,
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        netSavings: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadTransactions,
  getTransactionStats
};
