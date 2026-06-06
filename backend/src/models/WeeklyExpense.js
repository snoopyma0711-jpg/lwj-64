const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeeklyExpense = sequelize.define('WeeklyExpense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  weekNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  itemCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

module.exports = WeeklyExpense;
