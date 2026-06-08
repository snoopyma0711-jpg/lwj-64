const express = require('express');
const { Op } = require('sequelize');
const { Recipe, User, Rating, FridgeIngredient } = require('../models');
const auth = require('../middleware/auth');
const { calculateRecipeNutrition } = require('../utils/nutritionCalculator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search, sortBy, ingredients, includeNutrition } = req.query;
    
    let where = {};
    
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    let order = [['createdAt', 'DESC']];
    if (sortBy === 'rating') {
      order = [['averageRating', 'DESC'], ['madeCount', 'DESC']];
    }

    let recipes = await Recipe.findAll({
      where,
      order,
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }]
    });

    if (ingredients) {
      const availableIngredients = ingredients.split(',').map(i => i.trim().toLowerCase());
      
      const fridgeIngredients = await FridgeIngredient.findAll({
        where: { userId: req.user.id }
      });

      const expiringIngredients = fridgeIngredients
        .map(fi => {
          const status = fi.getExpiryStatus();
          return {
            name: fi.ingredientName.toLowerCase(),
            status: status.status,
            daysLeft: status.daysLeft
          };
        })
        .filter(fi => fi.status === 'warning' || fi.status === 'expired');

      const expiringNames = expiringIngredients.map(fi => fi.name);

      recipes = recipes.map(recipe => {
        const recipeIngredients = recipe.ingredients.map(ing => ing.name.toLowerCase());
        const missingCount = recipeIngredients.filter(
          ing => !availableIngredients.some(avail => avail.includes(ing) || ing.includes(avail))
        ).length;

        const expiringUsedCount = recipeIngredients.filter(
          ing => expiringNames.some(expName => expName.includes(ing) || ing.includes(expName))
        ).length;

        const usedExpiringIngredients = recipeIngredients
          .filter(ing => expiringNames.some(expName => expName.includes(ing) || ing.includes(expName)))
          .map(ing => {
            const match = expiringIngredients.find(ei => ei.name.includes(ing) || ing.includes(ei.name));
            return {
              name: ing,
              status: match?.status,
              daysLeft: match?.daysLeft
            };
          });

        const recipeJson = recipe.toJSON();
        return { 
          ...recipeJson, 
          missingCount, 
          expiringUsedCount,
          usedExpiringIngredients
        };
      });

      recipes = recipes.filter(r => {
        const ingredientsLen = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
        return r.missingCount < ingredientsLen;
      });
      
      recipes.sort((a, b) => {
        if (b.expiringUsedCount !== a.expiringUsedCount) {
          return b.expiringUsedCount - a.expiringUsedCount;
        }
        return a.missingCount - b.missingCount;
      });
    }

    if (includeNutrition === 'true') {
      const recipesWithNutrition = [];
      for (const recipe of recipes) {
        const recipeData = recipe.toJSON ? recipe.toJSON() : recipe;
        const nutrition = await calculateRecipeNutrition(req.user.id, recipeData);
        recipesWithNutrition.push({ ...recipeData, nutrition });
      }
      res.json(recipesWithNutrition);
      return;
    }

    res.json(recipes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/nutrition', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }
    
    const nutrition = await calculateRecipeNutrition(req.user.id, recipe);
    res.json(nutrition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, ingredients, steps, estimatedTime, difficulty } = req.body;

    if (!name || !ingredients || !steps || !estimatedTime || !difficulty) {
      return res.status(400).json({ error: '请填写完整的菜谱信息' });
    }

    if (!['简单', '中等', '困难'].includes(difficulty)) {
      return res.status(400).json({ error: '难度标签必须是简单、中等或困难' });
    }

    const recipe = await Recipe.create({
      name,
      ingredients,
      steps,
      estimatedTime,
      difficulty,
      creatorId: req.user.id
    });

    const recipeWithCreator = await Recipe.findByPk(recipe.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }]
    });

    res.status(201).json(recipeWithCreator);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { 
          model: Rating, 
          as: 'ratings',
          include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    const recipeData = recipe.toJSON();
    const nutrition = await calculateRecipeNutrition(req.user.id, recipe);
    recipeData.nutrition = nutrition;

    res.json(recipeData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    if (recipe.creatorId !== req.user.id) {
      return res.status(403).json({ error: '只能修改自己创建的菜谱' });
    }

    const { name, ingredients, steps, estimatedTime, difficulty } = req.body;
    
    if (difficulty && !['简单', '中等', '困难'].includes(difficulty)) {
      return res.status(400).json({ error: '难度标签必须是简单、中等或困难' });
    }

    await recipe.update({ name, ingredients, steps, estimatedTime, difficulty });

    const updatedRecipe = await Recipe.findByPk(recipe.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }]
    });

    res.json(updatedRecipe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    if (recipe.creatorId !== req.user.id) {
      return res.status(403).json({ error: '只能删除自己创建的菜谱' });
    }

    await recipe.destroy();
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
