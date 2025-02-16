export const fetchRecipesFromCohere = async (inventory: string[]): Promise<any> => {
  try {
    if (!inventory || inventory.length === 0) {
      throw new Error("Инвентарът е празен или неопределен.");
    }

    // Enhanced prompt to improve the quality and relevance of the response
    const prompt = `Представи пълни и практични рецепти с разнообразни български ястия на български език, като внимавай за правописни, пунктуационни, граматични и лексикални грешки, трябва да бъде написано правилно, съобразено с правилата и правописа в българския език, използвайки САМО И ЕДИНСТВЕНО следните съставки: ${inventory.join(', ')}. Избери подходящи и популярни рецепти в българския кулинарен стил, които ще са лесни за приготвяне у дома. За всяка рецепта, моля, включи следната информация:
    - title: Име на рецептата (напр. "Мусака", "Шопска салата"), като нека името да бъде кратко, лесно и интересно.
    - description: Кратко описание на рецептата и основните й съставки, които трябва да са САМО И ЕДИНСТВЕНО: ${inventory.join(', ')}, като отново внимавай за правописни, пунктуационни, граматични и лексикални грешки, трябва да бъде написано правилно.
    - fullRecipe: Стъпка по стъпка инструкции за приготвяне. Всяка стъпка трябва да бъде отделен елемент в масива. Некa да бъдат кратки, лесни и интересни.
    - rating: Оценка от 1 до 5 звезди, базирана на сложността и вкуса на рецептата.

    Пример: 
    {
      "title": "Шопска салата",
      "description": "Освежаваща българска салата със свежи домати, краставици, сирене и лук.",
      "fullRecipe": ["Стъпка 1: Нарежете доматите и краставиците на кубчета.", "Стъпка 2: Добавете нарязания на ситно лук.", "Стъпка 3: Поръсете с настъргано сирене и зехтин."],
      "rating": 5
    }

    Представи една рецепта, следвайки този формат, на български език, като внимавай за правописни, пунктуационни, граматични и лексикални грешки, трябва да бъде написано правилно, съобразено с правилата и правописа в българския език. Избери рецепта, подходяща за ежедневни ястия в българската кухня.`;

    // Replace Cohere API call with local bggpt API call
    const response = await fetch(`http://INSERT_IP:11434/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'todorov/bggpt',
        prompt: prompt,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      console.log('Raw response:', data);
      throw new Error('Invalid JSON response from API');
    }

    console.log('BGGPT API response:', jsonData);

    // Parse the response text
    const recipeData = jsonData.response || '';
    if (!recipeData) {
      return [{
        title: "Без име на рецептата",
        description: "Няма налично описание.",
        fullRecipe: ["Няма налични инструкции за рецептата."],
        rating: Math.floor(Math.random() * 5) + 1,
      }];
    }

    // Parse and format the recipe data with type annotations
    const lines = recipeData.split('\n').map((line: string) => line.trim()).filter((line: string) => line !== "");

    const titleMatch = lines.find((line: string) => line.includes("title"));
    const title = titleMatch ? titleMatch.split(':')[1]?.trim() : "Без име на рецептата"; 
    
    const descriptionMatch = lines.find((line: string) => line.includes("description"));
    const description = descriptionMatch ? descriptionMatch.split(':')[1]?.trim() : "Няма налично описание."; 
    
    const fullRecipeLines = lines.slice(2).map((line: string, index: number) => line.trim()).filter((line: string) => line !== "");
    const fullRecipe = Array.isArray(fullRecipeLines) ? fullRecipeLines : ["Няма налични инструкции за рецептата."];

    const ratingMatch = lines.find((line: string) => line.includes("rating"));
    const rating = ratingMatch ? parseInt(ratingMatch.replace(/[^0-9]/g, '')) : Math.floor(Math.random() * 5) + 1;

    return [{ title, description, fullRecipe, rating }];
    
  } catch (error) {
    console.error('Грешка при генериране на рецепти:', error);
    return [];
  }
};