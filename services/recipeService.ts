import { CohereClientV2 } from 'cohere-ai';

const cohere = new CohereClientV2({
  token: 'fknnvTIY1IUTrLjORXfOxm9qTcpzpjqBXhLYPjDB', // Replace with your actual API key
});

export const fetchRecipesFromCohere = async (inventory: string[]) => {
  try {
    if (!inventory || inventory.length === 0) {
      throw new Error("Inventory is empty or undefined.");
    }

    // Generate the prompt to ask the AI to provide the full recipe
    const prompt = `Suggest recipes using these ingredients: ${inventory.join(', ')}. For each recipe, please provide the following fields:
    - title: The name of the recipe.
    - description: A short description of the recipe.
    - fullRecipe: The full recipe instructions without extra text or explanations. Each step should be a separate entry in the array.
    - rating: A rating from 1 to 5 stars based on the complexity or tastiness of the recipe.
    Format the response as follows:
    {
      "title": "Recipe Name",
      "description": "Short description of the recipe",
      "fullRecipe": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
      "rating": 4
    }
    Provide at least 1 recipe.`;

    // Send the request to the Cohere API
    const response = await cohere.chat({
      model: 'command-r-plus', // or another appropriate model you are using
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Log the full response to understand the structure
    console.log('Cohere API response:', response);

    // Check if the response has the expected structure
    const content = response?.message?.content;

    if (content && Array.isArray(content)) {
      console.log("Content is an array of objects:", content);

      // Map through each object in the array to create recipes with full details
      const recipes = content.map((item: any) => {
        const recipeData = item?.text || '';
        if (!recipeData) {
          return {
            title: "Untitled Recipe",
            description: "No description available.",
            fullRecipe: ["No full recipe instructions available."],
            rating: Math.floor(Math.random() * 5) + 1,
          };
        }

        // Clean up and format the recipe data by removing unwanted parts
        const lines = recipeData.split('\n').map(line => line.trim()).filter(line => line !== "");

        // Extract the title (should be the first part)
        const titleMatch = lines.find(line => line.includes("title"));
        const title = titleMatch ? titleMatch.split(':')[1]?.trim() : "Untitled Recipe"; 
        
        // Extract the description (should be the second part)
        const descriptionMatch = lines.find(line => line.includes("description"));
        const description = descriptionMatch ? descriptionMatch.split(':')[1]?.trim() : "No description available."; 
        
        // Extract the steps (the full recipe instructions are below the first two lines)
        const fullRecipeLines = lines.slice(2).map((line, index) => `Step ${index + 1}: ${line.trim()}`).filter(line => line !== "");
        const fullRecipe = Array.isArray(fullRecipeLines) ? fullRecipeLines : ["No full recipe instructions available."];

        // Rating should be the last line, if present
        const ratingMatch = lines.find(line => line.includes("rating"));
        const rating = ratingMatch ? parseInt(ratingMatch.replace(/[^0-9]/g, '')) : Math.floor(Math.random() * 5) + 1;

        return { title, description, fullRecipe, rating };
      });

      return recipes;
    }

    throw new Error("Invalid API response structure.");
  } catch (error) {
    console.error('Error generating recipes:', error);
    return [];
  }
};
