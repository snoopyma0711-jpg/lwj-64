const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
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
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('ingredients');
      return raw ? JSON.parse(raw) : [];
    },
    set(value) {
      this.setDataValue('ingredients', JSON.stringify(value));
    }
  },
  steps: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  estimatedTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '预计耗时（分钟）'
  },
  difficulty: {
    type: DataTypes.ENUM('简单', '中等', '困难'),
    allowNull: false
  },
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  madeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Recipe;
