const express = require('express');
const { Op } = require('sequelize');
const { IngredientPrice } = require('../models');
const auth = require('../middleware/auth');

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

router.post('/', auth, async (req, res) => {
  try {
    const { ingredientName, price, unit } = req.body;
    
    if (!ingredientName || !ingredientName.trim()) {
      return res.status(400).json({ error: '请输入食材名称' });
    }
    
    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: '请输入有效的价格' });
    }
    
    if (!unit || !IngredientPrice.UNITS.includes(unit)) {
      return res.status(400).json({ error: '请选择有效的计价单位' });
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
        unit
      });
      return res.json(existingPrice);
    }
    
    const newPrice = await IngredientPrice.create({
      userId: req.user.id,
      ingredientName: ingredientName.trim(),
      price: parseFloat(price),
      unit
    });
    
    res.status(201).json(newPrice);
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
