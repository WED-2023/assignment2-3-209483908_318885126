const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");


async function markAsFavorite(user_id, recipe_id){
  try {
      await DButils.execQuery(`INSERT IGNORE INTO FavoriteRecipes (user_id, recipe_id) VALUES ('${user_id}', ${recipe_id})`);
      console.log(`Recipe ${recipe_id} marked as favorite for user ${user_id}`);
  } catch (error) {
      console.error(`Error marking recipe ${recipe_id} as favorite for user ${user_id}:`, error);
      throw error; // Propagate the error to handle it further up the call stack if needed
  }
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function removeFavorite(user_id, recipe_id) {
    await DButils.execQuery(`DELETE FROM FavoriteRecipes WHERE user_id='${user_id}' AND recipe_id=${recipe_id}`);
  }

async function getMeals(user_id) {
  const mealIds = await DButils.execQuery(`SELECT recipe_id FROM usermeals WHERE user_id='${user_id}'`);
  const mealDetailsPromises = mealIds.map(meal => recipes_utils.getRecipeDetails(meal.recipe_id));
  try {
      const mealDetails = await Promise.all(mealDetailsPromises);
      return mealDetails;
  } catch (error) {
      console.error("Failed to fetch meals:", error);
      throw error;
  }
}

async function markAsMeal(user_id, recipe_id) {
  // Check if the recipe is already added to the meal plan
  const exists = await DButils.execQuery(
    `SELECT * FROM usermeals WHERE user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );

  // If the recipe exists, throw an error
  if (exists.length > 0) {
    throw new Error('Meal already added');
  }

  // If not, add the recipe to the meal plan
  await DButils.execQuery(
    `INSERT INTO usermeals (user_id, recipe_id) VALUES ('${user_id}', '${recipe_id}')`
  );
}



async function removeFromMeal(user_id, recipe_id=null) {
  if (!recipe_id) {
      // Remove all meals for the user
      await DButils.execQuery(`DELETE FROM usermeals WHERE user_id='${user_id}'`);
  }
  else{
  await DButils.execQuery(`DELETE FROM usermeals WHERE user_id='${user_id}' AND recipe_id=${recipe_id}`);
  }
}

// last view code
async function markAsLastView(user_id, recipe_id) {
  // Get the current last views for the user
  let result = await DButils.execQuery(`SELECT LastView1, LastView2, LastView3 FROM userlastview WHERE user_id = ${user_id}`);
  if (result.length === 0) {
      // User not found in UserLastView, insert new row
      await DButils.execQuery(`INSERT INTO userlastview (user_id, LastView1) VALUES (${user_id}, ${recipe_id})`);
  } else {
      // User found, update the views if the new recipe_id is not already one of the last views
      let { LastView1, LastView2, LastView3 } = result[0];

      // Check if the recipe_id is already one of the last views
      if (recipe_id !== LastView1 && recipe_id !== LastView2 && recipe_id !== LastView3) {
          // Move LastView1 to LastView2, LastView2 to LastView3, and add the new recipe_id to LastView1
          await DButils.execQuery(`
              UPDATE userlastview
              SET LastView1 = ${recipe_id},
                  LastView2 = ${LastView1 !== null ? LastView1 : 'NULL'},
                  LastView3 = ${LastView2 !== null ? LastView2 : 'NULL'}
              WHERE user_id = ${user_id}
          `);
      } else {
          console.log("Recipe already in the last views, skipping update to avoid duplication.");
      }
  }
}




async function getLastViews(user_id) {
  // Fetch the last viewed recipe IDs
  const result = await DButils.execQuery(`SELECT LastView1, LastView2, LastView3 FROM UserLastView WHERE user_id='${user_id}'`);

  if (result.length === 0) {
      // If no records are found, return an empty array
      return [];
  }

  const { LastView1, LastView2, LastView3 } = result[0];
  const lastViewIds = [LastView1, LastView2, LastView3].filter(id => id !== null);

  // Fetch the details of each recipe
  const lastViewDetailsPromises = lastViewIds.map(recipe_id => recipes_utils.getRecipeDetails(recipe_id));

  try {
      const lastViewDetails = await Promise.all(lastViewDetailsPromises);
      return lastViewDetails;
  } catch (error) {
      console.error("Failed to fetch last viewed recipes:", error);
      throw error;
  }
}

async function addRecipe({ user_id, title, image, readyInMinutes, servings, glutenFree, vegan, vegetarian }) {
  try {
    const query = `
      INSERT INTO MyRecipes (user_id, title, image_url, ready_in_minutes, servings, gluten_free, vegan, vegetarian)
      VALUES ('${user_id}', '${title}', '${image}', ${readyInMinutes}, ${servings}, ${glutenFree}, ${vegan}, ${vegetarian})
    `;
    const result = await DButils.execQuery(query);
    const recipeId = result.insertId;
    return recipeId;
  } catch (error) {
    console.error("Error inserting recipe:", error);
    throw error;
  }
}

async function addInstruction(recipe_id, instruction, instruction_number) {
  try {
    const query = `
      INSERT INTO Instructions (recipe_id, instruction, instruction_number)
      VALUES (${recipe_id}, '${instruction}', ${instruction_number})
    `;
    await DButils.execQuery(query);
  } catch (error) {
    console.error("Error inserting instruction:", error);
    throw error;
  }
}

async function addIngredient(recipe_id, ingredient_name, amount) {
  try {
    const query = `
      INSERT INTO Ingredients (recipe_id, ingredient_name, amount)
      VALUES (${recipe_id}, '${ingredient_name}', '${amount}')
    `;
    await DButils.execQuery(query);
  } catch (error) {
    console.error("Error inserting ingredient:", error);
    throw error;
  }
}


async function getUserRecipes(user_id, recipe_id=null) {
  console.log("Fetching recipes for user_id:", user_id);
  try {
    let recipesQuery = `
    SELECT recipe_id, title, image_url, ready_in_minutes, servings, gluten_free, vegan, vegetarian
    FROM MyRecipes 
    WHERE user_id = ${user_id}
    `;
    if (recipe_id) {
      recipesQuery += ` AND recipe_id = ${recipe_id}`;
    }
    const recipes = await DButils.execQuery(recipesQuery);
    
    if (recipes.length === 0) {
      console.log("No recipes found for user_id:", user_id);
      return []; // Return an empty array if no recipes found
    }

    // Fetch instructions and ingredients for each recipe
    for (const recipe of recipes) {
      const instructionsQuery = `
        SELECT instruction, instruction_number 
        FROM Instructions 
        WHERE recipe_id = ${recipe.recipe_id} 
        ORDER BY instruction_number
      `;
      const instructions = await DButils.execQuery(instructionsQuery);
      const ingredientsQuery = `
        SELECT ingredient_name, amount 
        FROM Ingredients 
        WHERE recipe_id = ${recipe.recipe_id}
      `;
      const ingredients = await DButils.execQuery(ingredientsQuery);

      // Map fetched data into desired JSON format
      recipe.instructions = instructions.map(i => i.instruction);
      recipe.ingredients = ingredients.map(ingredient => ({
        name: ingredient.ingredient_name,
        amount: ingredient.amount
      }));
      recipe.myrecipe = true; // Assuming you want to mark it as a user's own recipe
    }

    // Return recipes in the structured JSON format
    return recipes.map(recipe => ({
      id: recipe.recipe_id,
      title: recipe.title,
      image: recipe.image_url,
      readyInMinutes: recipe.ready_in_minutes,
      servings: recipe.servings,
      glutenFree: recipe.gluten_free,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      myrecipe: recipe.myrecipe
    }));
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    throw error;
  }
}
async function getAllViewed(user_id) {
  try {
    const query = `SELECT recipe_id FROM alluserview WHERE user_id='${user_id}'`;
    const result = await DButils.execQuery(query);
    return result.map(row => row.recipe_id);
  } catch (error) {
    console.error('Error fetching viewed recipes:', error);
    throw error;
  }
}

async function writeUserRecipeView(user_id, recipe_id) {
  try {
    // Insert or ignore into alluserview table
    await DButils.execQuery(`
      INSERT IGNORE INTO alluserview (user_id, recipe_id)
      VALUES (${user_id}, ${recipe_id})
    `);
    console.log(`Successfully marked recipe ${recipe_id} as viewed for user ${user_id} in alluserview table`);
  } catch (error) {
    console.error('Error writing to alluserview:', error);
    throw error;
  }
}

async function getFavoriteAndViewedRecipes(user_id){
  const favoriteRecipes = await getFavoriteRecipes(user_id);

  const lastViewedRecipes = await getAllViewed(user_id);

  return {favoriteRecipes, lastViewedRecipes};
}

module.exports = {
    markAsFavorite,
    removeFavorite,
    getFavoriteRecipes,
    getMeals,
    markAsMeal,
    removeFromMeal,
    markAsLastView,
    getLastViews,
    addRecipe,
    addInstruction,
    addIngredient,
    getUserRecipes,
    getFavoriteAndViewedRecipes,
    writeUserRecipeView
  };