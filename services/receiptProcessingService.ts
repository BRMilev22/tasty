interface ReceiptItem {
  name: string;
  quantity?: number;
  price?: number;
  unit?: string;
}

interface ProcessedReceipt {
  foodItems: ReceiptItem[];
  beverages: ReceiptItem[];
  totalAmount: number;
}

interface TaggunItem {
  confidenceLevel?: number;
  data?: string;
  text?: string;
  amount?: {
    confidenceLevel?: number;
    data?: number;
    text?: string;
  };
}

const transformTaggunToText = (taggunResponse: any): string => {
  try {
    console.log('Raw Taggun Response:', JSON.stringify(taggunResponse, null, 2));
    
    // Extract items from the Taggun response
    const items = taggunResponse.amounts
      ?.filter((item: TaggunItem) => item.text && item.text.trim().length > 0)
      .map((item: TaggunItem) => item.text);
    
    console.log('Extracted Items:', items);

    // Extract total amount
    const totalAmount = taggunResponse.totalAmount?.text || '';
    console.log('Total Amount:', totalAmount);

    // Combine into a formatted receipt text
    const receiptText = `${items.join('\n')}\nОБЩА СУМА ${totalAmount}`;
    console.log('Transformed Receipt Text:', receiptText);
    
    return receiptText;
  } catch (error) {
    console.error('Error transforming Taggun response:', error);
    throw new Error('Failed to transform Taggun response to text');
  }
};

export const processReceiptItems = async (receiptData: any): Promise<ProcessedReceipt> => {
  try {
    // Transform Taggun response to text format
    console.log('\n=== Starting Receipt Processing ===');
    const receiptText = transformTaggunToText(receiptData);

    const prompt = `Моля анализирай следната касова бележка и върни само хранителните продукти и напитките във формат JSON.
За всеки продукт посочи:
- име на продукта (точно както е изписано в бележката)
- количество (ако е налично, като число)
- цена (като число)
- мерна единица (кг, бр, л, или както е в бележката)

Раздели продуктите на две категории:
1. "храни":
   - Месни продукти (суджук, луканка, кайма, пастърма и др.)
   - Млечни продукти (сирене, кашкавал, моцарела, мляко и др.)
   - Плодове и зеленчуци (домати, ябълки, банани и др.)
   - Хляб и тестени изделия
   - Готови храни

2. "напитки":
   - Бира (включително марки като "Шуменско")
   - Вода
   - Безалкохолни напитки
   - Сокове
   - Вино

Важни правила:
- Игнорирай всички нехранителни продукти (торбички, др.)
- НЕ дублирай продукти в различните категории
- Запази точното име на продукта от бележката
- Ако продуктът има количество и цена за единица, умножи ги
- Ако продуктът е напитка, сложи го САМО в категория "напитки"

Касова бележка:
${receiptText}

Моля върни JSON във формат:
{
  "храни": [
    {"име": "...", "количество": X, "цена": Y, "мерна_единица": "..."},
    ...
  ],
  "напитки": [
    {"име": "...", "количество": X, "цена": Y, "мерна_единица": "..."},
    ...
  ],
  "обща_сума": X
}`;

    console.log('\nSending prompt to BG-GPT:', prompt);

    const response = await fetch('http://172.20.10.3:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'todorov/bggpt:latest',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('\nBG-GPT Raw Response:', data.response);
    
    const parsedData = JSON.parse(data.response);
    console.log('\nParsed Response Data:', JSON.stringify(parsedData, null, 2));

    console.log('\nProcessed Food Items:', parsedData.храни);
    console.log('Processed Beverages:', parsedData.напитки);

    const result = {
      foodItems: parsedData.храни.map((item: any) => {
        const processedItem = {
          name: item.име,
          quantity: item.количество,
          price: item.цена,
          unit: item.мерна_единица
        };
        console.log('Processed Food Item:', processedItem);
        return processedItem;
      }),
      beverages: parsedData.напитки.map((item: any) => {
        const processedItem = {
          name: item.име,
          quantity: item.количество,
          price: item.цена,
          unit: item.мерна_единица
        };
        console.log('Processed Beverage:', processedItem);
        return processedItem;
      }),
      totalAmount: parsedData.обща_сума
    };

    console.log('\n=== Final Processed Result ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('===============================\n');

    return result;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
}; 