const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const ratingRoutes = require('./routes/ratings');
const weeklyPlanRoutes = require('./routes/weekly-plans');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/weekly-plans', weeklyPlanRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '菜谱工坊系统运行正常' });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    await sequelize.sync({ force: false });
    console.log('数据库同步完成');

    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
