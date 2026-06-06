const express = require('express');
const { WeeklyExpense, Op } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.ceil(diff / oneWeek);
  return { weekNumber, year: now.getFullYear() };
};

router.get('/trend', auth, async (req, res) => {
  try {
    const { weeks = 8 } = req.query;
    const { weekNumber: currentWeek, year: currentYear } = getCurrentWeek();
    const weekCount = parseInt(weeks) || 8;
    
    const weeksToFetch = [];
    let week = currentWeek;
    let year = currentYear;
    
    for (let i = 0; i < weekCount; i++) {
      weeksToFetch.push({ weekNumber: week, year });
      week--;
      if (week < 1) {
        week = 52;
        year--;
      }
    }
    
    const orConditions = weeksToFetch.map(w => ({
      userId: req.user.id,
      weekNumber: w.weekNumber,
      year: w.year
    }));
    
    const expenses = await WeeklyExpense.findAll({
      where: {
        [Op.or]: orConditions
      },
      order: [['year', 'ASC'], ['weekNumber', 'ASC']]
    });
    
    const expenseMap = new Map();
    for (const exp of expenses) {
      const key = `${exp.year}-${exp.weekNumber}`;
      expenseMap.set(key, {
        weekNumber: exp.weekNumber,
        year: exp.year,
        totalAmount: parseFloat(exp.totalAmount),
        itemCount: exp.itemCount,
        weekLabel: `${exp.year}年第${exp.weekNumber}周`
      });
    }
    
    const trendData = [];
    for (const w of weeksToFetch.reverse()) {
      const key = `${w.year}-${w.weekNumber}`;
      if (expenseMap.has(key)) {
        trendData.push(expenseMap.get(key));
      }
    }
    
    res.json(trendData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/current', auth, async (req, res) => {
  try {
    const { weekNumber, year } = getCurrentWeek();
    
    const expense = await WeeklyExpense.findOne({
      where: {
        userId: req.user.id,
        weekNumber,
        year
      }
    });
    
    res.json(expense || null);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
