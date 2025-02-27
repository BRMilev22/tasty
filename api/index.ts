import express from 'express';
import mysql, { RowDataPacket } from 'mysql2/promise';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Add more detailed logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'mealdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306
});

// Add better error handling for initial connection
pool.getConnection()
  .then(async connection => {
    console.log('Database connected successfully');
    
    // Check database
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('Available databases:', databases);
    
    // Check tables in mealdb
    const [tables] = await connection.query('SHOW TABLES FROM mealdb');
    console.log('Tables in mealdb:', tables);
    
    // Check table structure
    const [columns] = await connection.query('DESCRIBE recipesBulgarian');
    console.log('recipesBulgarian columns:', columns);
    
    // Check if table has data
    const [count] = await connection.query('SELECT COUNT(*) as count FROM recipesBulgarian');
    console.log('Number of recipes:', count);
    
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err);
    if (err.code === 'ECONNREFUSED') {
      console.error('Make sure MySQL is running and the connection details are correct');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('Database "mealdb" does not exist');
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      console.error('Table "recipesBulgarian" does not exist');
    }
    process.exit(1);
  });

interface MealRow extends RowDataPacket {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  youtube_link: string;
  source: string;
  carbs: number;
  protein: number;
  fat: number;
  kcal: number;
  [key: string]: any; // For dynamic ingredient and measure fields
}

// Add a root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Get random meals
app.get('/recipes/random', async (req, res) => {
  try {
    const [rows] = await pool.query<MealRow[]>(`
      SELECT 
        id,
        name,
        category,
        area,
        instructions,
        thumbnail,
        youtube_link,
        source,
        carbs,
        protein,
        fat,
        kcal,
        ingredient1, measure1,
        ingredient2, measure2,
        ingredient3, measure3,
        ingredient4, measure4,
        ingredient5, measure5,
        ingredient6, measure6,
        ingredient7, measure7,
        ingredient8, measure8,
        ingredient9, measure9,
        ingredient10, measure10,
        ingredient11, measure11,
        ingredient12, measure12,
        ingredient13, measure13,
        ingredient14, measure14,
        ingredient15, measure15,
        ingredient16, measure16,
        ingredient17, measure17,
        ingredient18, measure18,
        ingredient19, measure19,
        ingredient20, measure20
      FROM recipesBulgarian 
      ORDER BY RAND() 
      LIMIT 50
    `);

    // Log the first meal to verify data
    if (rows.length > 0) {
      console.log('Sample meal data:', {
        name: rows[0].name,
        carbs: rows[0].carbs,
        protein: rows[0].protein,
        fat: rows[0].fat,
        kcal: rows[0].kcal,
        ingredient1: rows[0].ingredient1,
        measure1: rows[0].measure1,
        instructions: rows[0].instructions?.substring(0, 100) + '...'
      });
    }

    res.json({ meals: rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get meal by ID
app.get('/recipes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query<MealRow[]>(
      'SELECT * FROM recipesBulgarian WHERE id = ?',
      [req.params.id]
    );
    
    if (!rows || rows.length === 0) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }

    res.json({ meal: rows[0] });
  } catch (error) {
    console.error('Error fetching meal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get meals by category
app.get('/recipes/category/:category', async (req, res) => {
  try {
    const [rows] = await pool.query<MealRow[]>(
      'SELECT * FROM recipesBulgarian WHERE category = ?',
      [req.params.category]
    );
    
    res.json({ meals: rows });
  } catch (error) {
    console.error('Error fetching meals by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update the ingredients endpoint to match your database schema
app.get('/ingredients', async (req, res) => {
  try {
    // First, let's see the actual column names
    const [columns] = await pool.query(`
      SHOW COLUMNS FROM ingredientsBulgarian;
    `);
    console.log('Database columns:', columns);

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, name, english_name, image_url, image_small_url, image_medium_url,
             calories_100g, 
             protein_100g, 
             carbs_100g, 
             fat_100g 
      FROM ingredientsBulgarian
      ORDER BY name
    `);
    
    // Log the first row to see what data we're getting
    if (rows.length > 0) {
      console.log('Sample ingredient data:', JSON.stringify(rows[0], null, 2));
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  GET /');
  console.log('  GET /recipes/random');
  console.log('  GET /recipes/:id');
  console.log('  GET /recipes/category/:category');
  console.log('  GET /ingredients');
}); 