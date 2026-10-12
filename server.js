const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const ROOT = __dirname;
const STORAGE_DIR = process.env.STORAGE_DIR;
const DATA = STORAGE_DIR ? path.join(STORAGE_DIR, 'site.json') : path.join(ROOT, 'data', 'site.json');
const UPLOADS_DIR = STORAGE_DIR ? path.join(STORAGE_DIR, 'uploads') : path.join(ROOT, 'public', 'uploads');
const PUBLIC = path.join(ROOT, 'public');
const PORT = process.env.PORT || 3000;
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASSWORD || 'admin123';
const sessions = new Set();

const defaultNav = [
  { id: 1, label: 'Программа', url: '#program', enabled: true, translations: { uz: { label: 'Dastur' }, en: { label: 'Program' } } },
  { id: 2, label: 'Мероприятия', url: '#events', enabled: true, translations: { uz: { label: 'Tadbirlar' }, en: { label: 'Events' } } },
  { id: 3, label: 'Спикеры', url: '#speakers', enabled: true, translations: { uz: { label: 'Spikerlar' }, en: { label: 'Speakers' } } },
  { id: 4, label: 'Проекты', url: '#projects', enabled: true, translations: { uz: { label: 'Loyihalar' }, en: { label: 'Projects' } } },
  { id: 5, label: 'Город', url: '#activations', enabled: true, translations: { uz: { label: 'Shahar' }, en: { label: 'City' } } },
  { id: 6, label: 'Карта', url: '#map', enabled: true, translations: { uz: { label: 'Xarita' }, en: { label: 'Map' } } }
];

const i18n = {
  ru: {
    eventsLink: 'Все мероприятия →',
    speakersLink: 'Все спикеры →',
    projectsLink: 'Подробнее →',
    regButton: 'Зарегистрироваться ↗',
    regTitle: 'ЗАРЕГИСТРИРУЙТЕСЬ НА TASHKENT DESIGN WEEK',
    regEyebrow: 'TASHKENT DESIGN WEEK',
    firstName: 'Имя *',
    lastName: 'Фамилия',
    phone: 'Телефон *',
    email: 'Email *',
    company: 'Компания',
    role: 'Должность',
    interest: 'Интересующее направление',
    interestOptions: ['Архитектура', 'Предметный дизайн', 'Интерьеры', 'Городская среда', 'Материалы и технологии'],
    consent: 'Я согласен на обработку персональных данных',
    successTitle: 'Спасибо!',
    successMsg: 'Спасибо за регистрацию! Мы получили вашу заявку.',
    errorTitle: 'Не удалось отправить форму',
    errorMsg: 'Пожалуйста, заполните обязательные поля и подтвердите согласие.',
    backHome: 'Вернуться на сайт',
    mapNote: 'Карта построена на Яндекс Картах. Для отображения всех фирменных меток Design Week вставьте ссылку на карту из Яндекс Конструктора в админ-панели.'
  },
  uz: {
    eventsLink: 'Barcha tadbirlar →',
    speakersLink: 'Barcha spikerlar →',
    projectsLink: 'Batafsil →',
    regButton: "Ro'yxatdan o'tish ↗",
    regTitle: "TASHKENT DESIGN WEEK GA RO'YXATDAN O'TING",
    regEyebrow: 'TASHKENT DESIGN WEEK',
    firstName: 'Ism *',
    lastName: 'Familiya',
    phone: 'Telefon *',
    email: 'Email *',
    company: 'Kompaniya',
    role: 'Lavozim',
    interest: "Qiziqqan yo'nalish",
    interestOptions: ['Arxitektura', 'Predmet dizayni', 'Interyerlar', 'Shahar muhiti', 'Materiallar va texnologiyalar'],
    consent: "Shaxsiy ma'lumotlarni qayta ishlashga roziman",
    successTitle: 'Rahmat!',
    successMsg: "Ro'yxatdan o'tganingiz uchun rahmat! Arizangiz qabul qilindi.",
    errorTitle: 'Formani yuborib bo‘lmadi',
    errorMsg: 'Iltimos, majburiy maydonlarni to‘ldiring va rozilikni tasdiqlang.',
    backHome: 'Bosh sahifaga qaytish',
    mapNote: 'Xarita Yandex Xaritalar asosida yaratilgan. Tashkent Design Week belgilarini ko‘rish uchun Yandex Konstruktor havolasini kiriting.'
  },
  en: {
    eventsLink: 'All events →',
    speakersLink: 'All speakers →',
    projectsLink: 'Learn more →',
    regButton: 'Register ↗',
    regTitle: 'REGISTER FOR TASHKENT DESIGN WEEK',
    regEyebrow: 'TASHKENT DESIGN WEEK',
    firstName: 'First name *',
    lastName: 'Last name',
    phone: 'Phone *',
    email: 'Email *',
    company: 'Company',
    role: 'Job title',
    interest: 'Area of interest',
    interestOptions: ['Architecture', 'Product design', 'Interiors', 'Urban environment', 'Materials and technologies'],
    consent: 'I agree to the processing of personal data',
    successTitle: 'Thank you!',
    successMsg: 'Thank you for registering! We have received your application.',
    errorTitle: 'Failed to submit form',
    errorMsg: 'Please fill in required fields and confirm consent.',
    backHome: 'Back to site',
    mapNote: 'Map built with Yandex Maps. To display all custom markers, insert the map widget link in the admin panel.'
  }
};

