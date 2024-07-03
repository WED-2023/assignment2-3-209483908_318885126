const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipesPreview(recipe_ids) {
    try {
        let promises = recipe_ids.map((id) => getRecipeInformation(id));
        let recipes = await Promise.all(promises);
        return recipes.map((recipe_info) => {
            let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;
            return {
                id: id,
                title: title,
                readyInMinutes: readyInMinutes,
                image: image,
                popularity: aggregateLikes,
                vegan: vegan,
                vegetarian: vegetarian,
                glutenFree: glutenFree
            };
        });
    } catch (error) {
        throw error;
    }
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree
    };
}

async function getRandomRecipes(number = 3) {
    try {
        let response = await axios.get(`${api_domain}/random`, {
            params: {
                number: number,
                tags: '',
                excludeTags: '',
                apiKey: api_key
            }
        });

        let recipes = response.data.recipes.map(recipe => {
            return {
                id: recipe.id,
                title: recipe.title,
                readyInMinutes: recipe.readyInMinutes,
                image: recipe.image,
                popularity: recipe.aggregateLikes,
                vegan: recipe.vegan,
                vegetarian: recipe.vegetarian,
                glutenFree: recipe.glutenFree
            };
        });

        return recipes;
    } catch (error) {
        console.error("Error fetching random recipes:", error);
        return [];
    }
}

module.exports = {
    getRecipesPreview,
    getRecipeInformation,
    getRecipeDetails,
    getRandomRecipes

};
