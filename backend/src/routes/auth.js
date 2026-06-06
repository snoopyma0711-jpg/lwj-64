const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const user = await User.create({ username, password });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, dailyCalorieGoal: user.dailyCalorieGoal }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, dailyCalorieGoal: user.dailyCalorieGoal }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({
    user: { 
      id: req.user.id, 
      username: req.user.username,
      dailyCalorieGoal: req.user.dailyCalorieGoal
    }
  });
});

router.put('/calorie-goal', auth, async (req, res) => {
  try {
    const { dailyCalorieGoal } = req.body;
    
    if (dailyCalorieGoal === undefined || dailyCalorieGoal === null || isNaN(parseInt(dailyCalorieGoal))) {
      return res.status(400).json({ error: '请输入有效的热量目标' });
    }
    
    const goal = parseInt(dailyCalorieGoal);
    if (goal < 500 || goal > 10000) {
      return res.status(400).json({ error: '热量目标必须在500-10000千卡之间' });
    }
    
    await req.user.update({ dailyCalorieGoal: goal });
    
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        dailyCalorieGoal: goal
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
