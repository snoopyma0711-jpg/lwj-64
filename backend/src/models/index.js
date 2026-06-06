const sequelize = require('../config/database');
const User = require('./User');
const Recipe = require('./Recipe');
const Rating = require('./Rating');
const WeeklyPlan = require('./WeeklyPlan');
const WeeklyPlanRecipe = require('./WeeklyPlanRecipe');
const ShoppingItem = require('./ShoppingItem');

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

module.exports = {
  sequelize,
  User,
  Recipe,
  Rating,
  WeeklyPlan,
  WeeklyPlanRecipe,
  ShoppingItem
};
