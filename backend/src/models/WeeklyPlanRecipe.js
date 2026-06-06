const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeeklyPlanRecipe = sequelize.define('WeeklyPlanRecipe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
});

module.exports = WeeklyPlanRecipe;
