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
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '热量密度（千卡/100克）'
  },
  protein: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '蛋白质（克/100克）'
  },
  carbs: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '碳水化合物（克/100克）'
  },
  fat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '脂肪（克/100克）'
  }
});

IngredientPrice.UNITS = UNITS;

module.exports = IngredientPrice;
