/**
 * Meal data structure definition with nutritional information
 */
export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image?: string; // Optional meal image URL
  category: string;
}

/**
 * Predefined meals with nutritional data and category information
 */
export const predefinedMeals: Meal[] = [
  {
    id: '1',
    name: 'Овесена каша',
    calories: 307,
    protein: 13,
    carbs: 55,
    fats: 5,
    category: 'закуска',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsoi_fZKXZ4mTHNc99gpyFQyh9beF3AFzRYg&s',
  },
  {
    id: '2',
    name: 'Пилешки гърди',
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    category: 'основно',
    image: 'https://www.lunchbox.eu/wp-content/uploads/2020/08/flavouredsome-chiken-brest.jpg',
  },
  {
    id: '3',
    name: 'Гръцка салата',
    calories: 230,
    protein: 7,
    carbs: 13,
    fats: 18,
    category: 'салата',
    image: 'https://images.immediate.co.uk/production/volatile/sites/30/2014/05/Greek-salad-3b6b6fb.jpg',
  },
  {
    id: '4',
    name: 'Мюсли с кисело мляко',
    calories: 286,
    protein: 11,
    carbs: 45,
    fats: 8,
    category: 'закуска',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2020/09/Muesli-005.jpg',
  },
  {
    id: '5',
    name: 'Омлет със зеленчуци',
    calories: 280,
    protein: 19,
    carbs: 6,
    fats: 21,
    category: 'закуска',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2021/03/Vegetable-Omelette-006.jpg',
  },
  {
    id: '6',
    name: 'Пълнозърнест сандвич',
    calories: 320,
    protein: 15,
    carbs: 38,
    fats: 12,
    category: 'закуска',
    image: 'https://www.eatingwell.com/thmb/vFO43UyAy2NBgjOX-7W-VZy9lZw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/turkey-apple-cheddar-sandwich-2c86c62.jpg',
  },
  {
    id: '7',
    name: 'Сьомга на скара',
    calories: 367,
    protein: 34,
    carbs: 0,
    fats: 24,
    category: 'основно',
    image: 'https://www.recipetineats.com/wp-content/uploads/2019/03/Grilled-Salmon_6.jpg',
  },
  {
    id: '8',
    name: 'Киноа със зеленчуци',
    calories: 280,
    protein: 11,
    carbs: 39,
    fats: 12,
    category: 'основно',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2020/02/Quinoa-Bowls-001.jpg',
  },
  {
    id: '9',
    name: 'Протеинов шейк',
    calories: 180,
    protein: 25,
    carbs: 15,
    fats: 3,
    category: 'снакс',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2021/10/Protein-Shake-001.jpg',
  },
  {
    id: '10',
    name: 'Цезар салата',
    calories: 270,
    protein: 15,
    carbs: 8,
    fats: 22,
    category: 'салата',
    image: 'https://natashaskitchen.com/wp-content/uploads/2019/01/Caesar-Salad-Recipe-3.jpg',
  },
  {
    id: '11',
    name: 'Тиквички на фурна',
    calories: 95,
    protein: 4,
    carbs: 11,
    fats: 4,
    category: 'основно',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2020/05/Roasted-Zucchini-016.jpg',
  },
  {
    id: '12',
    name: 'Протеинов бар',
    calories: 220,
    protein: 20,
    carbs: 23,
    fats: 8,
    category: 'снакс',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2020/10/Protein-Bars-001.jpg',
  },
  {
    id: '13',
    name: 'Плодова салата',
    calories: 120,
    protein: 2,
    carbs: 28,
    fats: 0,
    category: 'десерт',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2021/06/Fruit-Salad-001.jpg',
  },
  {
    id: '14',
    name: 'Печено пиле със зеленчуци',
    calories: 350,
    protein: 35,
    carbs: 15,
    fats: 18,
    category: 'основно',
    image: 'https://www.recipetineats.com/wp-content/uploads/2020/02/Herb-Garlic-Butter-Roast-Chicken_6.jpg',
  },
  {
    id: '15',
    name: 'Протеинов пудинг',
    calories: 180,
    protein: 15,
    carbs: 20,
    fats: 5,
    category: 'десерт',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2021/03/Chia-Pudding-011.jpg',
  },
  {
    id: '16',
    name: 'Паста с песто',
    calories: 420,
    protein: 12,
    carbs: 58,
    fats: 18,
    category: 'основно',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2020/06/Pesto-Pasta-007.jpg',
  },
  {
    id: '17',
    name: 'Бадеми',
    calories: 164,
    protein: 6,
    carbs: 6,
    fats: 14,
    category: 'снакс',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2020/08/How-to-Toast-Almonds-003.jpg',
  },
  {
    id: '18',
    name: 'Пълнозърнеста питка с авокадо',
    calories: 260,
    protein: 8,
    carbs: 25,
    fats: 15,
    category: 'закуска',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2021/02/Avocado-Toast-016.jpg',
  },
  {
    id: '19',
    name: 'Смути бол',
    calories: 340,
    protein: 12,
    carbs: 52,
    fats: 10,
    category: 'закуска',
    image: 'https://www.acouplecooks.com/wp-content/uploads/2020/12/Smoothie-Bowl-001.jpg',
  },
  {
    id: '20',
    name: 'Печена сьомга с броколи',
    calories: 390,
    protein: 42,
    carbs: 12,
    fats: 22,
    category: 'основно',
    image: 'https://www.recipetineats.com/wp-content/uploads/2019/03/Honey-Garlic-Salmon_6.jpg',
  }
];

/**
 * Available meal categories (in Bulgarian)
 * всички (all), закуска (breakfast), основно (main), салата (salad), 
 * десерт (dessert), снакс (snacks)
 */
export const categories = [
  'всички',
  'закуска',
  'основно',
  'салата',
  'десерт',
  'снакс',
];