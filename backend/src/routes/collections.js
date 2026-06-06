const express = require('express');
const { Op } = require('sequelize');
const {
  RecipeCollection,
  RecipeCollectionRecipe,
  RecipeCollectionFavorite,
  Recipe,
  User,
  WeeklyPlan,
  WeeklyPlanRecipe,
  ShoppingItem
} = require('../models');
const auth = require('../middleware/auth');

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

const getCollectionWithStats = async (collection, userId) => {
  const recipes = await collection.getRecipes({
    joinTableAttributes: ['sortOrder'],
    order: [[RecipeCollectionRecipe, 'sortOrder', 'ASC']]
  });
  
  const recipeCount = recipes.length;
  const totalTime = recipes.reduce((sum, r) => sum + r.estimatedTime, 0);
  
  let isFavorited = false;
  if (userId) {
    const favorite = await RecipeCollectionFavorite.findOne({
      where: { userId, recipeCollectionId: collection.id }
    });
    isFavorited = !!favorite;
  }
  
  return {
    ...collection.toJSON(),
    recipes,
    recipeCount,
    totalTime,
    isFavorited
  };
};

router.get('/', async (req, res) => {
  try {
    const { sortBy, search } = req.query;
    
    let where = {};
    
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    
    let order = [['createdAt', 'DESC']];
    if (sortBy === 'favorites') {
      order = [['favoriteCount', 'DESC'], ['createdAt', 'DESC']];
    }
    
    const collections = await RecipeCollection.findAll({
      where,
      order,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });
    
    const userId = req.user?.id;
    const result = [];
    for (const collection of collections) {
      result.push(await getCollectionWithStats(collection, userId));
    }
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, recipeIds } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: '请填写合集名称和简介' });
    }
    
    const collection = await RecipeCollection.create({
      name,
      description,
      creatorId: req.user.id
    });
    
    if (recipeIds && recipeIds.length > 0) {
      const recipes = await Recipe.findAll({ where: { id: recipeIds } });
      
      const recipeData = recipeIds.map((recipeId, index) => ({
        recipeCollectionId: collection.id,
        recipeId,
        sortOrder: index
      }));
      
      await RecipeCollectionRecipe.bulkCreate(recipeData);
    }
    
    const collectionWithCreator = await RecipeCollection.findByPk(collection.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });
    
    const result = await getCollectionWithStats(collectionWithCreator, req.user.id);
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const collection = await RecipeCollection.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });
    
    if (!collection) {
      return res.status(404).json({ error: '合集不存在' });
    }
    
    const userId = req.user?.id;
    const result = await getCollectionWithStats(collection, userId);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const collection = await RecipeCollection.findByPk(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: '合集不存在' });
    }
    
    if (collection.creatorId !== req.user.id) {
      return res.status(403).json({ error: '只能修改自己创建的合集' });
    }
    
    const { name, description, recipeIds } = req.body;
    
    await collection.update({ name, description });
    
    if (recipeIds) {
      await RecipeCollectionRecipe.destroy({ where: { recipeCollectionId: collection.id } });
      
      if (recipeIds.length > 0) {
        const recipeData = recipeIds.map((recipeId, index) => ({
          recipeCollectionId: collection.id,
          recipeId,
          sortOrder: index
        }));
        
        await RecipeCollectionRecipe.bulkCreate(recipeData);
      }
    }
    
    const updatedCollection = await RecipeCollection.findByPk(collection.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });
    
    const result = await getCollectionWithStats(updatedCollection, req.user.id);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/reorder', auth, async (req, res) => {
  try {
    const collection = await RecipeCollection.findByPk(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: '合集不存在' });
    }
    
    if (collection.creatorId !== req.user.id) {
      return res.status(403).json({ error: '只能修改自己创建的合集' });
    }
    
    const { recipeIds } = req.body;
    
    if (!recipeIds || !Array.isArray(recipeIds)) {
      return res.status(400).json({ error: '请提供菜谱ID列表' });
    }
    
    for (let i = 0; i < recipeIds.length; i++) {
      await RecipeCollectionRecipe.update(
        { sortOrder: i },
        { where: { recipeCollectionId: collection.id, recipeId: recipeIds[i] } }
      );
    }
    
    const updatedCollection = await RecipeCollection.findByPk(collection.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });
    
    const result = await getCollectionWithStats(updatedCollection, req.user.id);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const collection = await RecipeCollection.findByPk(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: '合集不存在' });
    }
    
    if (collection.creatorId !== req.user.id) {
      return res.status(403).json({ error: '只能删除自己创建的合集' });
    }
    
    await RecipeCollectionRecipe.destroy({ where: { recipeCollectionId: collection.id } });
    await RecipeCollectionFavorite.destroy({ where: { recipeCollectionId: collection.id } });
    await collection.destroy();
    
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const collection = await RecipeCollection.findByPk(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: '合集不存在' });
    }
    
    const existingFavorite = await RecipeCollectionFavorite.findOne({
      where: { userId: req.user.id, recipeCollectionId: collection.id }
    });
    
    if (existingFavorite) {
      return res.status(400).json({ error: '已经收藏过该合集' });
    }
    
    await RecipeCollectionFavorite.create({
      userId: req.user.id,
      recipeCollectionId: collection.id
    });
    
    await collection.increment('favoriteCount');
    await collection.reload();
    
    const result = await getCollectionWithStats(collection, req.user.id);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id/favorite', auth, async (req, res) => {
  try {
    const collection = await RecipeCollection.findByPk(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: '合集不存在' });
    }
    
    const favorite = await RecipeCollectionFavorite.findOne({
      where: { userId: req.user.id, recipeCollectionId: collection.id }
    });
    
    if (!favorite) {
      return res.status(400).json({ error: '未收藏该合集' });
    }
    
    await favorite.destroy();
    
    await collection.decrement('favoriteCount');
    await collection.reload();
    
    const result = await getCollectionWithStats(collection, req.user.id);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/add-to-weekly-plan', auth, async (req, res) => {
  try {
    const collection = await RecipeCollection.findByPk(req.params.id, {
      include: [
        {
          model: Recipe,
          as: 'recipes',
          through: { attributes: ['sortOrder'] },
          order: [[RecipeCollectionRecipe, 'sortOrder', 'ASC']]
        }
      ]
    });
    
    if (!collection) {
      return res.status(404).json({ error: '合集不存在' });
    }
    
    const { weekNumber, year } = getCurrentWeek();
    
    let weeklyPlan = await WeeklyPlan.findOne({
      where: { userId: req.user.id, weekNumber, year }
    });
    
    if (!weeklyPlan) {
      weeklyPlan = await WeeklyPlan.create({
        userId: req.user.id,
        weekNumber,
        year
      });
    }
    
    const recipes = collection.recipes;
    let addedCount = 0;
    
    for (const recipe of recipes) {
      const existing = await WeeklyPlanRecipe.findOne({
        where: { weeklyPlanId: weeklyPlan.id, recipeId: recipe.id }
      });
      
      if (!existing) {
        await weeklyPlan.addRecipe(recipe);
        addedCount++;
      }
    }
    
    const allRecipes = await weeklyPlan.getRecipes();
    await generateShoppingList(weeklyPlan.id, allRecipes);
    
    const updatedPlan = await WeeklyPlan.findByPk(weeklyPlan.id, {
      include: [
        { model: Recipe, as: 'recipes' },
        { model: ShoppingItem, as: 'shoppingItems', order: [['createdAt', 'ASC']] }
      ]
    });
    
    res.json({
      message: `成功添加 ${addedCount} 个菜谱到周计划`,
      weeklyPlan: updatedPlan
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