const defaults = {
  settings: {
    siteTitle: 'TASHKENT DESIGN WEEK',
    siteLogo: '',
    siteLogoAlt: 'Tashkent Design Week',
    siteLogoWidth: 150,
    siteDates: '24 — 28 СЕНТЯБРЯ 2025',
    primary: '#111111',
    accent: '#f2f0ea',
    background: '#f7f6f2',
    text: '#111111',
    font: 'Inter, Arial, sans-serif',
    displayFont: 'Arial, Helvetica, sans-serif',
    nav: defaultNav,
    translations: {
      uz: { siteDates: '2025-yil 24 — 28-SENTABR' },
      en: { siteDates: 'SEPTEMBER 24 — 28, 2025' }
    }
  },
  blocks: [
    {
      id: 1,
      type: 'logos',
      title: 'Логотипы',
      enabled: true,
      data: {
        eyebrow: 'Организаторы · Партнёры · Медиа',
        translations: {
          uz: { eyebrow: 'Tashkilotchilar · Hamkorlar · Media' },
          en: { eyebrow: 'Organizers · Partners · Media' }
        },
        logos: [
          { id: 1, name: 'PREMIUM CONCEPT', image: '', enabled: true },
          { id: 2, name: 'TASHKENT CITY', image: '', enabled: true },
          { id: 3, name: 'GROHE', image: '', enabled: true },
          { id: 4, name: 'PORCELANOSA', image: '', enabled: true },
          { id: 5, name: 'Kartell', image: '', enabled: true },
          { id: 6, name: 'AFISHA', image: '', enabled: true }
        ]
      }
    },
    {
      id: 2,
      type: 'hero',
      title: 'Главный экран',
      enabled: true,
      data: {
        title: 'TASHKENT DESIGN WEEK',
        subtitle: 'Люди. Пространства. Идеи. Новая культура города.',
        dates: '24 — 28 СЕНТЯБРЯ 2025',
        image: '',
        button: 'Зарегистрироваться',
        buttonLink: '#registration',
        translations: {
          uz: {
            subtitle: 'Odamlar. Makonlar. G‘oyalar. Yangi shahar madaniyati.',
            dates: '2025-yil 24 — 28-SENTABR',
            button: "Ro'yxatdan o'tish"
          },
          en: {
            subtitle: 'People. Spaces. Ideas. A new urban culture.',
            dates: 'SEPTEMBER 24 — 28, 2025',
            button: 'Register'
          }
        }
      }
    },
    {
      id: 3,
      type: 'program',
      title: 'Программа недели',
      enabled: true,
      data: {
        title: 'ПРОГРАММА НЕДЕЛИ ДИЗАЙНА',
        html: '<p>Лекции, выставки, дискуссии, городские проекты и специальные мероприятия на ключевых площадках Ташкента.</p><p><strong>Пять дней, десятки событий и одна общая тема — как дизайн меняет город.</strong></p>',
        linkText: 'Смотреть полную программу →',
        linkUrl: '#events',
        translations: {
          uz: {
            title: 'DIZAYN HAFTALIGI DASTURI',
            html: '<p>Toshkentning asosiy maydonlarida ma’ruzalar, ko‘rgazmalar, munozaralar va maxsus tadbirlar.</p><p><strong>Besh kun, o‘nlab voqealar va bitta umumiy mavzu — dizayn shaharni qanday o‘zgartiradi.</strong></p>',
            linkText: 'To‘liq dasturni ko‘rish →'
          },
          en: {
            title: 'DESIGN WEEK PROGRAM',
            html: '<p>Lectures, exhibitions, discussions, urban projects and special events across key venues in Tashkent.</p><p><strong>Five days, dozens of events, and one central theme — how design transforms the city.</strong></p>',
            linkText: 'View full schedule →'
          }
        }
      }
    },
    {
      id: 4,
      type: 'events',
      title: 'Ближайшие мероприятия',
      enabled: true,
      data: {
        title: 'БЛИЖАЙШИЕ МЕРОПРИЯТИЯ',
        linkText: 'Все мероприятия →',
        linkUrl: '#events',
        translations: {
          uz: { title: 'YAQIN KUNDAGI TADBIRLAR', linkText: 'Barcha tadbirlar →' },
          en: { title: 'UPCOMING EVENTS', linkText: 'All events →' }
        }
      }
    },
    {
      id: 5,
      type: 'speakers',
      title: 'Спикеры',
      enabled: true,
      data: {
        title: 'СПИКЕРЫ',
        linkText: 'Все спикеры →',
        linkUrl: '#speakers',
        translations: {
          uz: { title: 'SPIKERLAR', linkText: 'Barcha spikerlar →' },
          en: { title: 'SPEAKERS', linkText: 'All speakers →' }
        }
      }
    },
    {
      id: 6,
      type: 'projects',
      title: 'Специальные проекты',
      enabled: true,
      data: {
        title: 'СПЕЦИАЛЬНЫЕ ПРОЕКТЫ',
        linkText: '',
        linkUrl: '#',
        translations: {
          uz: { title: 'MAXSUS LOYIHALAR' },
          en: { title: 'SPECIAL PROJECTS' }
        }
      }
    },
    {
      id: 7,
      type: 'activations',
      title: 'City Activations',
      enabled: true,
      data: {
        title: 'CITY ACTIVATIONS',
        linkText: '',
        linkUrl: '#',
        translations: {
          uz: { title: 'SHAHAR FAOLLIKLARI' },
          en: { title: 'CITY ACTIVATIONS' }
        }
      }
    },
    {
      id: 8,
      type: 'map',
      title: 'Карта активностей',
      enabled: true,
      data: {
        title: 'КАРТА АКТИВНОСТЕЙ',
        intro: 'Ключевые площадки, выставки, лекции и городские активации Tashkent Design Week.',
        image: '',
        yandexUrl: 'https://yandex.ru/map-widget/v1/?ll=69.2401%2C41.2995&z=12',
        mapHeight: 560,
        note: 'Карта построена на Яндекс Картах. Для отображения всех фирменных меток Design Week вставьте ссылку на карту из Яндекс Конструктора в админ-панели.',
        translations: {
          uz: {
            title: 'FAOLLIKLAR XARITASI',
            intro: 'Tashkent Design Week ning asosiy maydonlari, ko‘rgazmalar, ma’ruzalar va shahar faolliklari.',
            note: 'Xarita Yandex Xaritalar asosida yaratilgan.'
          },
          en: {
            title: 'ACTIVITY MAP',
            intro: 'Key venues, exhibitions, lectures and urban activations of Tashkent Design Week.',
            note: 'Map built with Yandex Maps.'
          }
        }
      }
    },
    {
      id: 9,
      type: 'registration',
      title: 'Регистрация',
      enabled: true,
      data: {
        eyebrow: 'TASHKENT DESIGN WEEK',
        title: 'ЗАРЕГИСТРИРУЙТЕСЬ НА TASHKENT DESIGN WEEK',
        description: 'Присоединяйтесь к профессиональному сообществу, чтобы создавать более красивое городское будущее вместе.',
        button: 'Зарегистрироваться',
        consentText: 'Я согласен на обработку персональных данных',
        translations: {
          uz: {
            title: "TASHKENT DESIGN WEEK GA RO'YXATDAN O'TING",
            description: "Chiroyliroq shahar kelajagini birgalikda yaratish uchun professional hamjamiyatga qo'shiling.",
            button: "Ro'yxatdan o'tish",
            consentText: "Shaxsiy ma'lumotlarni qayta ishlashga roziman"
          },
          en: {
            title: 'REGISTER FOR TASHKENT DESIGN WEEK',
            description: 'Join the professional community to shape a more beautiful urban future together.',
            button: 'Register',
            consentText: 'I agree to the processing of personal data'
          }
        }
      }
    },
    {
      id: 10,
      type: 'footer',
      title: 'Footer',
      enabled: true,
      data: {
        copyright: '© Tashkent Design Week. Все права защищены.',
        email: 'hello@tashkentdesignweek.uz',
        phone: '',
        instagram: '#',
        telegram: '#',
        facebook: '#',
        youtube: '#',
        translations: {
          uz: { copyright: '© Tashkent Design Week. Barcha huquqlar himoyalangan.' },
          en: { copyright: '© Tashkent Design Week. All rights reserved.' }
        }
      }
    }
  ],
  events: [
    { id: 1, image: '', title: 'The Future of Cities', date: '24 СЕНТ', time: '18:00', location: 'Tashkent City Mall', description: 'Открывающая лекция о городах, пространстве и новой культуре.', link: '#', enabled: true, translations: { uz: { date: '24-SENT', description: 'Shaharlar, makon va yangi madaniyat haqidagi ochilish ma’ruzasi.' }, en: { date: 'SEP 24', description: 'Opening lecture on cities, space, and emerging culture.' } } },
    { id: 2, image: '', title: 'Дизайн и общество', date: '25 СЕНТ', time: '19:00', location: 'Центр современного искусства', description: 'Дискуссия дизайнеров, архитекторов и исследователей.', link: '#', enabled: true, translations: { uz: { title: 'Dizayn va jamiyat', date: '25-SENT', location: 'Zamonaviy san’at markazi', description: 'Dizaynerlar, me’morlar va tadqiqotchilar munozarasi.' }, en: { title: 'Design and Society', date: 'SEP 25', location: 'Center for Contemporary Art', description: 'Discussion with designers, architects, and researchers.' } } },
    { id: 3, image: '', title: 'Материалы будущего', date: '26 СЕНТ', time: '16:00', location: 'Premium Concept Showroom', description: 'Мастер-класс о материалах, технологиях и новых сценариях интерьера.', link: '#', enabled: true, translations: { uz: { title: 'Kelajak materiallari', date: '26-SENT', description: 'Materiallar, texnologiyalar va yangi interyer ssenariylari bo‘yicha master-klass.' }, en: { title: 'Materials of the Future', date: 'SEP 26', description: 'Masterclass on advanced materials, tech, and interior scenarios.' } } }
  ],
  speakers: [
    { id: 1, image: '', name: 'Карим Рашид', role: 'Промышленный дизайнер', company: 'Karim Rashid Inc.', country: 'США', bio: 'Международно известный дизайнер.', topic: 'Дизайн будущего', link: '#', enabled: true, translations: { uz: { role: 'Sanoat dizayneri', country: 'AQSH', topic: 'Kelajak dizayni' }, en: { role: 'Industrial Designer', country: 'USA', topic: 'Design of the Future' } } },
    { id: 2, image: '', name: 'Мария Порто', role: 'Архитектор', company: 'Studio Porto', country: 'Италия', bio: 'Архитектор и исследователь городской среды.', topic: 'Город как система', link: '#', enabled: true, translations: { uz: { role: 'Me’mor', country: 'Italiya', topic: 'Shahar — tizim sifatida' }, en: { role: 'Architect', country: 'Italy', topic: 'The City as a System' } } },
    { id: 3, image: '', name: 'Алишер Икрамов', role: 'Основатель студии', company: 'Local Design Studio', country: 'Узбекистан', bio: 'Работает на стыке предметного дизайна и культуры.', topic: 'Новая идентичность', link: '#', enabled: true, translations: { uz: { role: 'Studiya asoschisi', country: 'O‘zbekiston', topic: 'Yangi o‘zlik' }, en: { role: 'Studio Founder', country: 'Uzbekistan', topic: 'New Identity' } } },
    { id: 4, image: '', name: 'Сара Ланген', role: 'Куратор и исследователь', company: 'Independent', country: 'Нидерланды', bio: 'Исследует современные дизайн-практики.', topic: 'Кураторство и общество', link: '#', enabled: true, translations: { uz: { role: 'Kurator va tadqiqotchi', country: 'Niderlandiya', topic: 'Kuratorlik va jamiyat' }, en: { role: 'Curator & Researcher', country: 'Netherlands', topic: 'Curating and Society' } } },
    { id: 5, image: '', name: 'Дэниэл Бек', role: 'Продуктовый директор', company: 'Design Lab', country: 'Германия', bio: 'Развивает инновационные продукты и материалы.', topic: 'Материалы будущего', link: '#', enabled: true, translations: { uz: { role: 'Mahsulot direktori', country: 'Germaniya', topic: 'Kelajak materiallari' }, en: { role: 'Product Director', country: 'Germany', topic: 'Materials of the Future' } } }
  ],
  projects: [
    { id: 1, image: '', title: 'Silk Reimagined', category: 'Special project', description: 'Современная интерпретация традиционного узбекского шёлка в инсталляции от международных дизайнеров.', participants: 'Design Week artists', location: 'Tashkent', link: '#', enabled: true, translations: { uz: { category: 'Maxsus loyiha', description: 'Xalqaro dizaynerlar installyatsiyasida an’anaviy o‘zbek ipak matosining zamonaviy talqini.', location: 'Toshkent' }, en: { category: 'Special Project', description: 'Contemporary interpretation of traditional Uzbek silk through international installations.', location: 'Tashkent' } } }
  ],
  activations: [
    { id: 1, image: '', title: 'Город как галерея', date: '27 СЕНТ', time: '12:00', location: 'Центр Ташкента', description: 'Серия арт-объектов и инсталляций в ключевых точках города.', link: '#', enabled: true, translations: { uz: { title: 'Shahar — galereya sifatida', date: '27-SENT', location: 'Toshkent markazi', description: 'Shaharning asosiy nuqtalarida art-ob’ektlar va installyatsiyalar seriyasi.' }, en: { title: 'City as a Gallery', date: 'SEP 27', location: 'Tashkent City Center', description: 'A series of art objects and installations at key city locations.' } } }
  ],
  locations: [
    { id: 1, name: 'Tashkent City Mall', address: 'Ташкент', type: 'Выставка', description: 'Открытие недели', x: 22, y: 31, link: '#', enabled: true, translations: { uz: { address: 'Toshkent', type: 'Ko‘rgazma', description: 'Haftalik ochilishi' }, en: { address: 'Tashkent', type: 'Exhibition', description: 'Opening event' } } },
    { id: 2, name: 'Центр современного искусства', address: 'Ташкент', type: 'Специальный проект', description: 'Дискуссии и выставки', x: 42, y: 45, link: '#', enabled: true, translations: { uz: { name: 'Zamonaviy san’at markazi', address: 'Toshkent', type: 'Maxsus loyiha', description: 'Munozaralar va ko‘rgazmalar' }, en: { name: 'Center for Contemporary Art', address: 'Tashkent', type: 'Special Project', description: 'Discussions and exhibitions' } } },
    { id: 3, name: 'Premium Concept Showroom', address: 'Ул. Шота Руставели, 1', type: 'Мероприятие', description: 'Мастер-классы', x: 57, y: 57, link: '#', enabled: true, translations: { uz: { address: 'Shota Rustaveli ko‘chasi, 1', type: 'Tadbir', description: 'Master-klasslar' }, en: { address: '1 Shota Rustaveli St', type: 'Event', description: 'Masterclasses' } } },
    { id: 4, name: 'Парк «Узбекистан»', address: 'Ташкент', type: 'City activation', description: 'Городская активация', x: 73, y: 34, link: '#', enabled: true, translations: { uz: { name: '«O‘zbekiston» bog‘i', address: 'Toshkent', type: 'Shahar faolligi' }, en: { name: 'Uzbekistan Park', address: 'Tashkent', type: 'City activation' } } },
    { id: 5, name: 'Музей искусств', address: 'Ташкент', type: 'Выставка', description: 'Специальная экспозиция', x: 33, y: 70, link: '#', enabled: true, translations: { uz: { name: 'San’at muzeyi', address: 'Toshkent', type: 'Ko‘rgazma' }, en: { name: 'State Museum of Arts', address: 'Tashkent', type: 'Exhibition' } } }
  ],
  registrations: []
};

