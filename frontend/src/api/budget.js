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

export const getExpenseTrend = (weeks = 8) => {
  return request.get('/expenses/trend', { params: { weeks } });
};

export const getCurrentExpense = () => {
  return request.get('/expenses/current');
};
