-- Drop existing tables if they exist to start clean
DROP TABLE IF EXISTS UserMeals;
DROP TABLE IF EXISTS favoriterecipes;
DROP TABLE IF EXISTS alluserview;

DROP TABLE IF EXISTS Instructions;
DROP TABLE IF EXISTS Ingredients;
DROP TABLE IF EXISTS MyRecipes;

DROP TABLE IF EXISTS userlastview;
DROP TABLE IF EXISTS users;


-- Create Users Table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(8) NOT NULL UNIQUE,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL ,
    password VARCHAR(60) NOT NULL
);

-- Create Ingredients Table
-- Create MyRecipes Table with AUTO_INCREMENT starting from 1000000

CREATE TABLE MyRecipes (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(1024) NOT NULL,
    ready_in_minutes INT NOT NULL,
    servings INT NOT NULL,
    gluten_free BOOLEAN DEFAULT FALSE,
    vegan BOOLEAN DEFAULT FALSE,
    vegetarian BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) AUTO_INCREMENT = 10000000;


-- Create Favorite Recipes Table
CREATE TABLE favoriterecipes (
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create User Meals Table
CREATE TABLE UserMeals (
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create User Last View Table
CREATE TABLE userlastview (
    user_id INT NOT NULL,
    lastView1 INT,
    lastView2 INT,
    lastView3 INT,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create All User View Table without Foreign Key Constraint
CREATE TABLE alluserview (
    user_id INT NOT NULL,
    recipe_id INT NOT NULL
);

-- Create Instrucntions Table
CREATE TABLE Instructions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    instruction TEXT NOT NULL,
    instruction_number INT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES MyRecipes(recipe_id)
);

-- Create Ingredients Table
CREATE TABLE Ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    ingredient_name VARCHAR(255) NOT NULL,
    amount VARCHAR(255) NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES MyRecipes(recipe_id)
);

