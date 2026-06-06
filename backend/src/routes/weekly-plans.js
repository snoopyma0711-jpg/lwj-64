const express = require('express');
const { Op } = require('sequelize');
const { WeeklyPlan, Recipe, ShoppingItem, WeeklyPlanRecipe, WeeklyExpense, User } = require('../models');
const auth = require('../middleware/auth');
const { calculateShoppingListPrices } = require('../utils/priceCalculator');
const { calculateWeeklyPlanNutrition, findReplacementRecipes } = require('../utils/nutritionCalculator');

const router = express.Router();

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.ceil(diff / oneWeek);
  return { weekNumber, year: now.getFullYear() };
};

const parseQuantity = (quantityStr) => {
  const match = quantityStr.match(/([\d.]+)\s*(.*)/);
  if (match) {
    return { amount: parseFloat(match[1]), unit: match[2] || '' };
  }
  return { amount: 1, unit: quantityStr || '' };
};

const formatQuantity = (amount, unit) => {
  if (unit) {
    return `${amount} ${unit}`;
  }
  return `${amount}`;
};

const generateShoppingList = async (weeklyPlanId, recipes) => {
  await ShoppingItem.destroy({ where: { weeklyPlanId } });

  const ingredientMap = new Map();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase();
      const parsed = parseQuantity(ing.quantity);
      
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key);
        if (existing.unit === parsed.unit) {
          existing.amount += parsed.amount;
        } else {
          existing.others.push({ amount: parsed.amount, unit: parsed.unit });
        }
      } else {
        ingredientMap.set(key, {
          name: ing.name,
          amount: parsed.amount,
          unit: parsed.unit,
          others: []
        });
      }
    }
  }

  const shoppingItems = [];
  for (const item of ingredientMap.values()) {
    let quantity = formatQuantity(item.amount, item.unit);
    for (const other of item.others) {
      quantity += ` + ${formatQuantity(other.amount, other.unit)}`;
    }
    
    const shoppingItem = await ShoppingItem.create({
      weeklyPlanId,
      ingredientName: item.name,
      quantity,
      purchased: false
    });
    shoppingItems.push(shoppingItem);
  }

  return shoppingItems;
};

router.get('/current', auth, async (req, res) => {
  try {
    const { weekNumber, year } = getCurrentWeek();

    let weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year },
      include: [
        { model: Recipe, as: 'recipes' },
        { model: ShoppingItem, as: 'shoppingItems', order: [['createdAt', 'ASC']] }
      ]
    });

    if (!weeklyPlan) {
      weeklyPlan = await WeeklyPlan.create({
        userId: req.user.id,
        weekNumber,
        year
      });
      weeklyPlan = await WeeklyPlan.findByPk(weeklyPlan.id, {
        include: [
          { model: Recipe, as: 'recipes' },
          { model: ShoppingItem, as: 'shoppingItems', order: [['createdAt', 'ASC']] }
        ]
      });
    }

    const planData = weeklyPlan.toJSON();
    const priceResult = await calculateShoppingListPrices(req.user.id, planData.shoppingItems || []);
    
    planData.shoppingItems = priceResult.items;
    planData.totalEstimatedPrice = priceResult.totalPrice;
    planData.pricedItemCount = priceResult.pricedCount;
    planData.unpricedItemCount = priceResult.unpricedCount;

    const nutrition = await calculateWeeklyPlanNutrition(req.user.id, planData.recipes || []);
    planData.nutrition = nutrition;

    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'dailyCalorieGoal'] });
    planData.user = {
      id: user.id,
      username: user.username,
      dailyCalorieGoal: user.dailyCalorieGoal
    };

    res.json(planData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/add-recipe', auth, async (req, res) => {
  try {
    const { recipeId } = req.body;
    const { weekNumber, year } = getCurrentWeek();

    if (!recipeId) {
      return res.status(400).json({ error: '请提供菜谱ID' });
    }

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    let weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year },
      include: [{ model: Recipe, as: 'recipes', attributes: ['id'] }]
    });

    if (!weeklyPlan) {
      weeklyPlan = await WeeklyPlan.create({
        userId: req.user.id,
        weekNumber,
        year
      });
    }

    const existingRecipeIds = weeklyPlan.recipes ? weeklyPlan.recipes.map(r => Number(r.id)) : [];
    
    if (existingRecipeIds.includes(Number(recipeId))) {
      return res.status(400).json({ error: '该菜谱已在本周计划中' });
    }

    await weeklyPlan.addRecipe(recipe);

    const recipes = await weeklyPlan.getRecipes();
    await generateShoppingList(weeklyPlan.id, recipes);

    const updatedPlan = await WeeklyPlan.findByPk(weeklyPlan.id, {
      include: [
        { model: Recipe, as: 'recipes' },
        { model: ShoppingItem, as: 'shoppingItems', order: [['createdAt', 'ASC']] }
      ]
    });

    const planData = updatedPlan.toJSON();
    const priceResult = await calculateShoppingListPrices(req.user.id, planData.shoppingItems || []);
    
    planData.shoppingItems = priceResult.items;
    planData.totalEstimatedPrice = priceResult.totalPrice;
    planData.pricedItemCount = priceResult.pricedCount;
    planData.unpricedItemCount = priceResult.unpricedCount;

    const nutrition = await calculateWeeklyPlanNutrition(req.user.id, planData.recipes || []);
    planData.nutrition = nutrition;

    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'dailyCalorieGoal'] });
    planData.user = {
      id: user.id,
      username: user.username,
      dailyCalorieGoal: user.dailyCalorieGoal
    };

    res.json(planData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/remove-recipe', auth, async (req, res) => {
  try {
    const { recipeId } = req.body;
    const { weekNumber, year } = getCurrentWeek();

    const weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year }
    });

    if (!weeklyPlan) {
      return res.status(404).json({ error: '本周计划不存在' });
    }

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    await weeklyPlan.removeRecipe(recipe);

    const recipes = await weeklyPlan.getRecipes();
    await generateShoppingList(weeklyPlan.id, recipes);

    const updatedPlan = await WeeklyPlan.findByPk(weeklyPlan.id, {
      include: [
        { model: Recipe, as: 'recipes' },
        { model: ShoppingItem, as: 'shoppingItems', order: [['createdAt', 'ASC']] }
      ]
    });

    const planData = updatedPlan.toJSON();
    const priceResult = await calculateShoppingListPrices(req.user.id, planData.shoppingItems || []);
    
    planData.shoppingItems = priceResult.items;
    planData.totalEstimatedPrice = priceResult.totalPrice;
    planData.pricedItemCount = priceResult.pricedCount;
    planData.unpricedItemCount = priceResult.unpricedCount;

    const nutrition = await calculateWeeklyPlanNutrition(req.user.id, planData.recipes || []);
    planData.nutrition = nutrition;

    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'dailyCalorieGoal'] });
    planData.user = {
      id: user.id,
      username: user.username,
      dailyCalorieGoal: user.dailyCalorieGoal
    };

    res.json(planData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/nutrition', auth, async (req, res) => {
  try {
    const { weekNumber, year } = getCurrentWeek();

    const weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year },
      include: [
        { model: Recipe, as: 'recipes' }
      ]
    });

    if (!weeklyPlan) {
      return res.json({
        totalWeeklyCalories: 0,
        dailyAverageCalories: 0,
        macroRatios: { protein: 0, carbs: 0, fat: 0 },
        recipeNutrition: [],
        totalRecipes: 0
      });
    }

    const nutrition = await calculateWeeklyPlanNutrition(req.user.id, weeklyPlan.recipes || []);
    
    const user = await User.findByPk(req.user.id, { attributes: ['dailyCalorieGoal'] });
    
    res.json({
      ...nutrition,
      dailyCalorieGoal: user.dailyCalorieGoal
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/replacement-suggestions/:recipeId', auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { weekNumber, year } = getCurrentWeek();
    
    const recipeToReplace = await Recipe.findByPk(recipeId);
    if (!recipeToReplace) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    const weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year },
      include: [{ model: Recipe, as: 'recipes', attributes: ['id'] }]
    });

    const existingRecipeIds = weeklyPlan && weeklyPlan.recipes 
      ? weeklyPlan.recipes.map(r => r.id) 
      : [];

    const allRecipes = await Recipe.findAll({
      where: {
        id: { [Op.ne]: recipeId }
      }
    });

    const suggestions = await findReplacementRecipes(req.user.id, recipeToReplace, allRecipes, existingRecipeIds);
    
    res.json(suggestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/replace-recipe', auth, async (req, res) => {
  try {
    const { oldRecipeId, newRecipeId } = req.body;
    const { weekNumber, year } = getCurrentWeek();

    if (!oldRecipeId || !newRecipeId) {
      return res.status(400).json({ error: '请提供要替换的菜谱ID和新菜谱ID' });
    }

    if (Number(oldRecipeId) === Number(newRecipeId)) {
      return res.status(400).json({ error: '新菜谱与要替换的菜谱相同' });
    }

    const weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year },
      include: [{ model: Recipe, as: 'recipes', attributes: ['id'] }]
    });

    if (!weeklyPlan) {
      return res.status(404).json({ error: '本周计划不存在' });
    }

    const existingRecipeIds = weeklyPlan.recipes ? weeklyPlan.recipes.map(r => Number(r.id)) : [];
    
    if (existingRecipeIds.includes(Number(newRecipeId))) {
      return res.status(400).json({ error: '该菜谱已在本周计划中' });
    }

    if (!existingRecipeIds.includes(Number(oldRecipeId))) {
      return res.status(400).json({ error: '要替换的菜谱不在本周计划中' });
    }

    const oldRecipe = await Recipe.findByPk(oldRecipeId);
    const newRecipe = await Recipe.findByPk(newRecipeId);

    if (!oldRecipe || !newRecipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    await weeklyPlan.removeRecipe(oldRecipe);
    await weeklyPlan.addRecipe(newRecipe);

    const recipes = await weeklyPlan.getRecipes();
    await generateShoppingList(weeklyPlan.id, recipes);

    const updatedPlan = await WeeklyPlan.findByPk(weeklyPlan.id, {
      include: [
        { model: Recipe, as: 'recipes' },
        { model: ShoppingItem, as: 'shoppingItems', order: [['createdAt', 'ASC']] }
      ]
    });

    const planData = updatedPlan.toJSON();
    const priceResult = await calculateShoppingListPrices(req.user.id, planData.shoppingItems || []);
    
    planData.shoppingItems = priceResult.items;
    planData.totalEstimatedPrice = priceResult.totalPrice;
    planData.pricedItemCount = priceResult.pricedCount;
    planData.unpricedItemCount = priceResult.unpricedCount;

    const nutrition = await calculateWeeklyPlanNutrition(req.user.id, planData.recipes || []);
    planData.nutrition = nutrition;

    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'dailyCalorieGoal'] });
    planData.user = {
      id: user.id,
      username: user.username,
      dailyCalorieGoal: user.dailyCalorieGoal
    };

    res.json(planData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/shopping-item/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { purchased } = req.body;

    const shoppingItem = await ShoppingItem.findByPk(id);
    if (!shoppingItem) {
      return res.status(404).json({ error: '购物项不存在' });
    }

    const weeklyPlan = await WeeklyPlan.findByPk(shoppingItem.weeklyPlanId);
    if (!weeklyPlan || weeklyPlan.userId !== req.user.id) {
      return res.status(403).json({ error: '无权修改此购物项' });
    }

    await shoppingItem.update({ purchased });
    res.json(shoppingItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/clear', auth, async (req, res) => {
  try {
    const { weekNumber, year } = getCurrentWeek();

    const weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year },
      include: [
        { model: ShoppingItem, as: 'shoppingItems' }
      ]
    });

    if (!weeklyPlan) {
      return res.json({ message: '本周计划为空' });
    }

    const purchasedItems = weeklyPlan.shoppingItems.filter(item => item.purchased);
    if (purchasedItems.length > 0) {
      const priceResult = await calculateShoppingListPrices(req.user.id, purchasedItems);
      
      const existingExpense = await WeeklyExpense.findOne({
        where: { userId: req.user.id, weekNumber, year }
      });
      
      if (existingExpense) {
        await existingExpense.update({
          totalAmount: priceResult.totalPrice,
          itemCount: purchasedItems.length
        });
      } else {
        await WeeklyExpense.create({
          userId: req.user.id,
          weekNumber,
          year,
          totalAmount: priceResult.totalPrice,
          itemCount: purchasedItems.length
        });
      }
    }

    await WeeklyPlanRecipe.destroy({ where: { weeklyPlanId: weeklyPlan.id } });
    await ShoppingItem.destroy({ where: { weeklyPlanId: weeklyPlan.id } });

    const updatedPlan = await WeeklyPlan.findByPk(weeklyPlan.id, {
      include: [
        { model: Recipe, as: 'recipes' },
        { model: ShoppingItem, as: 'shoppingItems', order: [['createdAt', 'ASC']] }
      ]
    });

    res.json(updatedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
