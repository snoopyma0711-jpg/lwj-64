const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeCollectionRecipe = sequelize.define('RecipeCollectionRecipe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recipeCollectionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recipeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = RecipeCollectionRecipe;
