const sequelize = require('../config/database');
const User = require('./User');
const Recipe = require('./Recipe');
const Rating = require('./Rating');
const WeeklyPlan = require('./WeeklyPlan');
const WeeklyPlanRecipe = require('./WeeklyPlanRecipe');
const ShoppingItem = require('./ShoppingItem');
const RecipeCollection = require('./RecipeCollection');
const RecipeCollectionRecipe = require('./RecipeCollectionRecipe');
const RecipeCollectionFavorite = require('./RecipeCollectionFavorite');
const IngredientPrice = require('./IngredientPrice');
const WeeklyExpense = require('./WeeklyExpense');

Recipe.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(Recipe, { as: 'recipes', foreignKey: 'creatorId' });

Rating.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Rating.belongsTo(Recipe, { as: 'recipe', foreignKey: 'recipeId' });
User.hasMany(Rating, { as: 'ratings', foreignKey: 'userId' });
Recipe.hasMany(Rating, { as: 'ratings', foreignKey: 'recipeId' });

WeeklyPlan.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(WeeklyPlan, { as: 'weeklyPlans', foreignKey: 'userId' });

WeeklyPlan.belongsToMany(Recipe, { 
  through: WeeklyPlanRecipe, 
  as: 'recipes',
  foreignKey: 'weeklyPlanId'
});
Recipe.belongsToMany(WeeklyPlan, { 
  through: WeeklyPlanRecipe, 
  as: 'weeklyPlans',
  foreignKey: 'recipeId'
});

ShoppingItem.belongsTo(WeeklyPlan, { as: 'weeklyPlan', foreignKey: 'weeklyPlanId' });
WeeklyPlan.hasMany(ShoppingItem, { as: 'shoppingItems', foreignKey: 'weeklyPlanId' });

RecipeCollection.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(RecipeCollection, { as: 'recipeCollections', foreignKey: 'creatorId' });

RecipeCollection.belongsToMany(Recipe, {
  through: RecipeCollectionRecipe,
  as: 'recipes',
  foreignKey: 'recipeCollectionId',
  otherKey: 'recipeId'
});
Recipe.belongsToMany(RecipeCollection, {
  through: RecipeCollectionRecipe,
  as: 'recipeCollections',
  foreignKey: 'recipeId',
  otherKey: 'recipeCollectionId'
});

RecipeCollectionFavorite.belongsTo(User, { as: 'user', foreignKey: 'userId' });
RecipeCollectionFavorite.belongsTo(RecipeCollection, { as: 'recipeCollection', foreignKey: 'recipeCollectionId' });
User.hasMany(RecipeCollectionFavorite, { as: 'collectionFavorites', foreignKey: 'userId' });
RecipeCollection.hasMany(RecipeCollectionFavorite, { as: 'favorites', foreignKey: 'recipeCollectionId' });

IngredientPrice.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(IngredientPrice, { as: 'ingredientPrices', foreignKey: 'userId' });

WeeklyExpense.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(WeeklyExpense, { as: 'weeklyExpenses', foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Recipe,
  Rating,
  WeeklyPlan,
  WeeklyPlanRecipe,
  ShoppingItem,
  RecipeCollection,
  RecipeCollectionRecipe,
  RecipeCollectionFavorite,
  IngredientPrice,
  WeeklyExpense
};
