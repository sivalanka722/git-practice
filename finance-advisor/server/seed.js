const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Sample transactions data
const generateTransactions = (userId) => {
  const categories = {
    expense: [
      { category: 'Food & Dining', descriptions: ['Grocery Store', 'Restaurant Dinner', 'Coffee Shop', 'Fast Food', 'Uber Eats Order'] },
      { category: 'Transportation', descriptions: ['Gas Station', 'Uber Ride', 'Metro Card', 'Parking Fee', 'Car Maintenance'] },
      { category: 'Shopping', descriptions: ['Amazon Purchase', 'Target Shopping', 'Clothing Store', 'Electronics Store', 'Home Depot'] },
      { category: 'Entertainment', descriptions: ['Netflix Subscription', 'Spotify Premium', 'Movie Tickets', 'Concert Tickets', 'Gaming Purchase'] },
      { category: 'Bills & Utilities', descriptions: ['Electric Bill', 'Internet Bill', 'Phone Bill', 'Water Bill', 'Rent Payment'] },
      { category: 'Healthcare', descriptions: ['Pharmacy', 'Doctor Visit', 'Dental Checkup', 'Gym Membership', 'Health Insurance'] },
      { category: 'Education', descriptions: ['Online Course', 'Books Purchase', 'School Supplies', 'Tuition Payment'] },
      { category: 'Travel', descriptions: ['Hotel Booking', 'Flight Ticket', 'Vacation Expense', 'Airbnb Stay'] }
    ],
    income: [
      { category: 'Salary', descriptions: ['Monthly Salary', 'Bi-weekly Paycheck', 'Bonus Payment'] },
      { category: 'Freelance', descriptions: ['Freelance Project', 'Consulting Fee', 'Contract Work'] },
      { category: 'Investment', descriptions: ['Dividend Payment', 'Stock Sale', 'Interest Income'] },
      { category: 'Other Income', descriptions: ['Gift Received', 'Refund', 'Cashback Reward'] }
    ]
  };

  const transactions = [];
  const now = new Date();

  // Generate 6 months of transactions
  for (let month = 0; month < 6; month++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
    
    // Add income transactions (1-3 per month)
    const incomeCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < incomeCount; i++) {
      const incomeCategory = categories.income[Math.floor(Math.random() * categories.income.length)];
      const description = incomeCategory.descriptions[Math.floor(Math.random() * incomeCategory.descriptions.length)];
      
      let amount;
      if (incomeCategory.category === 'Salary') {
        amount = 3500 + Math.random() * 2000;
      } else if (incomeCategory.category === 'Freelance') {
        amount = 500 + Math.random() * 1500;
      } else {
        amount = 50 + Math.random() * 500;
      }

      transactions.push({
        user: userId,
        description,
        amount: Math.round(amount * 100) / 100,
        type: 'income',
        category: incomeCategory.category,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.floor(Math.random() * 28) + 1),
        notes: `Sample ${incomeCategory.category.toLowerCase()} transaction`
      });
    }

    // Add expense transactions (15-25 per month)
    const expenseCount = Math.floor(Math.random() * 11) + 15;
    for (let i = 0; i < expenseCount; i++) {
      const expenseCategory = categories.expense[Math.floor(Math.random() * categories.expense.length)];
      const description = expenseCategory.descriptions[Math.floor(Math.random() * expenseCategory.descriptions.length)];
      
      let amount;
      switch (expenseCategory.category) {
        case 'Bills & Utilities':
          amount = 50 + Math.random() * 200;
          break;
        case 'Food & Dining':
          amount = 10 + Math.random() * 100;
          break;
        case 'Transportation':
          amount = 5 + Math.random() * 80;
          break;
        case 'Shopping':
          amount = 20 + Math.random() * 200;
          break;
        case 'Entertainment':
          amount = 10 + Math.random() * 100;
          break;
        case 'Healthcare':
          amount = 20 + Math.random() * 150;
          break;
        case 'Education':
          amount = 30 + Math.random() * 200;
          break;
        case 'Travel':
          amount = 100 + Math.random() * 500;
          break;
        default:
          amount = 10 + Math.random() * 100;
      }

      transactions.push({
        user: userId,
        description,
        amount: Math.round(amount * 100) / 100,
        type: 'expense',
        category: expenseCategory.category,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.floor(Math.random() * 28) + 1),
        notes: `Sample ${expenseCategory.category.toLowerCase()} expense`
      });
    }
  }

  return transactions;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing data');

    // Create demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'demo123',
      monthlyBudget: 3000,
      savingsGoal: 10000
    });
    console.log('Created demo user: demo@example.com / demo123');

    // Create sample transactions
    const transactions = generateTransactions(demoUser._id);
    await Transaction.insertMany(transactions);
    console.log(`Created ${transactions.length} sample transactions`);

    // Create additional test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123',
      monthlyBudget: 2500,
      savingsGoal: 5000
    });
    console.log('Created test user: test@example.com / test123');

    // Create some transactions for test user
    const testTransactions = generateTransactions(testUser._id).slice(0, 50);
    await Transaction.insertMany(testTransactions);
    console.log(`Created ${testTransactions.length} transactions for test user`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('  Email: demo@example.com');
    console.log('  Password: demo123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
