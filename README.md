<p align="center"><img src="https://github.com/user-attachments/assets/428d2e63-de9f-43f6-9bfd-118885eefa2b" width="200" height="250" alt="Tasty Logo"></p>

# 🍽️ Tasty - Meal Planning App

**Tasty** is a meal planning app developed with **React Native** and **TypeScript**, offering both mobile and web versions. Users can create personalized meal plans, track inventory through barcode scanning, and receive recipe recommendations based on their inventory and goals.

## 📦 Features

- **User Registration & Login:** 
  - Create an account with basic information like gender, age, height, and weight.
  
- **Goals:** 
  - Set a goal — **Gain Weight**, **Maintain Weight**, or **Lose Weight**.

- **Dashboard:** 
  - View personalized progress and stats, including calorie intake and recent activities.
  
- **Inventory Management:** 
  - Scan products while shopping to automatically add them to your inventory.

- **Recipe Recommendations:** 
  - Receive recipes tailored to your inventory and dietary goals.

- **Cross-platform Support:** 
  - Available on mobile and web.

- **Barcode Scanner:** 
  - Scan items quickly to add them to your inventory.

## 🛠️ Tech Stack

- **Frontend:**
  - [React Native](https://reactnative.dev/) - Framework for building native apps using React.
  - [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript for building robust applications.
  - [NativeWind](https://www.nativewind.dev/) - A library for using Tailwind CSS with React Native, making styling easier and more consistent across platforms.
  - [Expo Go](https://expo.dev/) - Platform for universal native apps on Android, iOS, and the web.
  - [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) - Used for barcode scanning and image capturing.
  
- **Backend:**
  - [Node.js](https://nodejs.org/) - JavaScript runtime.
  - [Express](https://expressjs.com/) - Minimal and flexible Node.js web application framework.
  - [Firebase](https://firebase.google.com/) - Google’s platform for mobile and web applications.

## 🫂 Contributors

- [Bozhidar Dimov](https://github.com/BADimov21) - Full-Stack Developer, Co-Creator of "Tasty" - Programming and ICT student at VSCPI, Burgas
- [Boris Milev](https://github.com/BRMilev22) - Full-Stack Developer, Co-Creator of "Tasty" - Programming and ICT student at VSCPI, Burgas

## 📊 Getting Started

### Prerequisites

To get started, ensure you have the following installed:

- **Node.js**: [Download Node.js](https://nodejs.org/)
- **Expo CLI**: Install by copying and pasting this command in your command prompt:
  ```bash
  npm install -g expo-cli
  
### Installation
- Clone the repository by copying the commands and pasting them in your command prompt:
  ```bash
  git clone "https://github.com/BRMilev22/tasty.git"
  cd tasty
  ```
- Install dependencies by copying the commands and pasting them in your command prompt:
  ```bash
  npm install
  ```

  ```bash
  npx expo start
  ```
  Follow the prompts to run the app on your preferred device or emulator.

### 🧪 Testing
To run the unit tests for core components and utilities copy the command and paste it in your command prompt:

  ```bash
  npm test
  ```

### 🔧 Project Structure
Here’s an overview of the folder structure:
  ```bash
TASTY/
├── .expo/
├── .firebase/
├── app/                         # All screen components organized by feature
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── goals.tsx
│   │   ├── inventory.tsx
│   │   ├── recipes.tsx
│   │   └── scan.tsx
│   ├── auth/                    # Authentication-related screens
│   │   ├── AuthScreen.tsx
│   │   └── RegisterScreen.tsx   # Onboarding & Setup screens
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
│   ├── ExpoCamera.tsx
│   ├── ExternalLink.tsx
│   ├── StyledText.tsx
│   ├── Themed.tsx
│   ├── useClientOnlyValue.ts
│   ├── useClientOnlyValue.web.ts
│   ├── useColorScheme.ts
│   └── useColorScheme.web.ts
├── assets/                      # Static assets such as images and icons
│   ├── fonts/
│   └── images/
├── constants/                   # Constants and configuration files
│   └── Colors.ts
├── node_modules/           
├── public/                      # Public assets
│   ├── 404.html
│   └── index.html
├── .firebaserc
├── .gitignore
├── app.json
├── babel.config.js
├── expo-env.d.ts                # Expo environment type definitions
├── firebase.json                # Firebase configuration file
├── firebaseConfig.ts            # Firebase SDK initialization and config
├── package-lock.json
├── package.json
├── README.md
├── tailwind.config.js           # TailwindCSS configuration
├── tsconfig.json                # TypeScript configuration
```

<h3 align="center"> Thank you and enjoy using our app! <h3>
<hr>
<h4 align="center"> Created by the "Tasty" Team - Bozhidar Dimov and Boris Milev | &copy 2024 All rights reserved.</h4>
<h2 align="center">Thanks for checking out our repo, show us some ❤️ by giving our repo a ⭐️!</h2>
