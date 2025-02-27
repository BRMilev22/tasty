import { processReceiptItems } from '../services/receiptProcessingService';

// Sample Taggun API response
const sampleTaggunResponse = {
  "amounts": [
    {
      "text": "Торбичка Кауфланд, ч 0.99 B",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 0.99,
        "text": "0.99"
      }
    },
    {
      "text": "Домати (кг) 4.000 x 0.89 3.56",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 3.56,
        "text": "3.56"
      }
    },
    {
      "text": "Шуменско 0,5 Кен 16.89",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 16.89,
        "text": "16.89"
      }
    },
    {
      "text": "Сирене Краве 900 БДС 2.000 × 1.15 2.30",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 2.30,
        "text": "2.30"
      }
    },
    {
      "text": "KLC Моцарела 2.000 × 4.65",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 9.30,
        "text": "9.30"
      }
    },
    {
      "text": "Луканка Ханджийски 5.000 × 3.49",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 17.45,
        "text": "17.45"
      }
    },
    {
      "text": "Елит Мес суджук 4.000 x 8.99",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 35.96,
        "text": "35.96"
      }
    },
    {
      "text": "Молерите Бански 35.96",
      "amount": {
        "confidenceLevel": 0.95,
        "data": 35.96,
        "text": "35.96"
      }
    }
  ],
  "totalAmount": {
    "confidenceLevel": 0.92,
    "data": 88.54,
    "text": "88.54"
  }
};

async function main() {
  try {
    // Now passing the Taggun response directly
    const result = await processReceiptItems(sampleTaggunResponse);
    console.log('Processed Receipt Items:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 