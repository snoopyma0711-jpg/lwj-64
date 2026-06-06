const express = require('express');
const { Rating, Recipe } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

const updateRecipeStats = async (recipeId) => {
  const ratings = await Rating.findAll({ where: { recipeId } });
  
  if (ratings.length === 0) {
    await Recipe.update({ averageRating: 0, madeCount: 0 }, { where: { id: recipeId } });
    return;
  }

  const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  const madeCount = ratings.length;

  await Recipe.update(
    { averageRating: Math.round(avgRating * 10) / 10, madeCount },
    { where: { id: recipeId } }
  );
};

router.post('/:recipeId', auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { rating, comment } = req.body;

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    const existingRating = await Rating.findOne({
      where: { userId: req.user.id, recipeId }
    });

    if (existingRating) {
      return res.status(400).json({ error: '您已经标记过这个菜谱了' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分必须在1-5星之间' });
    }

    const newRating = await Rating.create({
      userId: req.user.id,
      recipeId,
      rating,
      comment
    });

    await updateRecipeStats(recipeId);

    const ratingWithUser = await Rating.findByPk(newRating.id, {
      include: [{ model: require('../models').User, as: 'user', attributes: ['id', 'username'] }]
    });

    res.status(201).json(ratingWithUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:recipeId/check', auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    const existingRating = await Rating.findOne({
      where: { userId: req.user.id, recipeId }
    });

    res.json({ hasRated: !!existingRating, rating: existingRating });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
