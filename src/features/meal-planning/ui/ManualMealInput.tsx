import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ManualMealInputProps {
  onSubmit: (meal: any) => void;
  onCancel: () => void;
}

const ManualMealInput = ({ onSubmit, onCancel }: ManualMealInputProps) => {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [error, setError] = useState('');

  const validateInputs = () => {
    const numericCalories = Number(calories);
    const numericProtein = Number(protein);
    const numericCarbs = Number(carbs);
    const numericFats = Number(fats);

    if (!mealName.trim()) return 'Моля, въведете име на храната!';
    if (isNaN(numericCalories) || numericCalories < 100 || numericCalories > 5000)
      return 'Калориите трябва да бъдат между 100 и 5000!';
    if (isNaN(numericProtein) || numericProtein < 5 || numericProtein > 500)
      return 'Протеинът трябва да бъде между 5 и 500 g!';
    if (isNaN(numericCarbs) || numericCarbs < 10 || numericCarbs > 1000)
      return 'Въглехидратите трябва да бъдат между 10 и 1000 g!';
    if (isNaN(numericFats) || numericFats < 5 || numericFats > 300)
      return 'Мазнините трябва да бъдат между 5 и 300 g!';
    return '';
  };

  const handleSubmit = () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit({
      name: mealName,
      calories: parseInt(calories),
      protein: protein ? parseInt(protein) : 0,
      carbs: carbs ? parseInt(carbs) : 0,
      fats: fats ? parseInt(fats) : 0,
    });

    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setError('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ръчно въвеждане</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Име на храната"
          placeholderTextColor="#999999"
          value={mealName}
          onChangeText={setMealName}
        />

        <TextInput
          style={styles.input}
          placeholder="Калории"
          placeholderTextColor="#999999"
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Протеини (g)"
          placeholderTextColor="#999999"
          value={protein}
          onChangeText={setProtein}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Въглехидрати (g)"
          placeholderTextColor="#999999"
          value={carbs}
          onChangeText={setCarbs}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Мазнини (g)"
          placeholderTextColor="#999999"
          value={fats}
          onChangeText={setFats}
          keyboardType="numeric"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
            <Text style={styles.buttonText}>Отказ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Запиши</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
    color: '#FFFFFF',
    placeholderTextColor: '#999999',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManualMealInput;