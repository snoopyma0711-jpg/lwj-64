const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeCollectionFavorite = sequelize.define('RecipeCollectionFavorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'recipeCollectionUser'
  },
  recipeCollectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'recipeCollectionUser'
  }
});

module.exports = RecipeCollectionFavorite;
