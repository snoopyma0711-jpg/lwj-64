const { IngredientPrice, Recipe } = require('../models');

const GRAM_CONVERSIONS = {
  '斤': 500,
  '斤左右': 500,
  'g': 1,
  '克': 1,
  'ml': 1,
  '毫升': 1,
  'kg': 1000,
  '千克': 1000,
  '两': 50,
  '钱': 5
};

const ESTIMATED_WEIGHTS = {
  '个': { default: 50, '鸡蛋': 50, '番茄': 150, '土豆': 150, '苹果': 150, '香蕉': 120, '洋葱': 100, '胡萝卜': 100, '鸡胸肉': 200, '鸡腿': 150, '鸡翅': 50 },
  '只': { default: 50, '鸡': 1500, '鸭': 1500, '虾': 15, '鸡蛋': 50 },
  '颗': { default: 5, '大蒜': 5, '红枣': 10, '枸杞': 1, '葡萄': 10, '樱桃': 10 },
  '片': { default: 10, '培根': 30, '火腿': 20, '面包': 30, '黄瓜': 20, '番茄': 20 },
  '块': { default: 100, '豆腐': 100, '鸡胸肉': 100, '牛肉': 100, '猪肉': 100, '土豆': 100 },
  '条': { default: 30, '鱼': 500, '茄子': 150, '黄瓜': 150, '丝瓜': 150 },
  '把': { default: 100, '青菜': 100, '菠菜': 100, '韭菜': 100, '芹菜': 100 },
  '小把': { default: 50, '香菜': 20, '葱': 30, '蒜苗': 50 },
  '勺': { default: 15, '盐': 6, '糖': 12, '油': 14, '酱油': 15, '醋': 15, '料酒': 15, '蜂蜜': 20 },
  '小勺': { default: 5, '盐': 2, '糖': 4, '油': 5, '酱油': 5 },
  '汤匙': { default: 15, '盐': 6, '糖': 12, '油': 14 },
  '大匙': { default: 15 },
  '茶匙': { default: 5 },
  '碗': { default: 250, '米饭': 200, '水': 250, '面粉': 150 },
  '杯': { default: 250, '牛奶': 250, '水': 250, '面粉': 120, '米饭': 200 },
  '滴': { default: 0.05 }
};

