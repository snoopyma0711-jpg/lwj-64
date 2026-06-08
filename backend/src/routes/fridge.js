const express = require('express');
const { Op } = require('sequelize');
const { FridgeIngredient } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

const addExpiryStatus = (ingredient) => {
  const data = ingredient.toJSON();
  data.expiryStatus = ingredient.getExpiryStatus();
  return data;
};

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let where = { userId: req.user.id };
    
    const ingredients = await FridgeIngredient.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    let result = ingredients.map(ing => addExpiryStatus(ing));
    
    if (status === 'warning') {
      result = result.filter(ing => 
        ing.expiryStatus.status === 'warning' || ing.expiryStatus.status === 'expired'
      );
    } else if (status === 'expired') {
      result = result.filter(ing => ing.expiryStatus.status === 'expired');
    } else if (status === 'normal') {
      result = result.filter(ing => ing.expiryStatus.status === 'normal');
    }

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/alerts', auth, async (req, res) => {
  try {
    const ingredients = await FridgeIngredient.findAll({
      where: { userId: req.user.id },
      order: [['expiryDate', 'ASC']]
    });

    const result = ingredients
      .map(ing => addExpiryStatus(ing))
      .filter(ing => 
        ing.expiryStatus.status === 'warning' || ing.expiryStatus.status === 'expired'
      );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { ingredientName, quantity, expiryDate, notes } = req.body;

    if (!ingredientName || !quantity) {
      return res.status(400).json({ error: '请填写食材名称和数量' });
    }

    const ingredient = await FridgeIngredient.create({
      ingredientName,
      quantity,
      expiryDate: expiryDate || null,
      notes: notes || null,
      userId: req.user.id
    });

    const result = addExpiryStatus(ingredient);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredientName, quantity, expiryDate, notes } = req.body;

    const ingredient = await FridgeIngredient.findOne({
      where: { id, userId: req.user.id }
    });

    if (!ingredient) {
      return res.status(404).json({ error: '食材不存在' });
    }

    await ingredient.update({
      ingredientName: ingredientName || ingredient.ingredientName,
      quantity: quantity || ingredient.quantity,
      expiryDate: expiryDate !== undefined ? expiryDate : ingredient.expiryDate,
      notes: notes !== undefined ? notes : ingredient.notes
    });

    const result = addExpiryStatus(ingredient);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const ingredient = await FridgeIngredient.findOne({
      where: { id, userId: req.user.id }
    });

    if (!ingredient) {
      return res.status(404).json({ error: '食材不存在' });
    }

    await ingredient.destroy();
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: '请提供要删除的食材ID列表' });
    }

    await FridgeIngredient.destroy({
      where: {
        id: { [Op.in]: ids },
        userId: req.user.id
      }
    });

    res.json({ message: '批量删除成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
