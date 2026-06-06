const { IngredientPrice } = require('../models');

const UNIT_CONVERSIONS = {
  '斤': { target: '斤', factor: 1 },
  '斤左右': { target: '斤', factor: 1 },
  'g': { target: '克', factor: 1 },
  '克': { target: '克', factor: 1 },
  'ml': { target: '毫升', factor: 1 },
  '毫升': { target: '毫升', factor: 1 },
  '个': { target: '个', factor: 1 },
  '只': { target: '个', factor: 1 },
  '颗': { target: '个', factor: 1 },
  '片': { target: '个', factor: 1 }
};

const PRICE_UNIT_MAP = {
  '元/斤': '斤',
  '元/个': '个',
  '元/克': '克',
  '元/毫升': '毫升'
};

const parseQuantity = (quantityStr) => {
  const items = quantityStr.split('+').map(item => item.trim());
  const results = [];
  
  for (const item of items) {
    const match = item.match(/([\d.]+)\s*(.*)/);
    if (match) {
      results.push({
        amount: parseFloat(match[1]),
        unit: match[2] || ''
      });
    }
  }
  
  return results;
};

const convertUnit = (amount, fromUnit) => {
  const conversion = UNIT_CONVERSIONS[fromUnit];
  if (conversion) {
    return { amount: amount * conversion.factor, unit: conversion.target };
  }
  return { amount, unit: fromUnit };
};

const calculateItemPrice = async (userId, ingredientName, quantityStr) => {
  const priceRecord = await IngredientPrice.findOne({
    where: {
      userId,
      ingredientName: ingredientName.toLowerCase()
    }
  });
  
  if (!priceRecord) {
    return {
      estimatedPrice: null,
      unitPrice: null,
      unit: null,
      isPriced: false
    };
  }
  
  const targetUnit = PRICE_UNIT_MAP[priceRecord.unit];
  const quantities = parseQuantity(quantityStr);
  
  let totalAmount = 0;
  let hasValidUnit = false;
  
  for (const qty of quantities) {
    const converted = convertUnit(qty.amount, qty.unit);
    if (converted.unit === targetUnit) {
      totalAmount += converted.amount;
      hasValidUnit = true;
    }
  }
  
  if (!hasValidUnit) {
    return {
      estimatedPrice: null,
      unitPrice: parseFloat(priceRecord.price),
      unit: priceRecord.unit,
      isPriced: false
    };
  }
  
  const estimatedPrice = parseFloat((totalAmount * parseFloat(priceRecord.price)).toFixed(2));
  
  return {
    estimatedPrice,
    unitPrice: parseFloat(priceRecord.price),
    unit: priceRecord.unit,
    isPriced: true
  };
};

const calculateShoppingListPrices = async (userId, shoppingItems) => {
  const itemsWithPrice = [];
  let totalPrice = 0;
  let pricedCount = 0;
  let unpricedCount = 0;
  
  for (const item of shoppingItems) {
    const priceInfo = await calculateItemPrice(
      userId,
      item.ingredientName,
      item.quantity
    );
    
    const itemData = item.toJSON ? item.toJSON() : item;
    
    if (priceInfo.isPriced) {
      totalPrice += priceInfo.estimatedPrice;
      pricedCount++;
    } else {
      unpricedCount++;
    }
    
    itemsWithPrice.push({
      ...itemData,
      ...priceInfo
    });
  }
  
  return {
    items: itemsWithPrice,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    pricedCount,
    unpricedCount
  };
};

module.exports = {
  parseQuantity,
  convertUnit,
  calculateItemPrice,
  calculateShoppingListPrices
};
