import request from './request';

export const getIngredientPrices = (search) => {
  return request.get('/ingredient-prices', { params: { search } });
};

export const getPriceUnits = () => {
  return request.get('/ingredient-prices/units');
};

export const addIngredientPrice = (data) => {
  return request.post('/ingredient-prices', data);
};

export const deleteIngredientPrice = (id) => {
  return request.delete(`/ingredient-prices/${id}`);
};

export const updateIngredientNutrition = (id, data) => {
  return request.put(`/ingredient-prices/${id}/nutrition`, data);
};

export const getDefaultNutrition = (name) => {
  return request.get('/ingredient-prices/default-nutrition', { params: { name } });
};

export const getNutritionSuggestions = () => {
  return request.get('/ingredient-prices/nutrition-suggestions');
};

export const getExpenseTrend = (weeks = 8) => {
  return request.get('/expenses/trend', { params: { weeks } });
};

export const getCurrentExpense = () => {
  return request.get('/expenses/current');
};

export const getWeeklyNutrition = () => {
  return request.get('/weekly-plans/nutrition');
};

export const getReplacementSuggestions = (recipeId) => {
  return request.get(`/weekly-plans/replacement-suggestions/${recipeId}`);
};

export const replaceRecipe = (oldRecipeId, newRecipeId) => {
  return request.post('/weekly-plans/replace-recipe', { oldRecipeId, newRecipeId });
};

export const updateCalorieGoal = (dailyCalorieGoal) => {
  return request.put('/auth/calorie-goal', { dailyCalorieGoal });
};

export const getRecipeNutrition = (recipeId) => {
  return request.get(`/recipes/${recipeId}/nutrition`);
};

export const getRecipesWithNutrition = () => {
  return request.get('/recipes', { params: { includeNutrition: 'true' } });
};
