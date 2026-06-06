const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeCollection = sequelize.define('RecipeCollection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  favoriteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = RecipeCollection;
