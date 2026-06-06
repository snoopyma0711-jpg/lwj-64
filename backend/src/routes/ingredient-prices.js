const express = require('express');
const { Op } = require('sequelize');
const { IngredientPrice } = require('../models');
const auth = require('../middleware/auth');
const { DEFAULT_NUTRITION, getNutritionForIngredient } = require('../utils/nutritionCalculator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const where = { userId: req.user.id };
    
    if (search && search.trim()) {
      where.ingredientName = {
        [Op.like]: `%${search.trim()}%`
      };
    }
    
    const prices = await IngredientPrice.findAll({
      where,
      order: [['updatedAt', 'DESC']]
    });
    
    res.json(prices);
  } catch (error) {
    console.error('搜索食材价格错误:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/units', auth, async (req, res) => {
  try {
    res.json({ units: IngredientPrice.UNITS });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/default-nutrition', auth, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.json({ nutrition: null });
    }
    
    const nutrition = await getNutritionForIngredient(req.user.id, name);
    res.json({ nutrition });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/nutrition-suggestions', auth, async (req, res) => {
  try {
    const suggestions = Object.entries(DEFAULT_NUTRITION).map(([name, nutrition]) => ({
      name,
      ...nutrition
    }));
    res.json(suggestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { ingredientName, price, unit, calories, protein, carbs, fat } = req.body;
    
    if (!ingredientName || !ingredientName.trim()) {
      return res.status(400).json({ error: '请输入食材名称' });
    }
    
    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: '请输入有效的价格' });
    }
    
    if (!unit || !IngredientPrice.UNITS.includes(unit)) {
      return res.status(400).json({ error: '请选择有效的计价单位' });
    }
    
    const nutritionData = {};
    if (calories !== undefined && calories !== null && !isNaN(parseFloat(calories))) {
      nutritionData.calories = parseFloat(calories);
    }
    if (protein !== undefined && protein !== null && !isNaN(parseFloat(protein))) {
      nutritionData.protein = parseFloat(protein);
    }
    if (carbs !== undefined && carbs !== null && !isNaN(parseFloat(carbs))) {
      nutritionData.carbs = parseFloat(carbs);
    }
    if (fat !== undefined && fat !== null && !isNaN(parseFloat(fat))) {
      nutritionData.fat = parseFloat(fat);
    }
    
    const existingPrice = await IngredientPrice.findOne({
      where: {
        userId: req.user.id,
        ingredientName: {
          [Op.like]: ingredientName.trim()
        }
      }
    });
    
    if (existingPrice) {
      await existingPrice.update({
        price: parseFloat(price),
        unit,
        ...nutritionData
      });
      return res.json(existingPrice);
    }
    
    const newPrice = await IngredientPrice.create({
      userId: req.user.id,
      ingredientName: ingredientName.trim(),
      price: parseFloat(price),
      unit,
      ...nutritionData
    });
    
    res.status(201).json(newPrice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/nutrition', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { calories, protein, carbs, fat } = req.body;
    
    const price = await IngredientPrice.findByPk(id);
    if (!price) {
      return res.status(404).json({ error: '价格记录不存在' });
    }
    
    if (price.userId !== req.user.id) {
      return res.status(403).json({ error: '无权修改此记录' });
    }
    
    const updateData = {};
    if (calories !== undefined && calories !== null) {
      updateData.calories = calories === '' ? null : parseFloat(calories);
    }
    if (protein !== undefined && protein !== null) {
      updateData.protein = protein === '' ? null : parseFloat(protein);
    }
    if (carbs !== undefined && carbs !== null) {
      updateData.carbs = carbs === '' ? null : parseFloat(carbs);
    }
    if (fat !== undefined && fat !== null) {
      updateData.fat = fat === '' ? null : parseFloat(fat);
    }
    
    await price.update(updateData);
    res.json(price);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const price = await IngredientPrice.findByPk(id);
    if (!price) {
      return res.status(404).json({ error: '价格记录不存在' });
    }
    
    if (price.userId !== req.user.id) {
      return res.status(403).json({ error: '无权删除此记录' });
    }
    
    await price.destroy();
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