const DEFAULT_NUTRITION = {
  '米饭': { calories: 116, protein: 2.6, carbs: 25.6, fat: 0.3 },
  '大米': { calories: 346, protein: 7.4, carbs: 77.9, fat: 0.8 },
  '面条': { calories: 284, protein: 8.3, carbs: 56.8, fat: 2.3 },
  '馒头': { calories: 221, protein: 7, carbs: 47, fat: 1.1 },
  '面包': { calories: 312, protein: 8.3, carbs: 58.6, fat: 5.1 },
  '鸡蛋': { calories: 144, protein: 13.3, carbs: 2.8, fat: 8.8 },
  '番茄': { calories: 20, protein: 0.9, carbs: 4, fat: 0.2 },
  '西红柿': { calories: 20, protein: 0.9, carbs: 4, fat: 0.2 },
  '黄瓜': { calories: 16, protein: 0.8, carbs: 2.9, fat: 0.2 },
  '土豆': { calories: 81, protein: 2.6, carbs: 17.8, fat: 0.2 },
  '马铃薯': { calories: 81, protein: 2.6, carbs: 17.8, fat: 0.2 },
  '胡萝卜': { calories: 37, protein: 1, carbs: 8.8, fat: 0.2 },
  '洋葱': { calories: 40, protein: 1.1, carbs: 9, fat: 0.2 },
  '白菜': { calories: 17, protein: 1.5, carbs: 3.2, fat: 0.1 },
  '青菜': { calories: 15, protein: 1.5, carbs: 2.7, fat: 0.3 },
  '菠菜': { calories: 28, protein: 2.6, carbs: 4.5, fat: 0.3 },
  '芹菜': { calories: 16, protein: 0.8, carbs: 3.9, fat: 0.1 },
  '韭菜': { calories: 29, protein: 2.4, carbs: 4.6, fat: 0.4 },
  '茄子': { calories: 23, protein: 1.1, carbs: 4.9, fat: 0.2 },
  '丝瓜': { calories: 20, protein: 1, carbs: 4.2, fat: 0.2 },
  '冬瓜': { calories: 12, protein: 0.4, carbs: 2.6, fat: 0.2 },
  '南瓜': { calories: 23, protein: 0.7, carbs: 5.3, fat: 0.1 },
  '苦瓜': { calories: 19, protein: 1, carbs: 4.9, fat: 0.1 },
  '辣椒': { calories: 21, protein: 1.4, carbs: 3.7, fat: 0.3 },
  '青椒': { calories: 22, protein: 1, carbs: 5.4, fat: 0.3 },
  '豆角': { calories: 30, protein: 2.5, carbs: 6.7, fat: 0.2 },
  '四季豆': { calories: 28, protein: 2, carbs: 5.7, fat: 0.4 },
  '豌豆': { calories: 111, protein: 7.4, carbs: 21.2, fat: 0.3 },
  '玉米': { calories: 112, protein: 4, carbs: 22.8, fat: 1.2 },
  '金针菇': { calories: 26, protein: 2.4, carbs: 6, fat: 0.4 },
  '香菇': { calories: 27, protein: 2.2, carbs: 6.1, fat: 0.3 },
  '蘑菇': { calories: 24, protein: 2.7, carbs: 4.1, fat: 0.1 },
  '木耳': { calories: 21, protein: 1.5, carbs: 6.7, fat: 0.2 },
  '银耳': { calories: 200, protein: 10, carbs: 67.3, fat: 1.4 },
  '豆腐': { calories: 81, protein: 8.1, carbs: 3.8, fat: 3.7 },
  '豆腐干': { calories: 140, protein: 16.2, carbs: 11.5, fat: 3.6 },
  '猪肉': { calories: 395, protein: 13.6, carbs: 2.4, fat: 37 },
  '五花肉': { calories: 395, protein: 13.6, carbs: 2.4, fat: 37 },
  '瘦肉': { calories: 143, protein: 20.3, carbs: 1.5, fat: 6.2 },
  '牛肉': { calories: 125, protein: 19.9, carbs: 2, fat: 4.2 },
  '牛排': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  '羊肉': { calories: 203, protein: 19, carbs: 0, fat: 14.1 },
  '鸡肉': { calories: 167, protein: 19.3, carbs: 1.3, fat: 9.4 },
  '鸡胸肉': { calories: 133, protein: 19.4, carbs: 2.5, fat: 5 },
  '鸡腿': { calories: 181, protein: 16, carbs: 0, fat: 13 },
  '鸡翅': { calories: 194, protein: 17.4, carbs: 4.6, fat: 11.8 },
  '鸭肉': { calories: 240, protein: 15.5, carbs: 0.2, fat: 19.7 },
  '鱼': { calories: 113, protein: 18, carbs: 0, fat: 4.3 },
  '草鱼': { calories: 113, protein: 16.6, carbs: 0, fat: 5.2 },
  '鲤鱼': { calories: 109, protein: 17.6, carbs: 0.2, fat: 4.1 },
  '鲫鱼': { calories: 108, protein: 17.1, carbs: 3.8, fat: 2.7 },
  '鲈鱼': { calories: 105, protein: 18.6, carbs: 0.2, fat: 3.4 },
  '虾': { calories: 87, protein: 18.6, carbs: 2.6, fat: 0.8 },
  '虾仁': { calories: 93, protein: 18.6, carbs: 2.8, fat: 0.8 },
  '螃蟹': { calories: 103, protein: 17.5, carbs: 2.3, fat: 2.6 },
  '海带': { calories: 12, protein: 1.2, carbs: 2.1, fat: 0.1 },
  '紫菜': { calories: 207, protein: 26.7, carbs: 44.1, fat: 0.9 },
  '苹果': { calories: 54, protein: 0.2, carbs: 13.5, fat: 0.2 },
  '香蕉': { calories: 93, protein: 1.4, carbs: 22, fat: 0.2 },
  '橙子': { calories: 47, protein: 0.8, carbs: 11.1, fat: 0.2 },
  '牛奶': { calories: 54, protein: 3, carbs: 3.4, fat: 3.2 },
  '酸奶': { calories: 72, protein: 2.5, carbs: 9.3, fat: 2.7 },
  '奶酪': { calories: 328, protein: 25.7, carbs: 3.5, fat: 23.5 },
  '油': { calories: 899, protein: 0, carbs: 0, fat: 99.9 },
  '食用油': { calories: 899, protein: 0, carbs: 0, fat: 99.9 },
  '橄榄油': { calories: 899, protein: 0, carbs: 0, fat: 99.9 },
  '花生油': { calories: 899, protein: 0, carbs: 0, fat: 99.9 },
  '菜籽油': { calories: 899, protein: 0, carbs: 0, fat: 99.9 },
  '大豆油': { calories: 899, protein: 0, carbs: 0, fat: 99.9 },
  '盐': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  '糖': { calories: 396, protein: 0, carbs: 99.9, fat: 0 },
  '白糖': { calories: 396, protein: 0, carbs: 99.9, fat: 0 },
  '冰糖': { calories: 397, protein: 0, carbs: 99.9, fat: 0 },
  '酱油': { calories: 63, protein: 5.6, carbs: 10.1, fat: 0.1 },
  '醋': { calories: 31, protein: 2.1, carbs: 4.9, fat: 0.3 },
  '料酒': { calories: 114, protein: 0.3, carbs: 1.5, fat: 0 },
  '味精': { calories: 268, protein: 40.1, carbs: 26.5, fat: 0.2 },
  '鸡精': { calories: 195, protein: 40, carbs: 15, fat: 2.8 },
  '葱': { calories: 30, protein: 1.7, carbs: 5.2, fat: 0.3 },
  '姜': { calories: 46, protein: 1.3, carbs: 10.3, fat: 0.6 },
  '蒜': { calories: 128, protein: 4.5, carbs: 27.6, fat: 0.2 },
  '大蒜': { calories: 128, protein: 4.5, carbs: 27.6, fat: 0.2 },
  '香菜': { calories: 31, protein: 1.8, carbs: 5, fat: 0.4 },
  '花椒': { calories: 258, protein: 6.7, carbs: 66.5, fat: 8.9 },
  '辣椒面': { calories: 324, protein: 15, carbs: 57.7, fat: 7.1 },
  '胡椒粉': { calories: 361, protein: 9.6, carbs: 76.9, fat: 2.2 },
  '淀粉': { calories: 346, protein: 0.2, carbs: 85.8, fat: 0.1 },
  '生粉': { calories: 346, protein: 0.2, carbs: 85.8, fat: 0.1 },
  '面粉': { calories: 366, protein: 11.2, carbs: 73.6, fat: 1.5 },
  '米粉': { calories: 346, protein: 7.4, carbs: 77.9, fat: 0.8 },
  '糯米': { calories: 348, protein: 7.3, carbs: 78.3, fat: 1 },
  '红豆': { calories: 309, protein: 20.2, carbs: 63.4, fat: 0.6 },
  '绿豆': { calories: 316, protein: 21.6, carbs: 62, fat: 0.8 },
  '黄豆': { calories: 359, protein: 35, carbs: 34.2, fat: 16 },
  '花生': { calories: 563, protein: 24.8, carbs: 16.1, fat: 44.3 },
  '核桃': { calories: 646, protein: 14.9, carbs: 9.6, fat: 58.8 },
  '芝麻': { calories: 531, protein: 19.1, carbs: 31.5, fat: 46.1 },
  '巧克力': { calories: 586, protein: 4.3, carbs: 51.9, fat: 40.1 },
  '蜂蜜': { calories: 321, protein: 0.4, carbs: 75.6, fat: 1.9 },
  '水': { calories: 0, protein: 0, carbs: 0, fat: 0 }
};