function t(obj, key, lang = 'ru') {
  if (!obj) return '';
  if (lang === 'ru') return obj[key] || '';
  return obj.translations?.[lang]?.[key] || obj[key + '_' + lang] || obj[key] || '';
}

function normalize(d) {
  d.settings = d.settings || {};
  if (!('siteLogo' in d.settings)) d.settings.siteLogo = '';
  if (!('siteLogoAlt' in d.settings)) d.settings.siteLogoAlt = d.settings.siteTitle || 'Tashkent Design Week';
  if (!('siteLogoWidth' in d.settings)) d.settings.siteLogoWidth = 150;
  if (!Array.isArray(d.settings.nav) || d.settings.nav.length === 0) {
    d.settings.nav = structuredClone(defaultNav);
  }
  const lb = (d.blocks || []).find(x => x.type === 'logos');
  if (lb) {
    lb.data = lb.data || {};
    lb.data.logos = lb.data.logos || [];
    lb.data.logos.forEach((l, i) => {
      if (l.id == null) l.id = i + 1;
      if (l.enabled == null) l.enabled = true;
    });
  }
  return d;
}

function load() {
  try {
    if (STORAGE_DIR) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      if (!fs.existsSync(DATA)) {
        const seedPath = path.join(ROOT, 'data', 'site.json');
        if (fs.existsSync(seedPath)) {
          fs.copyFileSync(seedPath, DATA);
        }
      }
      const seedUploads = path.join(ROOT, 'public', 'uploads');
      if (fs.existsSync(seedUploads)) {
        for (const file of fs.readdirSync(seedUploads)) {
          const target = path.join(UPLOADS_DIR, file);
          if (!fs.existsSync(target)) {
            try { fs.copyFileSync(path.join(seedUploads, file), target); } catch (e) {}
          }
        }
      }
    }
    if (!fs.existsSync(DATA)) {
      fs.mkdirSync(path.dirname(DATA), { recursive: true });
      const d = normalize(structuredClone(defaults));
      fs.writeFileSync(DATA, JSON.stringify(d, null, 2));
      return d;
    }
    const d = normalize(JSON.parse(fs.readFileSync(DATA, 'utf8')));
    fs.writeFileSync(DATA, JSON.stringify(d, null, 2));
    return d;
  } catch (e) {
    console.error(e);
    return normalize(structuredClone(defaults));
  }
}

let db = load();
function save(d = db) {
  fs.writeFileSync(DATA, JSON.stringify(d, null, 2));
}

function nextId(arr) {
  return Math.max(0, ...arr.map(x => Number(x.id) || 0)) + 1;
}

