// DOM Elements - Элементы DOM
const langButtons = document.querySelectorAll('.lang-btn');
const menuOpen = document.getElementById('openMenu');
const menuClose = document.getElementById('closeMenu');
const navLinks = document.getElementById('navLinks');
const mainNav = document.getElementById('mainNav');
const pricingCards = document.querySelectorAll('.pricing-card');
const serviceButtons = document.querySelectorAll('.select-service');
const areaSlider = document.getElementById('area-slider');
const areaValue = document.getElementById('area-value');
const roomsSelect = document.getElementById('rooms-select');
const bathroomsSelect = document.getElementById('bathrooms-select');
const cleaningTypeSelect = document.getElementById('cleaning-type-select');
const tabButtons = document.querySelectorAll('.tab-btn');
const contactForm = document.getElementById('contactForm');
const additionalCheckboxes = document.querySelectorAll('.service-checkbox input');


//---------- КОНФИГУРАЦИЯ ЦЕН ----------//
// Здесь можно легко изменить все цены и параметры калькулятора
const PRICING_CONFIG = {
  // Базовые цены для разных площадей помещения (в квадратных метрах)
  areaPrices: {
    30:50 ,  // до 40 м²
    40:55 ,  // до 40 м²
    50: 60, // до 60 м²
    60: 65, // до 80 м²
    70: 70, // до 100 м²
    80: 80, // от 100 до 150 м²
    90: 100, // от 150 до 200 м²
    100: 110, // от 200 до 250 м²
    110: 120, // от 250 до 300 м²
    120: 130, // от 300 до 350 м²
    130: 140, // от 350 до 400 м²
    140: 150,
    150: 160,
    200: 220,
    250: 300,
    300: 450,
    350: 500,
    400: 600,  // от 400 до 450 м²
  },
  
  // Множители для разных типов уборки
  typeMultipliers: {
    'regular': 1.0,      // Регулярная уборка - базовая цена
    'general': 1.8,      // Генеральная уборка - на 50% дороже регулярной
    'after-repair': 2.2  // После ремонта - в два раза дороже регулярной
  },
  
  // Дополнительные модификаторы цены
  roomPriceModifier: 10,    // Дополнительная стоимость за комнату
  bathroomPriceModifier: 0, // Дополнительная стоимость за санузел
  
  // Дополнительные услуги с ценами
  additionalServices: {
    'windows': 20,       // Мытье окон
    'fridge': 15,        // Уборка холодильника внутри
    'oven': 20,          // Очистка духовки
    'cabinets': 20       // Уборка шкафов внутри
  },
  
  // Начальные цены для карточек услуг (для отображения)
  startingPrices: {
    'regular': 50,
    'general': 100,
    'after-repair': 150
  }
};

// Начальное состояние калькулятора
let calculatorState = {
  cleaningType: 'regular',  // Тип уборки (regular, general, after-repair) - сразу устанавливаем регулярную уборку
  area: 100,                // Площадь помещения в м²
  rooms: '',                // Количество комнат
  bathrooms: '',            // Количество санузлов
  additionalServices: [],   // Дополнительные услуги
  initialized: false        // Флаг инициализации калькулятора
};

// Функция для обработки переключения языков
function handleLanguageSwitch() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            if (lang) {
                // Получаем текущий путь и заменяем языковой префикс
                const currentPath = window.location.pathname;
                const segments = currentPath.split('/').filter(seg => seg.length > 0);
                
                // Если первый сегмент - это язык (ru, bg, en)
                if (['ru', 'bg', 'en'].includes(segments[0])) {
                    segments[0] = lang;
                } else {
                    // Если языка нет в URL, добавляем его
                    segments.unshift(lang);
                }
                
                // Создаем новый URL
                const newUrl = '/' + segments.join('/');
                window.location.href = newUrl;
            }
        });
    });
}

// Функция, которая запускается при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Вызов функций инициализации
    setupEventListeners(); // Предположительно существующая в вашем коде функция
    setupTabs(); // Предположительно существующая в вашем коде
    initCalculator(); // Предположительно существующая в вашем коде
});