const parseQuantity = (quantityStr) => {
  const items = quantityStr.split(/[+、,，]/).map(item => item.trim());
  const results = [];
  
  for (const item of items) {
    const match = item.match(/([\d.]*)\s*([\u4e00-\u9fa5a-zA-Z]+)/);
    if (match) {
      const amount = match[1] ? parseFloat(match[1]) : 1;
      const unit = match[2] || '';
      results.push({ amount, unit });
    } else {
      const numMatch = item.match(/([\d.]+)/);
      if (numMatch) {
        results.push({ amount: parseFloat(numMatch[1]), unit: '' });
      }
    }
  }
  
  return results;
};

const convertToGrams = (amount, unit, ingredientName = '') => {
  if (GRAM_CONVERSIONS[unit]) {
    return amount * GRAM_CONVERSIONS[unit];
  }
  
  if (ESTIMATED_WEIGHTS[unit]) {
    const weightMap = ESTIMATED_WEIGHTS[unit];
    const name = ingredientName.toLowerCase();
    let estimatedWeight = weightMap.default;
    
    for (const key in weightMap) {
      if (name.includes(key)) {
        estimatedWeight = weightMap[key];
        break;
      }
    }
    
    return amount * estimatedWeight;
  }
  
  if (!unit || unit === '') {
    return amount;
  }
  
  return amount;
};

