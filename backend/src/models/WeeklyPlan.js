const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeeklyPlan = sequelize.define('WeeklyPlan', {
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
  }
});

module.exports = WeeklyPlan;