//---------- ФУНКЦИИ КАЛЬКУЛЯТОРА ----------//

// Получаем базовую цену по площади из таблицы цен
function getAreaBasePrice(area) {
  // Сортируем пороги площади для правильного сравнения
  const thresholds = Object.keys(PRICING_CONFIG.areaPrices).map(Number).sort((a, b) => a - b);
  
  // Находим подходящую цену для заданной площади
  for (let i = 0; i < thresholds.length; i++) {
    if (area <= thresholds[i]) {
      return PRICING_CONFIG.areaPrices[thresholds[i]];
    }
  }
  
  // Если площадь больше максимального порога, возвращаем цену для максимального порога
  return PRICING_CONFIG.areaPrices[thresholds[thresholds.length - 1]];
}

// Рассчитываем цену на основе выбранных параметров
function calculatePrice() {
  // Проверка наличия выбранного типа уборки
  if (!calculatorState.cleaningType) {
    return {
      basePrice: 0,
      additionalPrice: 0,
      totalPrice: 0
    };
  }
   // Получаем базовую цену по площади
   let basePrice = getAreaBasePrice(calculatorState.area);
  
   // Применяем множитель в зависимости от типа уборки
   basePrice *= PRICING_CONFIG.typeMultipliers[calculatorState.cleaningType];
   
   // Добавляем стоимость за комнаты
   if (calculatorState.rooms) {
     let roomCount = calculatorState.rooms === '5+' ? 5 : parseInt(calculatorState.rooms);
     basePrice += roomCount * PRICING_CONFIG.roomPriceModifier;
   }
   
   // Добавляем стоимость за санузлы
   if (calculatorState.bathrooms) {
     let bathroomCount = calculatorState.bathrooms === '3+' ? 3 : parseInt(calculatorState.bathrooms);
     basePrice += bathroomCount * PRICING_CONFIG.bathroomPriceModifier;
   }
   
   // Добавляем стоимость дополнительных услуг
   let additionalPrice = 0;
   calculatorState.additionalServices.forEach(service => {
     additionalPrice += service.price;
   });
   
   // Рассчитываем общую стоимость и округляем
   const totalPrice = Math.round(basePrice + additionalPrice);
   
   return {
     basePrice: Math.round(basePrice),
     additionalPrice: additionalPrice,
     totalPrice: totalPrice
   };
 }
 
 // Обновляем список дополнительных услуг на основе выбранных чекбоксов
 function updateAdditionalServices() {
   calculatorState.additionalServices = [];
   
   // Проходим по всем отмеченным чекбоксам и добавляем их в список услуг
   document.querySelectorAll('.service-checkbox input:checked').forEach(checkbox => {
     const servicePrice = PRICING_CONFIG.additionalServices[checkbox.id] || parseInt(checkbox.dataset.price);
     calculatorState.additionalServices.push({
       id: checkbox.id,
       price: servicePrice
     });
   });
 }
 
 // Выбор типа уборки и обновление интерфейса
 function selectCleaningType(type) {
   // Устанавливаем тип уборки в состоянии
   calculatorState.cleaningType = type;
   
   // Обновляем активную карточку
   pricingCards.forEach(card => {
     card.classList.toggle('active', card.dataset.type === type);
   });
   
   // Обновляем выпадающий список если он существует
   if (cleaningTypeSelect) {
     cleaningTypeSelect.value = type;
   }
   
   // Запускаем пересчет стоимости
   updateCalculation();
 }
 
 // Обновляем информацию в калькуляторе и пересчитываем цену
 function updateCalculation() {
  // Get the current page language from the HTML lang attribute or URL path
  let currentLang = 'en'; // Default to English
  
  // Check if we can determine language from URL
  const urlPath = window.location.pathname;
  if (urlPath.includes('/ru/')) {
    currentLang = 'ru';
  } else if (urlPath.includes('/bg/')) {
    currentLang = 'bg';
  } else if (urlPath.includes('/en/')) {
    currentLang = 'en';
  }
  
  // Define translations for cleaning types
  const cleaningTypeTranslations = {
    'ru': {
      'regular': 'Регулярная уборка',
      'general': 'Генеральная уборка',
      'after-repair': 'Уборка после ремонта'
    },
    'bg': {
      'regular': 'Редовно почистване',
      'general': 'Основно почистване',
      'after-repair': 'Почистване след ремонт'
    },
    'en': {
      'regular': 'Regular Cleaning',
      'general': 'Deep Cleaning',
      'after-repair': 'Post-Renovation Cleaning'
    }
  };
  
  // Define translations for additional services
  const serviceTranslations = {
    'ru': {
      'windows': 'Мытье окон',
      'fridge': 'Уборка холодильника внутри',
      'oven': 'Очистка духовки',
      'cabinets': 'Уборка шкафов внутри'
    },
    'bg': {
      'windows': 'Почистване на прозорци',
      'fridge': 'Почистване на хладилник отвътре',
      'oven': 'Почистване на фурна',
      'cabinets': 'Почистване на шкафове отвътре'
    },
    'en': {
      'windows': 'Window Cleaning',
      'fridge': 'Inside Refrigerator Cleaning',
      'oven': 'Oven Cleaning',
      'cabinets': 'Inside Cabinet Cleaning'
    }
  };
  
  // Get appropriate measurement unit by language
  const sqmText = currentLang === 'en' ? 'm²' : 'м²';
  
  // Get cleaning type text
  let cleaningTypeText = '-';
  if (calculatorState.cleaningType && cleaningTypeTranslations[currentLang]) {
    cleaningTypeText = cleaningTypeTranslations[currentLang][calculatorState.cleaningType] || '-';
  }
  
  // Calculate prices
  const priceDetails = calculatePrice();
  
  // Update result elements
  const resultType = document.getElementById('result-type');
  if (resultType) {
    resultType.textContent = cleaningTypeText;
  }
  
  const resultArea = document.getElementById('result-area');
  if (resultArea) {
    resultArea.textContent = `${calculatorState.area} ${sqmText}`;
  }
  
  const resultRooms = document.getElementById('result-rooms');
  if (resultRooms) {
    resultRooms.textContent = calculatorState.rooms || '-';
  }
  
  const resultBathrooms = document.getElementById('result-bathrooms');
  if (resultBathrooms) {
    resultBathrooms.textContent = calculatorState.bathrooms || '-';
  }
  
  // Update additional services list
  const additionalList = document.getElementById('additional-list');
  const resultAdditional = document.getElementById('result-additional');
  
  if (additionalList) {
    additionalList.innerHTML = '';
    
    if (calculatorState.additionalServices.length > 0) {
      if (resultAdditional) {
        resultAdditional.style.display = 'block';
      }
      
      calculatorState.additionalServices.forEach(service => {
        let serviceName = '';
        
        // Get service name in current language
        if (serviceTranslations[currentLang] && serviceTranslations[currentLang][service.id]) {
          serviceName = serviceTranslations[currentLang][service.id];
        } else {
          serviceName = service.id;
        }
        
        const li = document.createElement('li');
        li.textContent = `${serviceName} (+${service.price} лв)`;
        additionalList.appendChild(li);
      });
    } else {
      if (resultAdditional) {
        resultAdditional.style.display = 'none';
      }
    }
  }
  
  // Update total price
  const priceValueElement = document.getElementById('price-value');
  if (priceValueElement) {
    priceValueElement.textContent = `${priceDetails.totalPrice} лв`;
  }
}
 
 // Инициализация калькулятора с установкой всех обработчиков событий
 function initCalculator() {
   // Выбор карточки с типом услуги
   pricingCards.forEach(card => {
     // Устанавливаем начальные значения цен для карточек
     const typeKey = card.dataset.type;
     const priceElement = card.querySelector('.price-value');
     if (priceElement && PRICING_CONFIG.startingPrices[typeKey]) {
       priceElement.textContent = `${PRICING_CONFIG.startingPrices[typeKey]} лв`;
     }
     
     // Добавляем обработчик клика
     card.addEventListener('click', function() {
       const serviceType = this.dataset.type;
       selectCleaningType(serviceType);
       
       // Прокручиваем к калькулятору
       document.querySelector('.interactive-calculator')?.scrollIntoView({ behavior: 'smooth' });
     });
   });
   
   // Клик по кнопкам "Выбрать" в карточках услуг
   serviceButtons.forEach(btn => {
     btn.addEventListener('click', function(e) {
       e.preventDefault();
       const serviceType = this.dataset.type;
       selectCleaningType(serviceType);
       
       // Прокручиваем к калькулятору
       document.querySelector('.interactive-calculator')?.scrollIntoView({ behavior: 'smooth' });
     });
   });
   
   // Слайдер площади
   if (areaSlider) {
     areaSlider.addEventListener('input', function() {
       calculatorState.area = parseInt(this.value);
       if (areaValue) {
         areaValue.textContent = `${this.value} м²`;
       }
       updateCalculation();
     });
   }
   
   // Выпадающий список для типа уборки
   if (cleaningTypeSelect) {
     cleaningTypeSelect.addEventListener('change', function() {
       if (this.value) {
         calculatorState.cleaningType = this.value;
         selectCleaningType(this.value);
       }
     });
   }
   
   // Выпадающий список для количества комнат
   if (roomsSelect) {
     roomsSelect.addEventListener('change', function() {
       if (this.value) {
         calculatorState.rooms = this.value;
         updateCalculation();
       }
     });
   }
   
   // Выпадающий список для количества санузлов
   if (bathroomsSelect) {
     bathroomsSelect.addEventListener('change', function() {
       if (this.value) {
         calculatorState.bathrooms = this.value;
         updateCalculation();
       }
     });
   }
   
   // Чекбоксы с дополнительными услугами
   additionalCheckboxes.forEach(checkbox => {
     // Устанавливаем исходные цены из конфигурации
     if (PRICING_CONFIG.additionalServices[checkbox.id]) {
       checkbox.dataset.price = PRICING_CONFIG.additionalServices[checkbox.id];
       
       // Обновляем отображаемую цену рядом с чекбоксом
       const priceDisplay = checkbox.parentElement.querySelector('.additional-price');
       if (priceDisplay) {
         priceDisplay.textContent = `+${PRICING_CONFIG.additionalServices[checkbox.id]} лв`;
       }
     }
     
     // Добавляем обработчик изменения
     checkbox.addEventListener('change', function() {
       updateAdditionalServices();
       updateCalculation();
     });
   });
   
   // Отмечаем, что калькулятор инициализирован
   calculatorState.initialized = true;
   
   // Устанавливаем регулярную уборку как начальный тип по умолчанию
   selectCleaningType('regular');
   
   // Инициализируем с начальными значениями
   updateCalculation();
 }
 
 // Обработчики для табов с услугами
 function setupTabs() {
   tabButtons.forEach(btn => {
     btn.addEventListener('click', function() {
       const tabId = this.dataset.tab;
       
       // Обновляем активную кнопку таба
       tabButtons.forEach(btn => btn.classList.remove('active'));
       this.classList.add('active');
       
       // Показываем активное содержимое таба с эффектом появления
       document.querySelectorAll('.tab-pane').forEach(pane => {
         pane.classList.remove('active');
         pane.style.opacity = 0;
       });
       
       const activePane = document.getElementById(`${tabId}-tab`);
       if (activePane) {
         activePane.classList.add('active');
         
         // Анимация появления
         setTimeout(() => {
           activePane.style.opacity = 1;
         }, 50);
       }
     });
   });
 }
 
 // Общие обработчики событий
 function setupEventListeners() {
  
 
   // Мобильное меню
   if (menuOpen && navLinks && menuClose) {
     menuOpen.addEventListener('click', function() {
       navLinks.classList.add('active');
       document.body.style.overflow = 'hidden'; // Предотвращаем прокрутку при открытом меню
     });
     
     menuClose.addEventListener('click', function() {
       navLinks.classList.remove('active');
       document.body.style.overflow = ''; // Возвращаем прокрутку
     });
   }

   document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
        const faqItem = this.parentElement;
        const isOpen = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // If the clicked item wasn't open, open it
        if (!isOpen) {
            faqItem.classList.add('active');
        }
    });
});
   
   // Плавная прокрутка для навигационных ссылок
   document.querySelectorAll('a[href^="#"]').forEach(anchor => {
     anchor.addEventListener('click', function(e) {
       e.preventDefault();
       if (navLinks) {
         navLinks.classList.remove('active');
       }
       document.body.style.overflow = ''; // Возвращаем прокрутку
       
       const targetId = this.getAttribute('href');
       const targetElement = document.querySelector(targetId);
       
       if (targetElement) {
         window.scrollTo({
           top: targetElement.offsetTop - 80,
           behavior: 'smooth'
         });
       }
     });
   });
   
   // Обработка отправки формы обратной связи
   if (contactForm) {
     contactForm.addEventListener('submit', function(e) {
       e.preventDefault();
       
       // Получаем данные формы
       const name = document.getElementById('name')?.value || '';
       const phone = document.getElementById('phone')?.value || '';
       const email = document.getElementById('email')?.value || '';
       const serviceType = document.getElementById('service-type')?.value || '';
       const message = document.getElementById('message')?.value || '';
       
       // Здесь обычно отправка данных на сервер
       // Для демо просто показываем alert
       const currentLang = document.documentElement.lang || 'ru';
       
       let successMessage = 'Форма отправлена! Мы свяжемся с вами в ближайшее время.';
       if (currentLang === 'en') {
         successMessage = 'Form submitted! We will contact you shortly.';
       } else if (currentLang === 'bg') {
         successMessage = 'Формата е изпратена! Ние ще се свържем с вас скоро.';
       }
       
       alert(`${successMessage}\n${name ? 'Имя: ' + name : ''}\n${phone ? 'Телефон: ' + phone : ''}\n${email ? 'Email: ' + email : ''}\n${serviceType ? 'Услуга: ' + serviceType : ''}\n${message ? 'Сообщение: ' + message : ''}`);
       
       // Сбрасываем форму
       contactForm.reset();
     });
   }
 }
 
 // Обработка события прокрутки страницы
 window.addEventListener('scroll', function() {
   // Изменение фона навигации при прокрутке
   if (mainNav) {
     const scrollPosition = window.scrollY;
     
     if (scrollPosition > 100) {
       mainNav.classList.add('scroll-nav');
     } else {
       mainNav.classList.remove('scroll-nav');
     }
   }
   
   // Подсвечиваем активный раздел в навигации
   const sections = document.querySelectorAll('section');
   let currentSectionId = '';
   
   sections.forEach(section => {
     const sectionTop = section.offsetTop - 100;
     const sectionHeight = section.offsetHeight;
     
     if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
       currentSectionId = section.getAttribute('id');
     }
   });
   
   // Обновляем активную ссылку навигации
   document.querySelectorAll('.nav-links ul li a').forEach(link => {
     link.classList.remove('active-link');
     const href = link.getAttribute('href')?.substring(1);
     if (href === currentSectionId) {
       link.classList.add('active-link');
     }
   });
   
   // Анимация появления секций при прокрутке
   const observerOptions = {
     root: null,
     rootMargin: '0px',
     threshold: 0.1
   };
   
   const sectionObserver = new IntersectionObserver(function(entries, observer) {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         entry.target.classList.add('visible');
         observer.unobserve(entry.target);
       }
     });
   }, observerOptions);
   
   document.querySelectorAll('.section-hidden').forEach(section => {
     sectionObserver.observe(section);
   });
 });
 
 // Инициализация при загрузке документа
 document.addEventListener('DOMContentLoaded', function() {
   // Добавляем класс section-hidden ко всем секциям для анимации появления
   initFAQ();
   
   // Устанавливаем обработчики событий
   setupEventListeners();
   
   // Настраиваем табы
   setupTabs();
   
   // Инициализируем калькулятор
   initCalculator();
   
   // Добавляем класс CSS к body для эффекта появления
   document.body.classList.add('page-loaded');
 });
