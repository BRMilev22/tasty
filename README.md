<p align="center"><img src="https://github.com/user-attachments/assets/428d2e63-de9f-43f6-9bfd-118885eefa2b" width="200" height="250" alt="Tasty Logo"></p>

# 🍽️ Tasty - Приложение за планиране на здравословно хранене

**Tasty** е приложение за планиране на здравословно хранене, разработено с **React Native** и **TypeScript**, което предлага мобилна и уеб версия. Потребителите могат да създават персонализирани планове за хранене, да проследяват инвентара си чрез сканиране на баркодове и да получават препоръки за рецепти въз основа на инвентара и целите си.

## 📦 Функционалности

- **Регистрация и вписване на потребителите:** 
  - Създаване на профил с основна информация като пол, възраст, височина и тегло.
  
- **Цели:** 
  - Задаване на цел — **Повишаване на теглото**, **Поддържане на теглото**, или **Отслабване**.

- **Табло за управление:** 
  - Преглеждане на персонализиран напредък и статистика, включително прием на калории и скорошни дейности.
  
- **Менажиране на инвентара:** 
  - Сканиране на хранителни продукти при пазаруване или при всяка ситуация и автоматично добавяне към инвентара.

- **Препоръки за рецепти:** 
  - Получаване рецепти, съобразени с инвентара и диетичните цели.

- **Поддръжка на различни платформи:** 
  - Достъпно за телефон или в мрежата.

- **Баркод скенер:** 
  - Сканиране на хранителните продукти за бързо добавяне към инвентара.
  
## 🛠️ Технологии

- **Frontend:**
  - [React Native](https://reactnative.dev/) - Framework за създаване на native приложения с помощта на React.
  - [TypeScript](https://www.typescriptlang.org/) - Програмен език и типизиран супернабор на JavaScript за изграждане на надеждни приложения.
  - [NativeWind](https://www.nativewind.dev/) - Библиотека за използване на Tailwind CSS с React Native, която улеснява стилизирането и го прави по-стабилно за различни платформи.
  - [Expo Go](https://expo.dev/) - Платформа за универсални native приложения за Android, iOS и уеб.
  - [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) - Използва се за сканиране на баркодове и заснемане на изображения.
  
- **Backend:**
  - [Node.js](https://nodejs.org/) - Mногоплатформена среда за изпълнение на сървърни и мрежови приложения с отворен код.
  - [Express](https://expressjs.com/) - Минимален и гъвкав framework за уеб приложения с Node.js.
  - [Firebase](https://firebase.google.com/) - Платформата на Google за сигурно съхранение на данни при мобилни и уеб приложения.

## 🫂 Участници и разработчици

- **[Божидар Димов](https://github.com/BADimov21)**
  	- Имейл: BADimov21@codingburgas.bg
  	- Full-Stack разработчик
  	- Създател на „Tasty“
  	- Ученик по програмиране и информационни технологии в ПГ по компютърно програмиране и иновации, гр. Бургас
  	- Специалност: Приложно програмиране
- **[Борис Милев](https://github.com/BRMilev22)**
  - Имейл: BRMilev22@codingburgas.bg  
  - Full-Stack разработчик
  - Създател на „Tasty“
  - Ученик по програмиране и информационни технологии в ПГ по компютърно програмиране и иновации, гр. Бургас
  - Специалност: Програмиране на роботи

## 📊 Първи стъпки

### 📋 Предварителни изисквания

За да започнете, уверете се, че сте инсталирали следното:

- **Node.js**: [Изтеглете Node.js](https://nodejs.org/)
- **Expo CLI**: Инсталирайте, като копирате и поставите тази команда в командния ред:
  ```bash
  npm install -g expo-cli
  
### ⚙️ Инсталиране
- Клонирайте хранилището, като копирате командите и ги поставите в командния си ред:
  ```bash
  git clone "https://github.com/BRMilev22/tasty.git"
  cd tasty
  ```
- Инсталирайте зависимостите, като копирате командите и ги поставите в командния ред:
  ```bash
  npm install
  ```

  ```bash
  npx expo start
  ```
  Следвайте указанията, за да стартирате приложението на предпочитаното от вас устройство или емулатор.

### 🧪 Тестване
- За да стартирате тестовете за основни компоненти и помощни програми, копирайте командата и я поставете в командния ред:

  ```bash
  npm test
  ```

### 🔧 Файлова структура на проекта
Преглед на структурата на папките:
  ```bash
TASTY/
├── .expo/
├── .firebase/
├── android/
├── app/                         # All screen components organized by feature
│   ├── (tabs)/
│   │   ├── addMeal.tsx
│   │   ├── dashboard.tsx
│   │   ├── goals.tsx
│   │   ├── inventory.tsx
│   │   ├── planMeal.tsx
│   │   ├── recipes.tsx
│   │   ├── scan.tsx
│   │   └── trackWeight.tsx 
│   ├── auth/                    # Authentication-related screens
│   │   ├── AuthScreen.tsx
│   │   └── RegisterScreen.tsx   # Onboarding & Setup screens
│   ├── components/
│   │   ├── AddMealButton.tsx
│   │   ├── LogMealModal.tsx
│   │   ├── ManualMenuInput.tsx
│   │   ├── MealSelector.tsx
│   │   └── NutritionCard.tsx
│   ├── data/
│   │   └── predefinedMeals.ts
│   ├── services/
│   │   └── mealService.ts
│   ├── types/
│   │   └── navigation.ts
│   ├── _layout_.tsx
│   ├── editProfile.tsx
│   ├── genderSelect.tsx
│   ├── goalsSelect.tsx
│   ├── heightSelect.tsx
│   ├── weightSelect.tsx
│   └── welcomeScreen.tsx
├── components/                  # Reusable components
│   ├── __tests__/
│   ├── EditScreenInfo.tsx
│   ├── ExternalLink.tsx
│   ├── Logo.tsx
│   ├── StyledText.tsx
│   ├── Themed.tsx
│   ├── useClientOnlyValue.ts
│   ├── useClientOnlyValue.web.ts
│   ├── useColorScheme.ts
│   └── useColorScheme.web.ts
├── assets/                      # Static assets such as images and fonts
│   ├── fonts/
│   └── images/
├── constants/                   # Constants and configuration files
│   └── Colors.ts
├── node_modules/           
├── public/                      # Public assets
│   ├── 404.html
│   ├── index.html
│   └── logo.svg
├── services/
│   └── recipeService.ts
├── types/
│   └── env.d.ts
├── .firebaserc
├── .gitignore
├── app.json
├── App.tsx
├── babel.config.js
├── expo-env.d.ts                # Expo environment type definitions
├── firebase.json                # Firebase configuration file
├── firebaseConfig.ts            # Firebase SDK initialization and config
├── firestore.rules
├── package-lock.json
├── package.json
├── README.md
├── SECURITY.md
├── tailwind.config.js           # TailwindCSS configuration
└── tsconfig.json                # TypeScript configuration
```

<h3 align="center"> Благодарим Ви и дано приложението Ви хареса! <h3>
<hr>
<h4 align="center"> Създадено от екипа на „Tasty“ - Божидар Димов и Борис Милев | &copy 2024 Всички права запазени.</h4>
<h2 align="center">Благодарим Ви, че разгледахте нашето repo! Покажете малко ❤️, като дадете ⭐️ на repo-то!</h2>
