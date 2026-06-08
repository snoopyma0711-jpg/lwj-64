const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FridgeIngredient = sequelize.define('FridgeIngredient', {
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
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期日期'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注信息'
  }
});

FridgeIngredient.prototype.getExpiryStatus = function() {
  if (!this.expiryDate) {
    return { status: 'normal', daysLeft: null, color: '#8c8c8c' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const expiry = new Date(this.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', daysLeft: diffDays, color: '#ff4d4f' };
  } else if (diffDays <= 3) {
    return { status: 'warning', daysLeft: diffDays, color: '#faad14' };
  } else {
    return { status: 'normal', daysLeft: diffDays, color: '#52c41a' };
  }
};

module.exports = FridgeIngredient;