const getNutritionForIngredient = async (userId, ingredientName) => {
  const { Op } = require('sequelize');
  
  const priceRecord = await IngredientPrice.findOne({
    where: {
      userId,
      ingredientName: {
        [Op.like]: `%${ingredientName}%`
      }
    }
  });
  
  if (priceRecord && priceRecord.calories !== null) {
    return {
      calories: priceRecord.calories,
      protein: priceRecord.protein || 0,
      carbs: priceRecord.carbs || 0,
      fat: priceRecord.fat || 0,
      source: 'user'
    };
  }
  
  const name = ingredientName.toLowerCase();
  for (const key in DEFAULT_NUTRITION) {
    if (name.includes(key) || key.includes(name)) {
      return {
        ...DEFAULT_NUTRITION[key],
        source: 'default'
      };
    }
  }
  
  return null;
};

const calculateIngredientNutrition = async (userId, ingredient) => {
  const nutrition = await getNutritionForIngredient(userId, ingredient.name);
  
  if (!nutrition) {
    return {
      name: ingredient.name,
      quantity: ingredient.quantity,
      grams: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      hasNutritionData: false
    };
  }
  
  const quantities = parseQuantity(ingredient.quantity);
  let totalGrams = 0;
  
  for (const qty of quantities) {
    totalGrams += convertToGrams(qty.amount, qty.unit, ingredient.name);
  }
  
  const factor = totalGrams / 100;
  
  return {
    name: ingredient.name,
    quantity: ingredient.quantity,
    grams: Math.round(totalGrams * 10) / 10,
    calories: Math.round(nutrition.calories * factor * 10) / 10,
    protein: Math.round(nutrition.protein * factor * 10) / 10,
    carbs: Math.round(nutrition.carbs * factor * 10) / 10,
    fat: Math.round(nutrition.fat * factor * 10) / 10,
    hasNutritionData: true,
    nutritionSource: nutrition.source
  };
};

const calculateRecipeNutrition = async (userId, recipe) => {
  const ingredients = recipe.ingredients || [];
  const ingredientNutrition = [];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let ingredientsWithData = 0;
  
  for (const ing of ingredients) {
    const nutrition = await calculateIngredientNutrition(userId, ing);
    ingredientNutrition.push(nutrition);
    
    if (nutrition.hasNutritionData) {
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalCarbs += nutrition.carbs;
      totalFat += nutrition.fat;
      ingredientsWithData++;
    }
  }
  
  const servingSize = 3;
  const caloriesPerServing = Math.round(totalCalories / servingSize);
  const proteinPerServing = Math.round(totalProtein / servingSize * 10) / 10;
  const carbsPerServing = Math.round(totalCarbs / servingSize * 10) / 10;
  const fatPerServing = Math.round(totalFat / servingSize * 10) / 10;
  
  const totalMacros = totalProtein + totalCarbs + totalFat;
  let proteinRatio = 0;
  let carbsRatio = 0;
  let fatRatio = 0;
  
  if (totalMacros > 0) {
    const proteinCal = totalProtein * 4;
    const carbsCal = totalCarbs * 4;
    const fatCal = totalFat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal;
    
    if (totalMacroCal > 0) {
      proteinRatio = Math.round((proteinCal / totalMacroCal) * 100);
      carbsRatio = Math.round((carbsCal / totalMacroCal) * 100);
      fatRatio = Math.round((fatCal / totalMacroCal) * 100);
    }
  }
  
  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    ingredientNutrition,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    servingSize,
    caloriesPerServing,
    proteinPerServing,
    carbsPerServing,
    fatPerServing,
    macroRatios: {
      protein: proteinRatio,
      carbs: carbsRatio,
      fat: fatRatio
    },
    ingredientsWithData,
    totalIngredients: ingredients.length,
    hasCompleteData: ingredientsWithData === ingredients.length
  };
};

