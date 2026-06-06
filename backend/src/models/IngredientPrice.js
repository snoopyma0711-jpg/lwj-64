const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UNITS = ['元/斤', '元/个', '元/克', '元/毫升'];

const IngredientPrice = sequelize.define('IngredientPrice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ingredientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [UNITS]
    }
  }
});

IngredientPrice.UNITS = UNITS;

module.exports = IngredientPrice;
