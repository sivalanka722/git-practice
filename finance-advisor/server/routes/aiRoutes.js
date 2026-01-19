const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getFinancialInsights,
  getBudgetSuggestions,
  getSavingTips
} = require('../controllers/aiController');

// All routes require authentication
router.post('/insights', protect, getFinancialInsights);
router.post('/budget-suggestions', protect, getBudgetSuggestions);
router.post('/saving-tips', protect, getSavingTips);

module.exports = router;