function send(res, status, body, type = 'text/html') {
  res.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function redirect(res, to) {
  res.writeHead(302, { Location: to });
  res.end();
}

function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '').split(';').filter(Boolean).map(x => {
      const [k, ...v] = x.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

function getLang(req, parsedUrl) {
  const ql = parsedUrl?.query?.lang;
  if (['ru', 'uz', 'en'].includes(ql)) return ql;
  const cl = cookies(req).tdw_lang;
  if (['ru', 'uz', 'en'].includes(cl)) return cl;
  return 'ru';
}

function isAuth(req) {
  return sessions.has(cookies(req).tdw_session);
}

function auth(req, res) {
  if (isAuth(req)) return true;
  redirect(res, '/admin/login');
  return false;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeHtml(s) {
  return String(s || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on\w+\s*=\s*(['"]).*?\1/gi, '').replace(/javascript:/gi, '');
}

function body(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => {
      b += c;
      if (b.length > 8e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(req.headers['content-type']?.includes('application/json') ? JSON.parse(b || '{}') : Object.fromEntries(new URLSearchParams(b)));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function layout(title, content, extra = '', lang = 'ru') {
  const s = db.settings || {};
  const cssVars = `--primary:${esc(s.primary || '#111111')};--accent:${esc(s.accent || '#f2f0ea')};--bg:${esc(s.background || '#f7f6f2')};--text:${esc(s.text || '#111111')};--font:${esc(s.font || 'Inter, Arial, sans-serif')};--display:${esc(s.displayFont || 'Arial, Helvetica, sans-serif')}`;
  return `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${extra}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"></head><body style="${cssVars}">${content}<script src="/site.js"></script></body></html>`;
}

function publicPage(lang = 'ru') {
  const s = db.settings;
  const loc = i18n[lang] || i18n.ru;
  const visible = db.blocks.filter(b => b.enabled);
  const hasLogo = s.siteLogo && (s.siteLogo.startsWith('/uploads/') || s.siteLogo.startsWith('http://') || s.siteLogo.startsWith('https://'));
  const brand = hasLogo
    ? `<img src="${esc(s.siteLogo)}" alt="${esc(s.siteLogoAlt || s.siteTitle)}" style="max-width:${Math.max(70, Math.min(280, Number(s.siteLogoWidth) || 150))}px;max-height:48px;object-fit:contain">`
    : `${esc(t(s, 'siteTitle', lang) || 'TASHKENT DESIGN WEEK')}`;
  const navItems = (s.nav && s.nav.length ? s.nav : defaultNav).filter(x => x.enabled !== false);
  const navHtml = `<nav>${navItems.map(n => `<a href="${esc(n.url)}">${esc(t(n, 'label', lang))}</a>`).join('')}</nav>`;

  const langSwitch = `
    <div class="lang-switch">
      <a href="?lang=ru" class="${lang === 'ru' ? 'active' : ''}">RU</a>
      <a href="?lang=uz" class="${lang === 'uz' ? 'active' : ''}">UZ</a>
      <a href="?lang=en" class="${lang === 'en' ? 'active' : ''}">EN</a>
    </div>`;

  return layout(
    t(s, 'siteTitle', lang) || 'TASHKENT DESIGN WEEK',
    `<header class="topbar"><a class="brand" href="#top">${brand}</a>${navHtml}${langSwitch}<button class="menu" aria-label="Открыть меню">☰</button></header><main id="top">${visible.map(b => renderBlock(b, lang)).join('')}</main>`,
    `<meta name="description" content="Tashkent Design Week — ${lang === 'uz' ? 'Odamlar, makonlar, g‘oyalar.' : lang === 'en' ? 'People, spaces, ideas.' : 'люди, пространства, идеи.'}">`,
    lang
  );
}

function renderBlock(b, lang = 'ru') {
  const d = b.data || {}, s = db.settings, loc = i18n[lang] || i18n.ru;

  if (b.type === 'logos') {
    const eyebrow = t(d, 'eyebrow', lang);
    return `<section class="logos section" id="logos">${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<div class="logo-row">${(d.logos || []).filter(l => l.enabled !== false).map(l => `<div class="logo-item">${l.image ? `<img src="${esc(l.image)}" alt="${esc(l.name || '')}">` : `<span>${esc(l.name)}</span>`}</div>`).join('')}</div></section>`;
  }

  if (b.type === 'hero') {
    const dates = t(d, 'dates', lang);
    const title = t(d, 'title', lang);
    const subtitle = t(d, 'subtitle', lang);
    const button = t(d, 'button', lang);
    return `<section class="hero" id="hero"><div class="hero-copy">${dates ? `<div class="eyebrow">${esc(dates)}</div>` : ''}<h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}${button ? `<a class="button hero-cta" href="${esc(d.buttonLink || '#registration')}">${esc(button)} <span>↗</span></a>` : ''}</div><div class="hero-image ${d.image ? 'has-image' : ''}" ${d.image ? `style="background-image:url('${esc(d.image)}')"` : ''}>${!d.image ? '<div class="image-placeholder">ARCHITECTURE / CITY / DESIGN</div>' : ''}</div></section>`;
  }

  if (b.type === 'program') {
    const title = t(d, 'title', lang) || b.title;
    const htmlContent = t(d, 'html', lang);
    const linkText = t(d, 'linkText', lang);
    return `<section class="section program" id="program"><div class="section-head"><h2>${esc(title)}</h2></div><div class="program-grid"><div class="rich">${safeHtml(htmlContent)}</div>${linkText ? `<a class="text-link" href="${esc(d.linkUrl || '#events')}">${esc(linkText)}</a>` : ''}</div></section>`;
  }

  if (b.type === 'events') {
    const title = t(d, 'title', lang) || b.title;
    const linkText = t(d, 'linkText', lang) || loc.eventsLink;
    return `<section class="section" id="events"><div class="section-head"><h2>${esc(title)}</h2>${linkText ? `<a href="${esc(d.linkUrl || '#events')}">${esc(linkText)}</a>` : ''}</div><div class="cards-slider">${db.events.filter(x => x.enabled).map(e => `<article class="event-card"><div class="media" ${e.image ? `style="background-image:url('${esc(e.image)}')"` : ''}>${!e.image ? '<span>EVENT / DESIGN / CITY</span>' : ''}</div><div class="meta">${esc(t(e, 'date', lang))} · ${esc(t(e, 'time', lang))}</div><h3>${esc(t(e, 'title', lang))}</h3><p>${esc(t(e, 'description', lang))}</p><small>${esc(t(e, 'location', lang))}</small></article>`).join('')}</div></section>`;
  }

  if (b.type === 'speakers') {
    const title = t(d, 'title', lang) || b.title;
    const linkText = t(d, 'linkText', lang) || loc.speakersLink;
    return `<section class="section" id="speakers"><div class="section-head"><h2>${esc(title)}</h2>${linkText ? `<a href="${esc(d.linkUrl || '#speakers')}">${esc(linkText)}</a>` : ''}</div><div class="speaker-grid">${db.speakers.filter(x => x.enabled).map(sp => {
      const spName = t(sp, 'name', lang);
      const initials = (spName || '').split(' ').map(x => x[0]).join('').slice(0, 2);
      return `<article class="speaker"><div class="portrait" ${sp.image ? `style="background-image:url('${esc(sp.image)}')"` : ''}>${!sp.image ? `<span>${esc(initials)}</span>` : ''}</div><h3>${esc(spName)}</h3><p>${esc(t(sp, 'role', lang))}</p><small>${esc(t(sp, 'company', lang))} · ${esc(t(sp, 'country', lang))}</small></article>`;
    }).join('')}</div></section>`;
  }

  if (b.type === 'projects') {
    const list = db.projects.filter(x => x.enabled);
    if (!list.length) return '';
    const title = t(d, 'title', lang) || b.title;
    const linkText = t(d, 'linkText', lang);
    return `<section class="section feature" id="projects"><div class="section-head"><h2>${esc(title)}</h2>${linkText ? `<a href="${esc(d.linkUrl || '#')}">${esc(linkText)}</a>` : ''}</div>${list.map((p, i) => `<div class="feature-card" style="${i > 0 ? 'margin-top:36px' : ''}"><div class="feature-image" ${p?.image ? `style="background-image:url('${esc(p.image)}')"` : ''}>${!p?.image ? '<span>SPECIAL PROJECT</span>' : ''}</div><div class="feature-copy"><div class="eyebrow">${esc(t(p, 'category', lang) || 'SPECIAL PROJECT')}</div><h3>${esc(t(p, 'title', lang))}</h3><p>${esc(t(p, 'description', lang))}</p>${p?.participants ? `<small>Участники: ${esc(t(p, 'participants', lang))}</small>` : ''}<a class="text-link" href="${esc(p?.link || '#')}">${esc(loc.projectsLink)}</a><div class="counter">${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')} →</div></div></div>`).join('')}</section>`;
  }

  if (b.type === 'activations') {
    const list = db.activations.filter(x => x.enabled);
    if (!list.length) return '';
    const title = t(d, 'title', lang) || b.title;
    const linkText = t(d, 'linkText', lang);
    return `<section class="section feature" id="activations"><div class="section-head"><h2>${esc(title)}</h2>${linkText ? `<a href="${esc(d.linkUrl || '#')}">${esc(linkText)}</a>` : ''}</div>${list.map((a, i) => `<div class="feature-card reverse" style="${i > 0 ? 'margin-top:36px' : ''}"><div class="feature-image" ${a?.image ? `style="background-image:url('${esc(a.image)}')"` : ''}>${!a?.image ? '<span>CITY ACTIVATION</span>' : ''}</div><div class="feature-copy"><div class="eyebrow">${esc(t(a, 'date', lang))} · ${esc(t(a, 'time', lang))}</div><h3>${esc(t(a, 'title', lang))}</h3><p>${esc(t(a, 'description', lang))}</p><small>${esc(t(a, 'location', lang))}</small><div class="counter">${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')} →</div></div></div>`).join('')}</section>`;
  }

  if (b.type === 'map') {
    const title = t(d, 'title', lang) || b.title;
    const intro = t(d, 'intro', lang);
    const note = t(d, 'note', lang) || loc.mapNote;
    return `<section class="section map-section" id="map"><div class="section-head"><div><h2>${esc(title)}</h2>${intro ? `<p>${esc(intro)}</p>` : ''}</div></div><div class="map-wrap"><div class="yandex-map"><iframe src="${esc(d.yandexUrl || 'https://yandex.ru/map-widget/v1/?ll=69.2401%2C41.2995&z=12')}" width="100%" height="${Number(d.mapHeight) || 560}" frameborder="0" allowfullscreen="true" loading="lazy" title="Яндекс Карта Tashkent Design Week"></iframe></div><div class="location-list">${db.locations.filter(x => x.enabled).map((l, i) => `<div class="location-item"><b>${i + 1}</b><div><strong>${esc(t(l, 'name', lang))}</strong><span>${esc(t(l, 'type', lang))} · ${esc(t(l, 'address', lang))}</span>${l.description ? `<em>${esc(t(l, 'description', lang))}</em>` : ''}</div></div>`).join('')}</div></div>${note ? `<p class="map-note">${esc(note)}</p>` : ''}</section>`;
  }

  if (b.type === 'registration') {
    const eyebrow = t(d, 'eyebrow', lang) || loc.regEyebrow;
    const title = t(d, 'title', lang) || loc.regTitle;
    const description = t(d, 'description', lang);
    const button = t(d, 'button', lang) || loc.regButton;
    const consentText = t(d, 'consentText', lang) || loc.consent;

    return `<section class="registration" id="registration"><div class="registration-inner"><div><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2><p>${esc(description)}</p></div><form action="/register" method="post" class="reg-form"><input name="first_name" placeholder="${esc(loc.firstName)}" required><input name="last_name" placeholder="${esc(loc.lastName)}"><input type="tel" name="phone" placeholder="${esc(loc.phone)}" required><input type="email" name="email" placeholder="${esc(loc.email)}" required><input name="company" placeholder="${esc(loc.company)}"><input name="role" placeholder="${esc(loc.role)}"><select name="interest"><option value="">${esc(loc.interest)}</option>${loc.interestOptions.map(opt => `<option>${esc(opt)}</option>`).join('')}</select><label class="consent"><input type="checkbox" name="consent" value="1" required> ${esc(consentText)}</label><button class="button light" type="submit">${esc(button)}</button></form></div></section>`;
  }

  if (b.type === 'footer') {
    const copyright = t(d, 'copyright', lang);
    const links = [];
    if (d.instagram) links.push(`<a href="${esc(d.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
    if (d.telegram) links.push(`<a href="${esc(d.telegram)}" target="_blank" rel="noopener">Telegram</a>`);
    if (d.facebook) links.push(`<a href="${esc(d.facebook)}" target="_blank" rel="noopener">Facebook</a>`);
    if (d.youtube) links.push(`<a href="${esc(d.youtube)}" target="_blank" rel="noopener">YouTube</a>`);
    if (d.phone) links.push(`<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>`);
    if (d.email) links.push(`<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`);
    return `<footer class="footer"><div><b>${esc(t(s, 'siteTitle', lang) || 'TASHKENT DESIGN WEEK')}</b><p>${esc(copyright)}</p></div><div class="footer-links">${links.join('')}</div></footer>`;
  }

  if (b.type === 'text') {
    return `<section class="section generic" id="text-${b.id}"><div class="section-head"><h2>${esc(t(d, 'title', lang) || b.title)}</h2></div><div class="rich">${safeHtml(t(d, 'html', lang))}</div></section>`;
  }

  if (b.type === 'image') {
    return `<section class="section generic" id="image-${b.id}">${d.image ? `<img class="full-image" src="${esc(d.image)}" alt="${esc(t(d, 'caption', lang) || '')}">` : ''}${d.caption ? `<p class="caption">${esc(t(d, 'caption', lang))}</p>` : ''}</section>`;
  }

  if (b.type === 'cta') {
    return `<section class="section cta" id="cta-${b.id}"><h2>${esc(t(d, 'title', lang) || b.title)}</h2><p>${esc(t(d, 'description', lang))}</p><a class="button" href="${esc(d.link || '#')}">${esc(t(d, 'button', lang) || 'Подробнее')} ↗</a></section>`;
  }

  return '';
}

function adminLogin(error = '') {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/admin.css"><title>CMS</title></head><body class="login"><form method="post" action="/admin/login" class="login-card"><div class="eyebrow">TASHKENT DESIGN WEEK</div><h1>CMS</h1><input name="username" placeholder="Логин" required><input type="password" name="password" placeholder="Пароль" required>${error ? `<div class="error">${esc(error)}</div>` : ''}<button>Войти</button></form></body></html>`;
}

const fieldMap = {
  events: [
    ['image', 'Изображение URL'],
    ['title', 'Название'],
    ['date', 'Дата'],
    ['time', 'Время'],
    ['location', 'Локация'],
    ['description', 'Описание'],
    ['link', 'Ссылка']
  ],
  speakers: [
    ['image', 'Изображение URL'],
    ['name', 'Имя'],
    ['role', 'Должность'],
    ['company', 'Компания'],
    ['country', 'Страна'],
    ['bio', 'Биография'],
    ['topic', 'Тема'],
    ['link', 'Ссылка']
  ],
  projects: [
    ['image', 'Изображение URL'],
    ['title', 'Название'],
    ['category', 'Категория'],
    ['description', 'Описание'],
    ['participants', 'Участники'],
    ['location', 'Локация'],
    ['link', 'Ссылка']
  ],
  activations: [
    ['image', 'Изображение URL'],
    ['title', 'Название'],
    ['date', 'Дата'],
    ['time', 'Время'],
    ['location', 'Локация'],
    ['description', 'Описание'],
    ['link', 'Ссылка']
  ],
  locations: [
    ['name', 'Название'],
    ['address', 'Адрес'],
    ['type', 'Тип'],
    ['description', 'Описание'],
    ['x', 'X % (для интерактивной карты)'],
    ['y', 'Y % (для интерактивной карты)'],
    ['link', 'Ссылка']
  ]
};

function fieldHtml(k, label, val = '', ruVal = '', lang = 'ru') {
  const isImg = k === 'image' || k === 'siteLogo' || k.endsWith('image') || k.endsWith('Image') || k.endsWith('Logo');
  const badge = lang !== 'ru' ? ` <span class="lang-tag">${lang.toUpperCase()}</span>` : '';
  const ph = (lang !== 'ru' && ruVal) ? ` placeholder="RU: ${esc(ruVal)}"` : '';

  if (isImg) {
    const preview = val ? `<img class="upload-preview" src="${esc(val)}" alt="Превью" onerror="this.style.display='none'">` : '';
    return `<label class="wide">${esc(label)}${badge}<div class="image-field"><input class="image-url" name="${k}" value="${esc(val)}"><input type="file" accept="image/*" onchange="uploadImage(this)">${preview}<small>Выбери файл с компьютера (до 6 МБ) или укажи URL. Затем нажми «Сохранить».</small></div></label>`;
  }
  const isTextarea = ['description', 'bio', 'html', 'intro', 'note'].includes(k) || k.endsWith('description') || k.endsWith('bio') || k.endsWith('html') || k.endsWith('intro') || k.endsWith('note');
  return `<label class="${isTextarea ? 'wide' : ''}">${esc(label)}${badge}${isTextarea ? `<textarea name="${k}" rows="3"${ph}>${esc(val)}</textarea>` : `<input name="${k}" value="${esc(val)}"${ph}>`}</label>`;
}

function blockFieldsHtml(b, lang = 'ru') {
  const d = b.data || {};
  const tr = d.translations?.[lang] || {};
  const v = (key) => lang === 'ru' ? (d[key] || '') : (tr[key] || '');
  const r = (key) => d[key] || '';
  const f = (k, label) => fieldHtml(k, label, v(k.slice(2)), r(k.slice(2)), lang);

  if (b.type === 'hero') {
    return `<div class="block-fields">
      ${f('d_title', 'Заголовок H1')}
      ${f('d_subtitle', 'Подзаголовок / Слоган')}
      ${f('d_dates', 'Даты / Eyebrow')}
      ${f('d_button', 'Текст кнопки CTA')}
      ${f('d_buttonLink', 'Ссылка кнопки CTA')}
      <div class="full">${fieldHtml('d_image', 'Фоновое изображение правой части (баннер)', d.image || '', '', 'ru')}</div>
    </div>`;
  }
  if (b.type === 'logos') {
    return `<div class="block-fields">
      <div class="full">${f('d_eyebrow', 'Подпись над логотипами (Eyebrow)')}</div>
      <div class="full field-hint">
        <p>💡 В блоке сейчас <strong>${(d.logos || []).length}</strong> логотипов. Управлять логотипами брендов можно в разделе <a href="#logos"><strong>«Логотипы в верхнем блоке»</strong></a> ниже.</p>
      </div>
    </div>`;
  }
  if (b.type === 'program') {
    return `<div class="block-fields">
      <div class="full">${f('d_title', 'Заголовок блока')}</div>
      <div class="full">${f('d_html', 'Текст / Описание программы (поддерживает HTML / абзацы)')}</div>
      ${f('d_linkText', 'Текст ссылки')}
      ${f('d_linkUrl', 'Ссылка (URL или якорь #)')}
    </div>`;
  }
  if (b.type === 'events') {
    return `<div class="block-fields">
      ${f('d_title', 'Заголовок блока')}
      ${f('d_linkText', 'Текст верхней ссылки')}
      <div class="full">${f('d_linkUrl', 'Ссылка (URL или якорь #)')}</div>
      <div class="full field-hint">
        <p>💡 Карточки мероприятий (${db.events.length} шт.) настраиваются в разделе <a href="#events"><strong>«Мероприятия»</strong></a> ниже.</p>
      </div>
    </div>`;
  }
  if (b.type === 'speakers') {
    return `<div class="block-fields">
      ${f('d_title', 'Заголовок блока')}
      ${f('d_linkText', 'Текст верхней ссылки')}
      <div class="full">${f('d_linkUrl', 'Ссылка (URL или якорь #)')}</div>
      <div class="full field-hint">
        <p>💡 Спикеры (${db.speakers.length} чел.) настраиваются в разделе <a href="#speakers"><strong>«Спикеры»</strong></a> ниже.</p>
      </div>
    </div>`;
  }
  if (b.type === 'projects') {
    return `<div class="block-fields">
      ${f('d_title', 'Заголовок блока')}
      ${f('d_linkText', 'Текст ссылки в шапке (опционально)')}
      <div class="full">${f('d_linkUrl', 'URL ссылки')}</div>
      <div class="full field-hint">
        <p>💡 Проекты (${db.projects.length} шт.) настраиваются в разделе <a href="#projects"><strong>«Специальные проекты»</strong></a> ниже.</p>
      </div>
    </div>`;
  }
  if (b.type === 'activations') {
    return `<div class="block-fields">
      ${f('d_title', 'Заголовок блока')}
      ${f('d_linkText', 'Текст ссылки в шапке (опционально)')}
      <div class="full">${f('d_linkUrl', 'URL ссылки')}</div>
      <div class="full field-hint">
        <p>💡 Активации (${db.activations.length} шт.) настраиваются в разделе <a href="#activations"><strong>«City Activations»</strong></a> ниже.</p>
      </div>
    </div>`;
  }
  if (b.type === 'map') {
    return `<div class="block-fields">
      ${f('d_title', 'Заголовок блока')}
      <label>Высота карты (px)<input type="number" name="d_mapHeight" min="300" max="1000" value="${Number(d.mapHeight) || 560}"></label>
      <div class="full">${f('d_intro', 'Вводный текст над картой')}</div>
      <label class="full">Яндекс Карта — ссылка embed / widget URL<input name="d_yandexUrl" value="${esc(d.yandexUrl || 'https://yandex.ru/map-widget/v1/?ll=69.2401%2C41.2995&z=12')}"></label>
      <div class="full">${f('d_note', 'Текст примечания под картой')}</div>
      <div class="full field-hint">
        <p>💡 Точки и адреса (${db.locations.length} локаций) настраиваются в разделе <a href="#locations"><strong>«Локации карты»</strong></a> ниже.</p>
      </div>
    </div>`;
  }
  if (b.type === 'registration') {
    return `<div class="block-fields">
      ${f('d_eyebrow', 'Подпись (Eyebrow)')}
      ${f('d_title', 'Заголовок формы')}
      <div class="full">${f('d_description', 'Описание формы')}</div>
      ${f('d_button', 'Текст кнопки отправки')}
      ${f('d_consentText', 'Текст согласия с условиями')}
      <div class="full field-hint">
        <p>💡 Входящие заявки (${db.registrations.length} шт.) хранятся в разделе <a href="#registrations"><strong>«Регистрации»</strong></a> ниже.</p>
      </div>
    </div>`;
  }
  if (b.type === 'footer') {
    return `<div class="block-fields">
      <div class="full">${f('d_copyright', 'Текст копирайта')}</div>
      <label>Email<input type="email" name="d_email" value="${esc(d.email || '')}"></label>
      <label>Телефон<input type="tel" name="d_phone" value="${esc(d.phone || '')}"></label>
      <label>Instagram URL<input name="d_instagram" value="${esc(d.instagram || '#')}"></label>
      <label>Telegram URL<input name="d_telegram" value="${esc(d.telegram || '#')}"></label>
      <label>Facebook URL<input name="d_facebook" value="${esc(d.facebook || '#')}"></label>
      <label>YouTube URL<input name="d_youtube" value="${esc(d.youtube || '#')}"></label>
    </div>`;
  }
  if (b.type === 'text') {
    return `<div class="block-fields">
      <div class="full">${f('d_title', 'Заголовок блока')}</div>
      <div class="full">${f('d_html', 'Текст / HTML содержимое')}</div>
    </div>`;
  }
  if (b.type === 'image') {
    return `<div class="block-fields">
      <div class="full">${fieldHtml('d_image', 'Изображение', d.image || '', '', 'ru')}</div>
      <div class="full">${f('d_caption', 'Подпись под изображением')}</div>
    </div>`;
  }
  if (b.type === 'cta') {
    return `<div class="block-fields">
      ${f('d_title', 'Заголовок')}
      ${f('d_button', 'Текст кнопки')}
      <div class="full">${f('d_description', 'Описание')}</div>
      <label class="full">Ссылка кнопки (URL или якорь #)<input name="d_link" value="${esc(d.link || '#')}"></label>
    </div>`;
  }
  return `<div class="block-fields">${Object.keys(d).filter(k => typeof d[k] === 'string' || typeof d[k] === 'number').map(k => `<label>${esc(k)}<input name="d_${esc(k)}" value="${esc(v(k))}"></label>`).join('')}</div>`;
}

function collectionHtml(type, title, lang = 'ru') {
  const arr = db[type];
  return `<section id="${type}" class="panel">
    <div class="panel-head">
      <div>
        <div class="eyebrow">CONTENT ${lang !== 'ru' ? `(${lang.toUpperCase()})` : ''}</div>
        <h2>${esc(title)} (${arr.length})</h2>
      </div>
    </div>
    <div class="collection-grid">${arr.map(x => {
      const tr = x.translations?.[lang] || {};
      const v = (key) => lang === 'ru' ? (x[key] || '') : (tr[key] || '');
      const r = (key) => x[key] || '';

      return `
      <form method="post" action="/admin/${type}/save" class="item-card">
        <input type="hidden" name="id" value="${x.id}">
        <input type="hidden" name="_lang" value="${lang}">
        <div class="item-top">
          <div style="display:flex;align-items:center;gap:6px">
            <b>#${x.id}</b>
            <button type="submit" formaction="/admin/${type}/${x.id}/up?lang=${lang}" class="btn-arrow" title="Поднять выше">▲</button>
            <button type="submit" formaction="/admin/${type}/${x.id}/down?lang=${lang}" class="btn-arrow" title="Опустить ниже">▼</button>
          </div>
          <button type="submit">Сохранить</button>
        </div>
        ${fieldMap[type].map(f => {
          const isShared = ['image', 'x', 'y', 'link'].includes(f[0]);
          const currentVal = isShared ? (x[f[0]] || '') : v(f[0]);
          const ruVal = r(f[0]);
          return fieldHtml(f[0], f[1], currentVal, ruVal, isShared ? 'ru' : lang);
        }).join('')}
        <div class="item-bottom">
          <label class="switch"><input type="checkbox" name="enabled" value="1" ${x.enabled ? 'checked' : ''}> Показывать</label>
          <button formaction="/admin/${type}/${x.id}/delete?lang=${lang}" formmethod="post" class="danger" onclick="return confirm('Удалить?')">Удалить</button>
        </div>
      </form>`;
    }).join('')}
    </div>
    <div class="new-item">
      <h3>+ Добавить ${esc(title.toLowerCase().replace(/ия$/, 'ие').replace(/ы$/, ''))}</h3>
      <form method="post" action="/admin/${type}/save" class="grid-form">
        <input type="hidden" name="_lang" value="ru">
        ${fieldMap[type].map(f => fieldHtml(f[0], f[1], '', '', 'ru')).join('')}
        <label class="switch"><input type="checkbox" name="enabled" value="1" checked> Показывать</label>
        <div><button>+ Добавить</button></div>
      </form>
    </div>
  </section>`;
}

function adminPage(msg = '', lang = 'ru') {
  const logosBlock = db.blocks.find(x => x.type === 'logos');
  const logosList = logosBlock?.data?.logos || [];

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/admin.css"><title>CMS — Tashkent Design Week</title></head><body>
<header class="admin-top">
  <div><b>TASHKENT DESIGN WEEK</b><span>CMS</span></div>
  <div><a href="/" target="_blank">Открыть сайт ↗</a><form method="post" action="/admin/logout" style="display:inline"><button>Выйти</button></form></div>
</header>
<div class="admin-layout">
  <aside>
    <a href="#page">Структура блоков</a>
    <a href="#settings">Настройки стиля</a>
    <a href="#nav">Меню шапки</a>
    <a href="#logos">Логотипы</a>
    <a href="#events">Мероприятия</a>
    <a href="#speakers">Спикеры</a>
    <a href="#projects">Проекты</a>
    <a href="#activations">City Activations</a>
    <a href="#locations">Локации карты</a>
    <a href="#registrations">Регистрации</a>
  </aside>
  <main class="admin-main">
    ${msg ? `<div class="notice">${esc(msg)}</div>` : ''}

    <div class="admin-lang-bar">
      <div>
        <div class="eyebrow">МНОГОЯЗЫЧНОСТЬ</div>
        <strong style="font-size:15px">Язык для редактирования контента:</strong>
        <span class="admin-lang-hint">Выберите язык, чтобы редактировать или дополнять переводы. Если поле не заполнено, сайт покажет текст на русском.</span>
      </div>
      <div class="admin-lang-tabs">
        <a href="/admin?lang=ru" class="admin-lang-tab ${lang === 'ru' ? 'active' : ''}">🇷🇺 Русский (RU)</a>
        <a href="/admin?lang=uz" class="admin-lang-tab ${lang === 'uz' ? 'active' : ''}">🇺🇿 O'zbekcha (UZ)</a>
        <a href="/admin?lang=en" class="admin-lang-tab ${lang === 'en' ? 'active' : ''}">🇬🇧 English (EN)</a>
      </div>
    </div>

    <section id="page" class="panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">PAGE BUILDER · ${lang.toUpperCase()}</div>
          <h1>Структура страницы</h1>
          <p>Редактируйте содержание блоков на выбранном языке (сейчас: <strong>${lang.toUpperCase()}</strong>). При пустом переводе в полях подсказывается русский оригинал.</p>
        </div>
        <form method="post" action="/admin/blocks/add" class="add-form">
          <input type="hidden" name="_lang" value="${lang}">
          <select name="type">
            <option value="hero">Главный экран (Hero)</option>
            <option value="logos">Логотипы брендов (Logos)</option>
            <option value="program">Программа недели (Program)</option>
            <option value="events">Ближайшие мероприятия (Events)</option>
            <option value="speakers">Спикеры (Speakers)</option>
            <option value="projects">Специальные проекты (Projects)</option>
            <option value="activations">City Activations</option>
            <option value="map">Карта активностей (Map)</option>
            <option value="registration">Форма регистрации (Registration)</option>
            <option value="footer">Подвал сайта (Footer)</option>
            <option value="cta">CTA (Призыв к действию)</option>
            <option value="text">Текстовый блок (Text)</option>
            <option value="image">Изображение (Image)</option>
          </select>
          <button>+ Добавить блок</button>
        </form>
      </div>
      <div id="block-list" class="block-list">
        ${db.blocks.map(b => `
          <details class="block" draggable="true" data-id="${b.id}" id="block-${b.id}">
            <summary>
              <span class="drag" title="Перетащить блок">☷</span>
              <div class="block-summary-meta">
                <strong>${esc(b.title || b.type)}</strong>
                <span class="tag tag-${esc(b.type)}">${esc(b.type)}</span>
                <span class="status ${b.enabled ? 'on' : 'off'}">${b.enabled ? 'ВКЛ' : 'ВЫКЛ'}</span>
              </div>
              <div class="block-quick-actions" onclick="event.stopPropagation()">
                <form method="post" action="/admin/blocks/${b.id}/up?lang=${lang}" style="display:inline">
                  <button type="submit" class="btn-arrow" title="Поднять выше">▲</button>
                </form>
                <form method="post" action="/admin/blocks/${b.id}/down?lang=${lang}" style="display:inline">
                  <button type="submit" class="btn-arrow" title="Опустить ниже">▼</button>
                </form>
              </div>
            </summary>
            <div class="block-body">
              <form method="post" action="/admin/blocks/${b.id}/save" class="editor">
                <input type="hidden" name="_lang" value="${lang}">
                <div class="block-meta-row">
                  <label class="block-title-label">
                    <span>Название блока в админ-панели</span>
                    <input name="title" value="${esc(b.title)}" placeholder="Название блока">
                  </label>
                  <label class="switch block-switch">
                    <input type="checkbox" name="enabled" value="1" ${b.enabled ? 'checked' : ''}>
                    <span>Показывать на сайте</span>
                  </label>
                </div>
                ${blockFieldsHtml(b, lang)}
                <details class="advanced-raw">
                  <summary>Продвинутый режим (Raw JSON)</summary>
                  <textarea name="raw_json" rows="6">${esc(JSON.stringify(b.data, null, 2))}</textarea>
                  <small>Отредактируйте JSON только если хотите вручную изменить специфическую структуру данных.</small>
                </details>
                <div class="editor-buttons">
                  <button type="submit" class="button">💾 Сохранить изменения блока (${lang.toUpperCase()})</button>
                  <button formaction="/admin/blocks/${b.id}/delete?lang=${lang}" formmethod="post" class="danger" onclick="return confirm('Удалить этот блок?')">🗑 Удалить блок</button>
                </div>
              </form>
            </div>
          </details>
        `).join('')}
      </div>
    </section>

    <section id="settings" class="panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">GLOBAL STYLE · ${lang.toUpperCase()}</div>
          <h2>Настройки сайта</h2>
        </div>
      </div>
      <form method="post" action="/admin/settings" class="grid-form">
        <input type="hidden" name="_lang" value="${lang}">
        <label class="wide">Логотип в левом верхнем углу
          ${fieldHtml('siteLogo', 'Файл логотипа', db.settings.siteLogo || '', '', 'ru')}
        </label>
        <label>Alt логотипа<input name="siteLogoAlt" value="${esc(db.settings.siteLogoAlt || db.settings.siteTitle)}"></label>
        <label>Ширина логотипа, px<input type="number" name="siteLogoWidth" min="70" max="280" value="${Number(db.settings.siteLogoWidth) || 150}"></label>
        <label>Название сайта (${lang.toUpperCase()})<input name="siteTitle" value="${esc(t(db.settings, 'siteTitle', lang))}" placeholder="RU: ${esc(db.settings.siteTitle || '')}"></label>
        <label>Даты проведения (${lang.toUpperCase()})<input name="siteDates" value="${esc(t(db.settings, 'siteDates', lang))}" placeholder="RU: ${esc(db.settings.siteDates || '')}"></label>
        <label>Основной цвет
          <div style="display:flex;gap:6px">
            <input type="color" value="${esc(db.settings.primary || '#111111')}" oninput="this.nextElementSibling.value=this.value" style="width:42px;height:38px;padding:2px;cursor:pointer">
            <input name="primary" value="${esc(db.settings.primary)}">
          </div>
        </label>
        <label>Акцент
          <div style="display:flex;gap:6px">
            <input type="color" value="${esc(db.settings.accent || '#f2f0ea')}" oninput="this.nextElementSibling.value=this.value" style="width:42px;height:38px;padding:2px;cursor:pointer">
            <input name="accent" value="${esc(db.settings.accent)}">
          </div>
        </label>
        <label>Фон сайта
          <div style="display:flex;gap:6px">
            <input type="color" value="${esc(db.settings.background || '#f7f6f2')}" oninput="this.nextElementSibling.value=this.value" style="width:42px;height:38px;padding:2px;cursor:pointer">
            <input name="background" value="${esc(db.settings.background)}">
          </div>
        </label>
        <label>Цвет текста
          <div style="display:flex;gap:6px">
            <input type="color" value="${esc(db.settings.text || '#111111')}" oninput="this.nextElementSibling.value=this.value" style="width:42px;height:38px;padding:2px;cursor:pointer">
            <input name="text" value="${esc(db.settings.text)}">
          </div>
        </label>
        <label>Основной шрифт
          <select name="font">
            ${['Inter, Arial, sans-serif', 'Arial, Helvetica, sans-serif', 'Helvetica, Arial, sans-serif', 'Georgia, serif', 'Times New Roman, serif', 'Courier New, monospace'].map(f => `<option ${db.settings.font === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}
          </select>
        </label>
        <label>Display шрифт заголовков
          <select name="displayFont">
            ${['Arial, Helvetica, sans-serif', 'Inter, Arial, sans-serif', 'Helvetica, Arial, sans-serif', 'Georgia, serif', 'Times New Roman, serif'].map(f => `<option ${db.settings.displayFont === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}
          </select>
        </label>
        <div><button>Сохранить настройки стиля (${lang.toUpperCase()})</button></div>
      </form>
    </section>

    <section id="nav" class="panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">NAVIGATION · ${lang.toUpperCase()}</div>
          <h2>Меню шапки (${(db.settings.nav || []).length})</h2>
          <p>Ссылки в верхнем меню сайта. Редактируйте названия пунктов для выбранного языка.</p>
        </div>
      </div>
      <div class="nav-grid">
        ${(db.settings.nav || []).map(n => `
          <form method="post" action="/admin/nav/save" class="nav-card">
            <input type="hidden" name="id" value="${n.id}">
            <input type="hidden" name="_lang" value="${lang}">
            <div class="item-top">
              <div style="display:flex;align-items:center;gap:6px">
                <b>#${n.id}</b>
                <button type="submit" formaction="/admin/nav/${n.id}/up?lang=${lang}" class="btn-arrow" title="Поднять выше">▲</button>
                <button type="submit" formaction="/admin/nav/${n.id}/down?lang=${lang}" class="btn-arrow" title="Опустить ниже">▼</button>
              </div>
              <button type="submit">Сохранить</button>
            </div>
            <label>Текст ссылки (${lang.toUpperCase()})<input name="label" value="${esc(t(n, 'label', lang))}" placeholder="RU: ${esc(n.label)}"></label>
            <label>URL / Якорь<input name="url" value="${esc(n.url)}"></label>
            <div class="item-bottom">
              <label class="switch"><input type="checkbox" name="enabled" value="1" ${n.enabled !== false ? 'checked' : ''}> Показывать</label>
              <button type="submit" formaction="/admin/nav/${n.id}/delete?lang=${lang}" formmethod="post" class="danger" onclick="return confirm('Удалить пункт меню?')">Удалить</button>
            </div>
          </form>
        `).join('')}
      </div>
      <div class="new-item">
        <h3>+ Добавить новый пункт меню</h3>
        <form method="post" action="/admin/nav/save" class="grid-form">
          <input type="hidden" name="_lang" value="ru">
          <label>Текст пункта<input name="label" placeholder="Например, О нас" required></label>
          <label>URL / Якорь<input name="url" placeholder="Например, #about или /page" required></label>
          <label class="switch"><input type="checkbox" name="enabled" value="1" checked> Показывать</label>
          <div><button>+ Добавить пункт меню</button></div>
        </form>
      </div>
    </section>

    <section id="logos" class="panel collection">
      <div class="panel-head">
        <div>
          <div class="eyebrow">BRAND ASSETS</div>
          <h2>Логотипы в верхнем блоке (${logosList.length})</h2>
          <p>Логотипы организаторов, партнёров и медиа.</p>
        </div>
      </div>
      <div class="collection-grid">
        ${logosList.map(l => `
          <form method="post" action="/admin/logos/save" class="item-card">
            <input type="hidden" name="id" value="${esc(l.id || '')}">
            <input type="hidden" name="_lang" value="${lang}">
            <div class="item-top">
              <div style="display:flex;align-items:center;gap:6px">
                <b>${esc(l.name || 'Логотип')}</b>
                <button type="submit" formaction="/admin/logos/${esc(l.id || '')}/up?lang=${lang}" class="btn-arrow" title="Поднять выше">▲</button>
                <button type="submit" formaction="/admin/logos/${esc(l.id || '')}/down?lang=${lang}" class="btn-arrow" title="Опустить ниже">▼</button>
              </div>
              <button type="submit">Сохранить</button>
            </div>
            <label>Название бренда<input name="name" value="${esc(l.name || '')}"></label>
            ${fieldHtml('image', 'Логотип', l.image || '', '', 'ru')}
            <div class="item-bottom">
              <label class="switch"><input type="checkbox" name="enabled" value="1" ${l.enabled !== false ? 'checked' : ''}> Показывать</label>
              <button type="submit" formaction="/admin/logos/${esc(l.id || '')}/delete?lang=${lang}" formmethod="post" class="danger" onclick="return confirm('Удалить логотип?')">Удалить</button>
            </div>
          </form>
        `).join('')}
      </div>
      <div class="new-item">
        <h3>+ Добавить новый логотип</h3>
        <form method="post" action="/admin/logos/save" class="grid-form">
          <input type="hidden" name="_lang" value="ru">
          <label>Название бренда<input name="name" placeholder="Например, GROHE" required></label>
          ${fieldHtml('image', 'Логотип', '', '', 'ru')}
          <label class="switch"><input type="checkbox" name="enabled" value="1" checked> Показывать</label>
          <div><button>+ Добавить логотип</button></div>
        </form>
      </div>
    </section>

    ${collectionHtml('events', 'Мероприятия', lang)}
    ${collectionHtml('speakers', 'Спикеры', lang)}
    ${collectionHtml('projects', 'Специальные проекты', lang)}
    ${collectionHtml('activations', 'City Activations', lang)}
    ${collectionHtml('locations', 'Локации карты', lang)}

    <section id="registrations" class="panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">LEADS</div>
          <h2>Регистрации (${db.registrations.length})</h2>
        </div>
        <a class="button" href="/admin/registrations.csv">Экспорт CSV ↓</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Имя</th><th>Телефон</th><th>Email</th><th>Компания</th><th>Должность</th><th>Интерес</th><th>Дата</th><th>Действие</th>
            </tr>
          </thead>
          <tbody>
            ${db.registrations.map(r => `
              <tr>
                <td>${esc(r.first_name)} ${esc(r.last_name)}</td>
                <td>${esc(r.phone)}</td>
                <td>${esc(r.email)}</td>
                <td>${esc(r.company)}</td>
                <td>${esc(r.role)}</td>
                <td>${esc(r.interest)}</td>
                <td>${esc(r.created_at)}</td>
                <td>
                  <form method="post" action="/admin/registrations/${r.id}/delete?lang=${lang}" onsubmit="return confirm('Удалить эту регистрацию?')">
                    <button class="danger" style="margin:0;padding:4px 8px;font-size:11px">Удалить</button>
                  </form>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  </main>
</div>
<script src="/admin.js"></script>
</body></html>`;
}

function success(ok, msg, lang = 'ru') {
  const loc = i18n[lang] || i18n.ru;
  return layout(
    ok ? loc.successTitle : loc.errorTitle,
    `<div class="success-page"><div class="success-card"><div class="eyebrow">TASHKENT DESIGN WEEK</div><h1>${ok ? esc(loc.successTitle) : esc(loc.errorTitle)}</h1><p>${esc(msg)}</p><a class="button" href="/?lang=${esc(lang)}">${esc(loc.backHome)}</a></div></div>`,
    '',
    lang
  );
}

async function handle(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const p = parsedUrl.pathname;
  const queryLang = parsedUrl.query?.lang;

  if (['ru', 'uz', 'en'].includes(queryLang)) {
    res.setHeader('Set-Cookie', `tdw_lang=${queryLang}; Path=/; Max-Age=31536000; SameSite=Lax`);
  }

  const lang = getLang(req, parsedUrl);

  if (req.method === 'GET' && p === '/') return send(res, 200, publicPage(lang));
  if (req.method === 'GET' && p === '/admin/login') return send(res, 200, adminLogin());

  if (req.method === 'POST' && p === '/admin/login') {
    const b = await body(req);
    if (b.username === USER && b.password === PASS) {
      const t = crypto.randomBytes(24).toString('hex');
      sessions.add(t);
      res.writeHead(302, { Location: '/admin', 'Set-Cookie': `tdw_session=${t}; HttpOnly; SameSite=Lax; Path=/` });
      return res.end();
    }
    return send(res, 401, adminLogin('Неверный логин или пароль'));
  }

  if (p.startsWith('/admin') && !isAuth(req)) return auth(req, res);
  if (req.method === 'GET' && p === '/admin') return send(res, 200, adminPage(parsedUrl.query?.message || '', lang));

  if (req.method === 'POST' && p === '/admin/logout') {
    sessions.delete(cookies(req).tdw_session);
    res.writeHead(302, { Location: '/admin/login', 'Set-Cookie': 'tdw_session=; Max-Age=0; Path=/' });
    return res.end();
  }

  if (req.method === 'POST' && p === '/register') {
    const b = await body(req);
    const loc = i18n[lang] || i18n.ru;
    if (!b.first_name || !b.phone || !b.email || b.consent !== '1') {
      return send(res, 400, success(false, loc.errorMsg, lang));
    }
    db.registrations.unshift({ id: nextId(db.registrations), ...b, lang, created_at: new Date().toISOString() });
    save();
    return send(res, 200, success(true, loc.successMsg, lang));
  }

  if (req.method === 'POST' && p === '/admin/settings') {
    const b = await body(req);
    const editLang = b._lang || 'ru';
    if (editLang === 'ru') {
      ['siteTitle', 'siteLogo', 'siteLogoAlt', 'siteLogoWidth', 'siteDates', 'primary', 'accent', 'background', 'text', 'font', 'displayFont'].forEach(k => {
        if (b[k] != null) db.settings[k] = b[k];
      });
      db.settings.siteLogoWidth = Math.max(70, Math.min(280, Number(db.settings.siteLogoWidth) || 150));
    } else {
      db.settings.translations = db.settings.translations || {};
      db.settings.translations[editLang] = db.settings.translations[editLang] || {};
      ['siteTitle', 'siteDates'].forEach(k => {
        if (b[k] != null) db.settings.translations[editLang][k] = b[k];
      });
    }
    save();
    return redirect(res, `/admin?lang=${editLang}&message=Настройки сохранены#settings`);
  }

  if (req.method === 'POST' && p === '/admin/nav/save') {
    const b = await body(req);
    const editLang = b._lang || 'ru';
    db.settings.nav = db.settings.nav || [];
    const id = Number(b.id || 0);
    if (id) {
      const item = db.settings.nav.find(x => x.id === id);
      if (item) {
        if (editLang === 'ru') {
          item.label = b.label || item.label;
          item.url = b.url || item.url;
          item.enabled = b.enabled === '1';
        } else {
          item.translations = item.translations || {};
          item.translations[editLang] = item.translations[editLang] || {};
          item.translations[editLang].label = b.label || item.translations[editLang].label;
        }
      }
    } else if (b.label) {
      const next = nextId(db.settings.nav);
      db.settings.nav.push({ id: next, label: b.label, url: b.url || '#', enabled: b.enabled === '1' });
    }
    save();
    return redirect(res, `/admin?lang=${editLang}&message=Меню шапки обновлено#nav`);
  }

  const nmMatch = p.match(/^\/admin\/nav\/(\d+)\/(delete|up|down)$/);
  if (nmMatch && req.method === 'POST') {
    const id = Number(nmMatch[1]), act = nmMatch[2];
    db.settings.nav = db.settings.nav || [];
    const idx = db.settings.nav.findIndex(x => x.id === id);
    if (idx !== -1) {
      if (act === 'delete') {
        db.settings.nav.splice(idx, 1);
      } else if (act === 'up' && idx > 0) {
        const tmp = db.settings.nav[idx]; db.settings.nav[idx] = db.settings.nav[idx - 1]; db.settings.nav[idx - 1] = tmp;
      } else if (act === 'down' && idx < db.settings.nav.length - 1) {
        const tmp = db.settings.nav[idx]; db.settings.nav[idx] = db.settings.nav[idx + 1]; db.settings.nav[idx + 1] = tmp;
      }
      save();
    }
    return redirect(res, `/admin?lang=${lang}&message=Меню шапки обновлено#nav`);
  }

  if (req.method === 'POST' && p === '/admin/blocks/add') {
    const b = await body(req);
    const type = b.type || 'text';
    const templates = {
      hero: { title: 'TASHKENT DESIGN WEEK', subtitle: 'Люди. Пространства. Идеи. Новая культура города.', dates: '24 — 28 СЕНТЯБРЯ 2025', image: '', button: 'Зарегистрироваться', buttonLink: '#registration' },
      logos: { eyebrow: 'Организаторы · Партнёры · Медиа', title: '', logos: [] },
      program: { title: 'ПРОГРАММА НЕДЕЛИ ДИЗАЙНА', html: '<p>Лекции, выставки, дискуссии, городские проекты и специальные мероприятия на ключевых площадках Ташкента.</p>', linkText: 'Смотреть полную программу →', linkUrl: '#events' },
      events: { title: 'БЛИЖАЙШИЕ МЕРОПРИЯТИЯ', linkText: 'Все мероприятия →', linkUrl: '#events' },
      speakers: { title: 'СПИКЕРЫ', linkText: 'Все спикеры →', linkUrl: '#speakers' },
      projects: { title: 'СПЕЦИАЛЬНЫЕ ПРОЕКТЫ', linkText: '', linkUrl: '#' },
      activations: { title: 'CITY ACTIVATIONS', linkText: '', linkUrl: '#' },
      map: { title: 'КАРТА АКТИВНОСТЕЙ', intro: 'Ключевые площадки, выставки, лекции и городские активации Tashkent Design Week.', image: '', yandexUrl: 'https://yandex.ru/map-widget/v1/?ll=69.2401%2C41.2995&z=12', mapHeight: 560, note: 'Карта построена на Яндекс Картах.' },
      registration: { eyebrow: 'TASHKENT DESIGN WEEK', title: 'ЗАРЕГИСТРИРУЙТЕСЬ НА TASHKENT DESIGN WEEK', description: 'Присоединяйтесь к профессиональному сообществу.', button: 'Зарегистрироваться', consentText: 'Я согласен на обработку персональных данных' },
      footer: { copyright: '© Tashkent Design Week. Все права защищены.', email: 'hello@tashkentdesignweek.uz', phone: '', instagram: '#', telegram: '#', facebook: '#', youtube: '#' },
      cta: { title: 'Присоединяйтесь к нам', description: 'Станьте участником или партнером Недели Дизайна в Ташкенте.', button: 'Подробнее', link: '#registration' },
      text: { title: 'Текстовый блок', html: '<p>Введите текст описания...</p>' },
      image: { image: '', caption: 'Подпись к изображению' }
    };
    const titleMap = {
      hero: 'Главный экран', logos: 'Логотипы', program: 'Программа недели', events: 'Ближайшие мероприятия',
      speakers: 'Спикеры', projects: 'Специальные проекты', activations: 'City Activations', map: 'Карта активностей',
      registration: 'Регистрация', footer: 'Footer', cta: 'CTA блок', text: 'Текстовый блок', image: 'Изображение'
    };
    const newId = nextId(db.blocks);
    db.blocks.push({
      id: newId,
      type,
      title: titleMap[type] || 'Новый блок',
      enabled: true,
      data: templates[type] || templates.text
    });
    save();
    return redirect(res, `/admin?lang=${lang}&message=Блок добавлен#block-${newId}`);
  }

  const bm = p.match(/^\/admin\/blocks\/(\d+)\/(save|delete|up|down)$/);
  if (bm && req.method === 'POST') {
    const id = Number(bm[1]), act = bm[2];
    const idx = db.blocks.findIndex(x => x.id === id);
    if (idx === -1) return send(res, 404, 'Not found');
    const b = db.blocks[idx];

    if (act === 'delete') {
      db.blocks.splice(idx, 1);
      save();
      return redirect(res, `/admin?lang=${lang}&message=Блок удалён#page`);
    }
    if (act === 'up') {
      if (idx > 0) {
        const tmp = db.blocks[idx]; db.blocks[idx] = db.blocks[idx - 1]; db.blocks[idx - 1] = tmp; save();
      }
      return redirect(res, `/admin?lang=${lang}&message=Блок перемещён выше#block-${id}`);
    }
    if (act === 'down') {
      if (idx < db.blocks.length - 1) {
        const tmp = db.blocks[idx]; db.blocks[idx] = db.blocks[idx + 1]; db.blocks[idx + 1] = tmp; save();
      }
      return redirect(res, `/admin?lang=${lang}&message=Блок перемещён ниже#block-${id}`);
    }
    if (act === 'save') {
      const x = await body(req);
      const editLang = x._lang || 'ru';
      b.title = x.title || b.title;
      if (editLang === 'ru') b.enabled = x.enabled === '1';
      b.data = b.data || {};

      if (editLang === 'ru') {
        if (x.raw_json && x.raw_json.trim()) {
          try {
            const parsed = JSON.parse(x.raw_json);
            Object.assign(b.data, parsed);
          } catch (e) {}
        }

        Object.keys(x).filter(k => k.startsWith('d_')).forEach(k => {
          const key = k.slice(2);
          let val = x[k];
          if (key === 'mapHeight') val = Math.max(300, Math.min(1000, Number(val) || 560));
          b.data[key] = val;
        });

        if (b.data.html) b.data.html = safeHtml(b.data.html);
      } else {
        b.data.translations = b.data.translations || {};
        b.data.translations[editLang] = b.data.translations[editLang] || {};

        Object.keys(x).filter(k => k.startsWith('d_')).forEach(k => {
          const key = k.slice(2);
          let val = x[k];
          if (key === 'mapHeight') return;
          if (key === 'image' && !val) return;
          b.data.translations[editLang][key] = val;
        });

        if (b.data.translations[editLang].html) {
          b.data.translations[editLang].html = safeHtml(b.data.translations[editLang].html);
        }
      }

      save();
      return redirect(res, `/admin?lang=${editLang}&message=Блок «${encodeURIComponent(b.title)}» сохранён (${editLang.toUpperCase()})#block-${id}`);
    }
  }

  if (req.method === 'POST' && p === '/admin/blocks/reorder') {
    const b = await body(req), ids = (b.ids || []).map(Number);
    db.blocks.sort((a, z) => ids.indexOf(a.id) - ids.indexOf(z.id));
    save();
    return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
  }

  if (req.method === 'POST' && p === '/admin/logos/save') {
    const b = await body(req);
    const editLang = b._lang || 'ru';
    const block = db.blocks.find(x => x.type === 'logos');
    if (!block) return send(res, 404, 'Logos block not found');
    block.data = block.data || {};
    block.data.logos = block.data.logos || [];
    const id = String(b.id || '');
    if (id) {
      const x = block.data.logos.find(z => String(z.id) === id);
      if (x) {
        x.name = b.name || x.name;
        x.image = b.image || x.image;
        x.enabled = b.enabled === '1';
      }
    } else {
      const next = Math.max(0, ...block.data.logos.map(z => Number(z.id) || 0)) + 1;
      block.data.logos.push({ id: next, name: b.name || 'Новый логотип', image: b.image || '', enabled: b.enabled === '1' });
    }
    save();
    return redirect(res, `/admin?lang=${editLang}&message=Логотип сохранён#logos`);
  }

  const logoAct = p.match(/^\/admin\/logos\/(\d+)\/(delete|up|down)$/);
  if (logoAct && req.method === 'POST') {
    const id = String(logoAct[1]), act = logoAct[2];
    const block = db.blocks.find(x => x.type === 'logos');
    if (block && block.data && block.data.logos) {
      const arr = block.data.logos;
      const idx = arr.findIndex(z => String(z.id) === id);
      if (idx !== -1) {
        if (act === 'delete') {
          arr.splice(idx, 1);
        } else if (act === 'up' && idx > 0) {
          const tmp = arr[idx]; arr[idx] = arr[idx - 1]; arr[idx - 1] = tmp;
        } else if (act === 'down' && idx < arr.length - 1) {
          const tmp = arr[idx]; arr[idx] = arr[idx + 1]; arr[idx + 1] = tmp;
        }
        save();
      }
    }
    return redirect(res, `/admin?lang=${lang}&message=Логотип обновлён#logos`);
  }

  const colSave = p.match(/^\/admin\/(events|speakers|projects|activations|locations)\/save$/);
  if (colSave && req.method === 'POST') {
    const type = colSave[1], b = await body(req), arr = db[type];
    const id = Number(b.id || 0);
    const editLang = b._lang || 'ru';
    const fields = Object.fromEntries(Object.keys(b).filter(k => !['id', 'enabled', '_lang'].includes(k)).map(k => [k, b[k]]));

    if (id) {
      const x = arr.find(z => z.id === id);
      if (x) {
        if (editLang === 'ru') {
          Object.assign(x, fields);
          x.enabled = b.enabled === '1';
        } else {
          x.translations = x.translations || {};
          x.translations[editLang] = x.translations[editLang] || {};
          Object.assign(x.translations[editLang], fields);
        }
      }
    } else {
      arr.push({ id: nextId(arr), ...fields, enabled: b.enabled === '1' });
    }
    save();
    return redirect(res, `/admin?lang=${editLang}&message=Сохранено (${editLang.toUpperCase()})#${type}`);
  }

  const colAct = p.match(/^\/admin\/(events|speakers|projects|activations|locations)\/(\d+)\/(delete|up|down)$/);
  if (colAct && req.method === 'POST') {
    const type = colAct[1], id = Number(colAct[2]), act = colAct[3];
    const arr = db[type];
    const idx = arr.findIndex(x => x.id === id);
    if (idx !== -1) {
      if (act === 'delete') {
        arr.splice(idx, 1);
      } else if (act === 'up' && idx > 0) {
        const tmp = arr[idx]; arr[idx] = arr[idx - 1]; arr[idx - 1] = tmp;
      } else if (act === 'down' && idx < arr.length - 1) {
        const tmp = arr[idx]; arr[idx] = arr[idx + 1]; arr[idx + 1] = tmp;
      }
      save();
    }
    return redirect(res, `/admin?lang=${lang}&message=Обновлено#${type}`);
  }

  const rm = p.match(/^\/admin\/registrations\/(\d+)\/delete$/);
  if (rm && req.method === 'POST') {
    db.registrations = db.registrations.filter(x => x.id !== Number(rm[1]));
    save();
    return redirect(res, `/admin?lang=${lang}&message=Регистрация удалена#registrations`);
  }

  if (req.method === 'GET' && p === '/admin/registrations.csv') {
    const keys = ['id', 'first_name', 'last_name', 'phone', 'email', 'company', 'role', 'interest', 'lang', 'created_at'];
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const csv = '\uFEFF' + [keys.join(','), ...db.registrations.map(r => keys.map(k => q(r[k])).join(','))].join('\n');
    return send(res, 200, csv, 'text/csv');
  }

  if (req.method === 'POST' && p === '/admin/upload') {
    const b = await body(req);
    if (!b.dataUrl || !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(b.dataUrl)) {
      return send(res, 400, JSON.stringify({ error: 'Можно загружать только PNG, JPG, WEBP или SVG' }), 'application/json');
    }
    const m = b.dataUrl.match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.+)$/);
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1] === 'svg+xml' ? 'svg' : m[1];
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const filename = crypto.randomBytes(10).toString('hex') + '.' + ext;
    const filepath = path.join(UPLOADS_DIR, filename);
    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length > 6 * 1024 * 1024) return send(res, 413, JSON.stringify({ error: 'Файл больше 6 МБ' }), 'application/json');
    fs.writeFileSync(filepath, buffer);
    return send(res, 200, JSON.stringify({ url: '/uploads/' + filename }), 'application/json');
  }

  if (req.method === 'GET' && p.startsWith('/uploads/')) {
    const rel = p.slice('/uploads/'.length).replace(/[^a-zA-Z0-9._-]/g, '');
    const file = path.join(UPLOADS_DIR, rel);
    if (!rel || !file.startsWith(UPLOADS_DIR) || !fs.existsSync(file)) return send(res, 404, 'Not found');
    const ext = path.extname(file).toLowerCase();
    const types = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
    return send(res, 200, fs.readFileSync(file), types[ext] || 'application/octet-stream');
  }

  const file = path.join(PUBLIC, p.replace(/^\//, ''));
  if (req.method === 'GET' && file.startsWith(PUBLIC) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    const ext = path.extname(file).toLowerCase();
    const types = { '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
    return send(res, 200, fs.readFileSync(file), types[ext] || 'application/octet-stream');
  }

  send(res, 404, 'Not found');
}

http.createServer((req, res) => handle(req, res).catch(e => {
  console.error(e);
  send(res, 500, 'Server error');
})).listen(PORT, () => console.log(`Tashkent Design Week: http://localhost:${PORT}`));
