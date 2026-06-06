const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShoppingItem = sequelize.define('ShoppingItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ingredientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  purchased: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = ShoppingItem;