const calculateWeeklyPlanNutrition = async (userId, recipes) => {
  const recipeNutritionList = [];
  let totalWeeklyCalories = 0;
  let totalWeeklyProtein = 0;
  let totalWeeklyCarbs = 0;
  let totalWeeklyFat = 0;
  let completeDataCount = 0;
  
  for (const recipe of recipes) {
    const nutrition = await calculateRecipeNutrition(userId, recipe);
    recipeNutritionList.push(nutrition);
    
    totalWeeklyCalories += nutrition.totalCalories;
    totalWeeklyProtein += nutrition.totalProtein;
    totalWeeklyCarbs += nutrition.totalCarbs;
    totalWeeklyFat += nutrition.totalFat;
    
    if (nutrition.hasCompleteData) {
      completeDataCount++;
    }
  }
  
  const dailyAverageCalories = Math.round(totalWeeklyCalories / 7);
  const dailyAverageProtein = Math.round(totalWeeklyProtein / 7 * 10) / 10;
  const dailyAverageCarbs = Math.round(totalWeeklyCarbs / 7 * 10) / 10;
  const dailyAverageFat = Math.round(totalWeeklyFat / 7 * 10) / 10;
  
  const totalMacros = totalWeeklyProtein + totalWeeklyCarbs + totalWeeklyFat;
  let proteinRatio = 0;
  let carbsRatio = 0;
  let fatRatio = 0;
  
  if (totalMacros > 0) {
    const proteinCal = totalWeeklyProtein * 4;
    const carbsCal = totalWeeklyCarbs * 4;
    const fatCal = totalWeeklyFat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal;
    
    if (totalMacroCal > 0) {
      proteinRatio = Math.round((proteinCal / totalMacroCal) * 100);
      carbsRatio = Math.round((carbsCal / totalMacroCal) * 100);
      fatRatio = Math.round((fatCal / totalMacroCal) * 100);
    }
  }
  
  return {
    recipeNutrition: recipeNutritionList,
    totalWeeklyCalories,
    totalWeeklyProtein: Math.round(totalWeeklyProtein * 10) / 10,
    totalWeeklyCarbs: Math.round(totalWeeklyCarbs * 10) / 10,
    totalWeeklyFat: Math.round(totalWeeklyFat * 10) / 10,
    dailyAverageCalories,
    dailyAverageProtein,
    dailyAverageCarbs,
    dailyAverageFat,
    macroRatios: {
      protein: proteinRatio,
      carbs: carbsRatio,
      fat: fatRatio
    },
    completeDataCount,
    totalRecipes: recipes.length,
    hasCompleteData: completeDataCount === recipes.length
  };
};

const findReplacementRecipes = async (userId, recipeToReplace, allRecipes, excludeRecipeIds = []) => {
  const recipeNutrition = await calculateRecipeNutrition(userId, recipeToReplace);
  const originalCalories = recipeNutrition.totalCalories;
  
  const targetIngredients = recipeToReplace.ingredients.map(ing => ing.name.toLowerCase());
  
  const candidates = [];
  const excludeIdsSet = new Set(excludeRecipeIds.map(id => Number(id)));
  
  for (const candidate of allRecipes) {
    if (candidate.id === recipeToReplace.id) continue;
    if (excludeIdsSet.has(Number(candidate.id))) continue;
    
    const candidateIngredients = candidate.ingredients.map(ing => ing.name.toLowerCase());
    const intersection = targetIngredients.filter(ing => 
      candidateIngredients.some(cand => cand.includes(ing) || ing.includes(cand))
    );
    
    if (intersection.length > 0) {
      const candidateNutrition = await calculateRecipeNutrition(userId, candidate);
      
      if (!candidateNutrition.hasCompleteData) {
        const dataCoverage = candidateNutrition.totalIngredients > 0 
          ? candidateNutrition.ingredientsWithData / candidateNutrition.totalIngredients 
          : 0;
        if (dataCoverage < 0.7) continue;
      }
      
      if (candidateNutrition.totalCalories <= 0) continue;
      
      const calorieDifference = originalCalories - candidateNutrition.totalCalories;
      
      if (calorieDifference > 0) {
        candidates.push({
          recipe: candidate,
          nutrition: candidateNutrition,
          originalCalories,
          calorieDifference,
          commonIngredients: intersection,
          commonIngredientCount: intersection.length
        });
      }
    }
  }
  
  candidates.sort((a, b) => b.calorieDifference - a.calorieDifference);
  
  return candidates.slice(0, 10);
};

module.exports = {
  parseQuantity,
  convertToGrams,
  getNutritionForIngredient,
  calculateIngredientNutrition,
  calculateRecipeNutrition,
  calculateWeeklyPlanNutrition,
  findReplacementRecipes,
  DEFAULT_NUTRITION
};
