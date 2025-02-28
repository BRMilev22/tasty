interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
}

interface GeneratedRecipe {
  title: string;
  description: string;
  fullRecipe: string[];
  rating: number;
  ingredients: {
    name: string;
    amount: string;
  }[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Define categories for ingredients
const ingredientCategories = {
  proteins: ['пилешко', 'телешко', 'свинско', 'риба', 'яйца', 'сирене', 'кайма', 'кашкавал', 'извара'],
  carbs: ['ориз', 'спагети', 'макарони', 'хляб', 'брашно', 'картофи', 'овесени', 'грис'],
  vegetables: ['домат', 'краставица', 'морков', 'лук', 'чесън', 'пипер', 'тиквичка', 'зеле', 'спанак'],
  fruits: ['ябълка', 'банан', 'портокал', 'лимон', 'ягода'],
  dairy: ['мляко', 'сирене', 'кашкавал', 'извара', 'кисело мляко', 'сметана'],
  spices: ['сол', 'черен пипер', 'червен пипер', 'чубрица', 'джоджен'],
  drinks: ['вода', 'сок', 'кола', 'бира', 'вино', 'ред бул', 'кафе', 'чай'],
  snacks: ['бисквити', 'вафла', 'шоколад', 'чипс', 'бонбони'],
  strictly_forbidden: ['ред бул', 'кола', 'енергийна напитка', 'газирана напитка']
};

// Function to check if an ingredient is cookable
const isCookableIngredient = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  
  // Първо проверяваме за забранени съставки
  if (ingredientCategories.strictly_forbidden.some(item => 
    lowerName.includes(item.toLowerCase())
  )) {
    return false;
  }

  // Проверяваме дали е напитка или снакс
  if (ingredientCategories.drinks.some(item => 
    lowerName.includes(item.toLowerCase())
  )) {
    return false;
  }

  if (ingredientCategories.snacks.some(item => 
    lowerName.includes(item.toLowerCase())
  )) {
    return false;
  }

  // Проверяваме дали е готвима съставка
  return (
    ingredientCategories.proteins.some(item => lowerName.includes(item.toLowerCase())) ||
    ingredientCategories.carbs.some(item => lowerName.includes(item.toLowerCase())) ||
    ingredientCategories.vegetables.some(item => lowerName.includes(item.toLowerCase())) ||
    ingredientCategories.fruits.some(item => lowerName.includes(item.toLowerCase())) ||
    ingredientCategories.dairy.some(item => lowerName.includes(item.toLowerCase())) ||
    ingredientCategories.spices.some(item => lowerName.includes(item.toLowerCase()))
  );
};

// Function to filter and organize ingredients for cooking
const prepareIngredientsForRecipe = (inventory: InventoryItem[]): InventoryItem[] => {
  // First, strictly filter out forbidden items and non-cookable items
  const cookableIngredients = inventory.filter(item => {
    const lowerName = item.name.toLowerCase();
    
    // Check strictly forbidden items first
    if (ingredientCategories.strictly_forbidden.some(forbidden => 
      lowerName.includes(forbidden.toLowerCase())
    )) {
      console.log(`Filtering out forbidden item: ${item.name}`);
      return false;
    }

    // Check drinks and snacks
    if (ingredientCategories.drinks.some(drink => 
      lowerName.includes(drink.toLowerCase())
    )) {
      console.log(`Filtering out drink: ${item.name}`);
      return false;
    }

    if (ingredientCategories.snacks.some(snack => 
      lowerName.includes(snack.toLowerCase())
    )) {
      console.log(`Filtering out snack: ${item.name}`);
      return false;
    }

    // Check if it's a valid cookable ingredient
    const isCookable = (
      ingredientCategories.proteins.some(item => lowerName.includes(item.toLowerCase())) ||
      ingredientCategories.carbs.some(item => lowerName.includes(item.toLowerCase())) ||
      ingredientCategories.vegetables.some(item => lowerName.includes(item.toLowerCase())) ||
      ingredientCategories.fruits.some(item => lowerName.includes(item.toLowerCase())) ||
      ingredientCategories.dairy.some(item => lowerName.includes(item.toLowerCase())) ||
      ingredientCategories.spices.some(item => lowerName.includes(item.toLowerCase()))
    );

    if (!isCookable) {
      console.log(`Filtering out non-cookable item: ${item.name}`);
    }

    return isCookable;
  });

  // Log filtered ingredients for debugging
  console.log('Cookable ingredients after filtering:', cookableIngredients.map(i => i.name));

  // Sort ingredients by category importance
  const categorizedIngredients = {
    proteins: cookableIngredients.filter(item => 
      ingredientCategories.proteins.some(protein => 
        item.name.toLowerCase().includes(protein.toLowerCase())
      )
    ),
    carbs: cookableIngredients.filter(item =>
      ingredientCategories.carbs.some(carb => 
        item.name.toLowerCase().includes(carb.toLowerCase())
      )
    ),
    vegetables: cookableIngredients.filter(item =>
      ingredientCategories.vegetables.some(veg => 
        item.name.toLowerCase().includes(veg.toLowerCase())
      )
    ),
    other: cookableIngredients.filter(item => 
      !ingredientCategories.proteins.some(protein => item.name.toLowerCase().includes(protein.toLowerCase())) &&
      !ingredientCategories.carbs.some(carb => item.name.toLowerCase().includes(carb.toLowerCase())) &&
      !ingredientCategories.vegetables.some(veg => item.name.toLowerCase().includes(veg.toLowerCase()))
    )
  };

  const selectedIngredients = [
    ...categorizedIngredients.proteins.slice(0, 2),
    ...categorizedIngredients.carbs.slice(0, 1),
    ...categorizedIngredients.vegetables.slice(0, 3),
    ...categorizedIngredients.other.slice(0, 2)
  ];

  // Final safety check
  return selectedIngredients.filter(item => isCookableIngredient(item.name));
};

// Example recipes to help guide the AI
const exampleRecipes = [
  {
    title: "Мусака",
    ingredients: [
      { name: "кайма", amount: "500 г" },
      { name: "картофи", amount: "1 кг" },
      { name: "лук", amount: "2 бр" },
      { name: "морков", amount: "1 бр" }
    ],
    steps: [
      "Запържете каймата със ситно нарязания лук",
      "Обелете и нарежете картофите на кубчета",
      "Смесете каймата и картофите",
      "Печете на 200 градуса за 40 минути"
    ]
  },
  // Add more example recipes...
];

// Add this helper function to clean and validate the AI response
const cleanAndParseResponse = (response: string): GeneratedRecipe => {
  try {
    // Try to parse directly first
    return JSON.parse(response);
  } catch (e) {
    // If direct parsing fails, try to clean the response
    try {
      // Find the first { and last }
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}') + 1;
      
      if (start === -1 || end === 0) {
        throw new Error('No JSON object found in response');
      }

      // Extract just the JSON part
      const jsonStr = response.slice(start, end);
      
      // Try to parse the cleaned JSON
      const parsed = JSON.parse(jsonStr);
      
      // Validate the required fields
      if (!parsed.title || !parsed.ingredients || !parsed.fullRecipe) {
        throw new Error('Missing required fields in recipe');
      }

      return parsed;
    } catch (parseError) {
      console.error('Error parsing cleaned response:', parseError);
      throw new Error('Invalid recipe format received');
    }
  }
};

