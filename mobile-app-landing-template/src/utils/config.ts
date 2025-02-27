import type { TemplateConfig } from "./configType";

const templateConfig: TemplateConfig = {
  name: "Tasty",
  seo: {
    title: "Tasty - Умен начин да се храниш здравословно",
    description:
      "Tasty е мобилно приложение, което ти помага да следиш храненето си и да се храниш здравословно по лесен и интуитивен начин.",
  },
  backgroundGrid: false,
  logo: "/icon.png",
  theme: "corporate",
  forceTheme: true,
  showThemeSwitch: false,
  appStoreLink: "",
  googlePlayLink: "",
  termsAndConditions: {
    seo: {
      title: "Общи условия | Tasty",
      description: "Общи условия за използване на Tasty - приложението за здравословно хранене"
    },
    content: "Общи условия за използване на Tasty..."
  },
  privacyPolicy: {
    seo: {
      title: "Политика за поверителност | Tasty",
      description: "Политика за поверителност на Tasty - приложението за здравословно хранене"
    },
    content: "Политика за поверителност на Tasty..."
  },
  cookiesPolicy: {
    seo: {
      title: "Политика за бисквитки | Tasty",
      description: "Политика за бисквитки на Tasty - приложението за здравословно хранене"
    },
    content: "Политика за бисквитки на Tasty..."
  },
  footer: {
    legalLinks: {
      termsAndConditions: true,
      cookiesPolicy: true,
      privacyPolicy: true,
    },
    socials: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
    links: [
      { href: "/#features", title: "Функционалности" },
      { href: "/#how-it-works", title: "Как работи" },
      { href: "/#pricing", title: "Цени" },
      { href: "/#faq", title: "Често задавани въпроси" },
    ],
  },
  topNavbar: {
    cta: "Изтегли приложението",
    disableWidthAnimation: true,
    hideAppStore: true,
    hideGooglePlay: true,
    links: [
      { href: "/#features", title: "Функционалности" },
      { href: "/#how-it-works", title: "Как работи" },
      { href: "/#pricing", title: "Цени" },
      { href: "/#faq", title: "Често задавани въпроси" },
    ],
  },
  appBanner: {
    id: "app-banner",
    title: "Изтегли Tasty още днес!",
    subtitle:
      "Открий умен начин да се храниш здравословно, където и да се намираш.",
    screenshots: [
      "/screenshots/1.webp",
      "/screenshots/2.webp",
      "/screenshots/3.webp",
    ],
  },
  home: {
    seo: {
      title: "Tasty - Умен начин да се храниш здравословно",
      description:
        "Tasty е твоето решение за следене на храненето и здравословен начин на живот. Изтегли приложението сега!",
    },
    header: {
      headline: "Поеми контрол над храненето си.",
      subtitle: "Умен начин да се храниш здравословно.",
      screenshots: ["/screenshots/1.webp"],
      usersDescription: "100+ души вече ползват приложението.",
      headlineMark: [1, 3]
    },
    testimonials: {
      id: "testimonials",
      title: "Отзиви",
      subtitle: "Какво казват нашите потребители",
      cards: [
        {
          name: "Иван Иванов",
          comment:
            "Tasty промени начина, по който се храня. Приложението е изключително интуитивно и лесно за използване.",
        },
        {
          name: "Мария Петрова",
          comment:
            "С помощта на Tasty мога да следя калориите си и да се храня по-здравословно. Силно препоръчвам!",
        },
        {
          name: "Георги Георгиев",
          comment:
            "Приложението е страхотно! Лесно е за използване и ми помага да следя храненето си без усилие.",
        },
      ],
    },
    partners: {
      title: "Доверено от",
      logos: ["/misc/companies/vscpi.png"],
    },
    howItWorks: {
      id: "how-it-works",
      title: "Как работи",
      subtitle: "Лесен процес в няколко стъпки",
      steps: [
        {
          title: "Инсталирай приложението",
          subtitle:
            "Изтегли Tasty и го инсталирай на своето устройство.",
          image: "/stock/01.webp",
        },
        {
          title: "Създай акаунт",
          subtitle:
            "Регистрирай се с твоите данни за минути.",
          image: "/stock/02.webp",
        },
        {
          title: "Добави храненията си",
          subtitle:
            "Започни да въвеждаш своите хранения и напитки.",
          image: "/stock/03.webp",
        },
        {
          title: "Анализирай храненето си",
          subtitle:
            "Получавай полезни статистики и съвети.",
          image: "/stock/04.webp",
        },
      ],
    },
    features: {
      id: "features",
      title: "Функционалности",
      subtitle: "Tasty предлага иновативни инструменти за ефективно следене на храненето.",
      cards: [
        {
          title: "Проследяване на хранения",
          subtitle: "Лесно и бързо добавяне на храна и напитки.",
          icon: "/3D/bell-front-color.webp"
        },
        {
          title: "Сканиране на баркод",
          subtitle: "Сканирай баркода на храните, за да ги добавиш лесно.",
          icon: "/3D/camera-front-color.webp"
        },
        {
          title: "Напомняния",
          subtitle: "Настрой напомняния за хранене и прием на вода.",
          icon: "/3D/bulb-front-color.webp"
        },
        {
          title: "История на храненията",
          subtitle: "Следи историята на храненията си и анализирай навиците си.",
          icon: "/3D/calender-front-color.webp"
        },
      ]
    },
    faq: {
      id: "faq",
      title: "Често задавани въпроси",
      qa: [
        {
          question: "Как да създам акаунт?",
          answer: "Натисни бутона 'Регистрация' и въведи своите данни."
        },
        {
          question: "Колко струва приложението?",
          answer: "Tasty е напълно безплатно за ползване!"
        },
        {
          question: "Как мога да сканирам баркод?",
          answer: "Приложението има функция за сканиране, която автоматично разпознава информацията от баркода на храната."
        },
        {
          question: "Мога ли да получавам напомняния?",
          answer: "Да, можеш да настроиш напомняния за хранене и прием на вода."
        }
      ]
    },
    pricing: {
      id: "pricing",
      title: "Цени",
      subtitle: "Tasty е напълно безплатно!",
      actionText: "Изтегли приложението безплатно!",
      plans: [
        {
          title: "Безплатен план",
          price: "0 лв/месец",
          rows: ["Всички основни функции", "Няма ограничения"]
        }
      ]
    }
  }
};

export default templateConfig;