// Update the fetchRecipesFromBgGPT function
export const fetchRecipesFromBgGPT = async (inventory: InventoryItem[]): Promise<GeneratedRecipe[]> => {
  try {
    if (!inventory || inventory.length === 0) {
      throw new Error("Инвентарът е празен или неопределен.");
    }

    const cookingIngredients = prepareIngredientsForRecipe(inventory);

    if (cookingIngredients.length === 0) {
      throw new Error("Няма подходящи съставки за готвене.");
    }

    const prompt = `Моля създай рецепта, използвайки следните съставки:
${cookingIngredients.map(item => `- ${item.name} (${item.quantity} ${item.unit})`).join('\n')}

ВАЖНО: 
1. Създай традиционна българска рецепта
2. Използвай само изброените съставки
3. Не използвай напитки или снаксове
4. Форматирай рецептата така:
**Рецепта:**
**Име на ястието**
**Необходими продукти:**
- продукт (количество)
**Начин на приготвяне:**
1. стъпка 1
2. стъпка 2`;

    const response = await fetch(`http://172.20.10.3:11434/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'bulgarian-recipe-bot:latest',
        prompt: prompt,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    try {
      const responseText = data.response;
      
      if (responseText.startsWith('Грешка:')) {
        throw new Error(responseText);
      }

      // Extract recipe name
      const nameMatch = responseText.match(/\*\*(.*?)\*\*/g);
      const title = nameMatch ? nameMatch[1].replace(/\*/g, '').trim() : '';

      // Extract ingredients
      const ingredientsMatch = responseText.match(/\*\*Необходими продукти:\*\*([\s\S]*?)\*\*Начин/);
      const ingredientsText = ingredientsMatch ? ingredientsMatch[1] : '';
      const ingredients = ingredientsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => {
          // Remove the dash and split by parentheses
          const [name, amount] = line.replace('-', '').trim().split(/[\(\)]/);
          return {
            name: name.trim(),
            amount: amount || ''
          };
        });

      // Extract steps
      const stepsMatch = responseText.match(/\*\*Начин на приготвяне:\*\*([\s\S]*?)$/);
      const stepsText = stepsMatch ? stepsMatch[1] : '';
      const steps = stepsText
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim());

      const recipe: GeneratedRecipe = {
        title,
        description: `Традиционна рецепта за ${title.toLowerCase()}`,
        ingredients,
        fullRecipe: steps,
        rating: 5,
        nutritionalInfo: {
          calories: 400,
          protein: 25,
          carbs: 30,
          fat: 15
        }
      };

      return [recipe];
    } catch (e) {
      console.error('Error parsing recipe response:', e);
      throw new Error('Невалиден формат на рецептата');
    }
  } catch (error) {
    console.error('Error generating recipe:', error);
    throw error;
  }
};