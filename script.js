// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyCLpQXwrk2irPKMU7Hodc_fZaY-U3Z7IK0",
  authDomain: "envelops-14210.firebaseapp.com",
  projectId: "envelops-14210",
  storageBucket: "envelops-14210.firebasestorage.app",
  messagingSenderId: "805293064713",
  appId: "1:805293064713:web:96f10da8c93c428bca6ed8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== CONSTANTS =====
var BILL_DENOMINATIONS = [5000, 2000, 1000, 500, 200, 100, 50];
var ENVELOPE_ICONS = ['🏠', '🍔', '🍎', '🎂', '⚽️', '🚎', '💊', '🎁', '📚', '🎮', '✈️', '💰', '🛒', '👕', '🏖️', '🏦', '🎯', '✨', '👗', '💅', '💄', '🔧', '💻', '📱', '🪎', '🛍️', '📦'];
var USER_EMOJIS = ['👤', '💁‍♀️', '👨', '👦', '👧', '👶', '🧙‍♀️', '👵', '🧑', '🧔', '👱', '🧓', '👮', '🧛‍♂️', '👸', '🫅', '🕵️', '👨‍👩‍👧', '👩‍💼', '👨‍🍳', '👩‍🍳', '👨‍', '👩‍🎓', '👨‍💻', '‍💻', '🧑‍💻'];
var USER_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#6b7280', '#6366f1', '#e11d48', '#0ea5e9'];

// ===== STATE =====
var state = {
    users: [],
    currentUserId: null,
    envelopes: [],
    unusedBills: {},
    envelopeOrder: [],
    transactions: []
};

var currentEnvelopeId = null;
var distributionData = null;
var transferData = null;
var moneyActionData = null;
var envelopeTransferData = null;
var selectedEmoji = '';
var statsChart = null;
var currentTimeFilter = 'all';
var currentUserFilter = 'all';
var selectedEnvelopes = [];
var balanceChart = null;
var dailyExpenseChart = null;
var expenseStructureChart = null;
var kpiExtendedVisible = false;
var currentScreen = 'start';
var historyTimeFilter = 'all';
var historyUserFilter = 'all';
var historyOperationType = 'all';
var editingUserId = null;
var selectedUserEmoji = '👤';
var selectedUserColor = USER_COLORS[0];
var currentEnvelopeType = 'personal';
var currentEnvelopePriorityDenom = null;
var isUserPriorityEnvelope = false;
var currentEnvelopeTypeFilter = 'all'; // 'all', 'personal', 'shared'
var unsubscribeFamily = null;
var isSaving = false;


// ===== ОНБОРДИНГ: МАСТЕР ПЕРВОГО ВХОДА =====
var onboardingSteps = [
    {
        icon: '👋',
        title: 'Добро пожаловать!',
        text: 'Привет! Это приложение поможет вам управлять наличными деньгами вашей семьи. Здесь нет банковских карт и онлайн-платежей — только реальные купюры и умные конверты. Давайте быстро разберёмся, как это работает!'
    },
    {
        icon: '📁',
        title: 'Что такое конверты?',
        text: 'Конверт — это виртуальная категория для ваших целей. Создайте конверты для продуктов 🍔, транспорта 🚗 или накоплений 🎯. Когда получаете наличные, просто раскладывайте их по конвертам. Так вы всегда будете знать, сколько денег осталось на конкретную цель.'
    },
    {
        icon: '📊',
        title: 'Умное распределение',
        text: 'Вам не нужно считать в уме! Для каждого конверта укажите процент от дохода. Например, 50% на продукты. Когда вы нажмёте кнопку «Разложить», алгоритм сам посчитает точные суммы и распределит купюры по конвертам.'
    },
    {
        icon: '️',
        title: 'Тонкая настройка',
        text: 'Хотите больше контроля? Настройте <b>округление</b> (например, до 100 ₽), чтобы не возиться с мелочью. Выберите <b>приоритетный конверт</b>, который будет наполняться первым, и укажите <b>приоритетный номинал</b> купюр для конкретных целей.'
    },
    {
        icon: '👨‍👩👧',
        title: 'Семейный доступ',
        text: 'Приложение создано для совместного использования. Вы можете добавить участников вручную в разделе «Участники» или просто поделиться кодом семьи. Когда второй человек войдёт по коду, он автоматически появится в системе со своими личными конвертами.'
    },
    {
        icon: '📈',
        title: 'Полный контроль',
        text: 'Все операции сохраняются в истории. В разделе «Статистика» вы увидите наглядные графики: куда уходят деньги, как растёт баланс и сколько удалось накопить. Фильтруйте данные по периодам и пользователям. Готовы начать?'
    }
];

var currentOnboardingStep = 0;

function showOnboardingMaster() {
    const overlay = document.getElementById('onboardingMasterOverlay');
    if (!overlay) return;
    
    // Создаем точки прогресса
    const dotsContainer = document.getElementById('onboardingDots');
    dotsContainer.innerHTML = '';
    onboardingSteps.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'onboarding-dot' + (index === 0 ? ' active' : '');
        dotsContainer.appendChild(dot);
    });
    
    currentOnboardingStep = 0;
    renderOnboardingStep();
    
    overlay.style.display = 'flex';
    // Небольшая задержка для срабатывания CSS transition
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function renderOnboardingStep() {
    const step = onboardingSteps[currentOnboardingStep];
    const wrapper = document.getElementById('onboardingContentWrapper');
    
    // Анимация смены контента
    wrapper.style.animation = 'none';
    wrapper.offsetHeight; /* trigger reflow */
    wrapper.style.animation = 'fadeSlideUp 0.4s ease forwards';
    
    document.getElementById('onboardingIcon').textContent = step.icon;
    document.getElementById('onboardingTitle').textContent = step.title;
    document.getElementById('onboardingText').innerHTML = step.text;
    
    // Обновляем точки
    const dots = document.querySelectorAll('.onboarding-dot');
    dots.forEach((dot, index) => {
        if (index === currentOnboardingStep) dot.classList.add('active');
        else dot.classList.remove('active');
    });
    
    // Меняем текст кнопки на последнем шаге
    const nextBtn = document.getElementById('onboardingNextBtn');
    if (currentOnboardingStep === onboardingSteps.length - 1) {
        nextBtn.textContent = 'Начать пользоваться →';
    } else {
        nextBtn.textContent = 'Далее →';
    }
}

function nextOnboardingStep() {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
        currentOnboardingStep++;
        renderOnboardingStep();
    } else {
        finishOnboardingMaster();
    }
}

function skipOnboardingMaster() {
    finishOnboardingMaster();
}

function finishOnboardingMaster() {
    const overlay = document.getElementById('onboardingMasterOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 400);
    }
    
    // Сохраняем флаг конкретно для текущего пользователя
    const currentUser = getCurrentUser();
    if (currentUser) {
        localStorage.setItem('hasSeenOnboardingMaster_' + currentUser.id, 'true');
    }
}


// ===== ДВИЖОК ИНТЕРАКТИВНЫХ ТУРОВ =====
var tours = {
    main: [
        {
            target: '.header',
            title: '🪎 Общий баланс',
            text: 'Здесь отображается общая сумма наличных по всем конвертам. Также вы видите разбивку: ваши личные конверты, общие и нераспределенный остаток в "банке".'
        },
        {
            target: '#createEnvelopeBtn, .empty-state .btn-primary',
            title: '📁 Создание конверта',
            text: 'Нажмите эту кнопку, чтобы создать свой первый конверт. Конверт — это виртуальная категория для ваших целей: продукты, транспорт, накопления.'
        },
        {
            target: '#fabDistribution',
            title: '✨ Распределение денег',
            text: 'Нажмите эту кнопку, чтобы умный алгоритм разложил наличные по конвертам в соответствии с заданными процентами и приоритетами.'
        }
    ],
    stats: [
        {
            target: '.stats-filters',
            title: '🔍 Гибкие фильтры',
            text: 'Настраивайте отображение данных: выберите период, конкретного пользователя или тип конверта, чтобы увидеть точную картину.'
        },
        {
            target: '#kpiGrid',
            title: '📊 Ключевые показатели',
            text: 'Здесь вы видите сводку: сколько поступило, сколько потрачено, текущий баланс и количество переводов за выбранный период.'
        },
        {
            target: '.chart-section',
            title: '📈 Наглядные графики',
            text: 'Графики покажут динамику баланса, расходы по дням и структуру трат по конвертам. Используйте выпадающий список для выбора конкретного конверта.'
        }
    ],
    history: [
        {
            target: '.operation-type-filter',
            title: '🏷️ Типы операций',
            text: 'Фильтруйте историю: смотрите только пополнения, траты, переводы или технические ручные корректировки.'
        },
        {
            target: '#historyMainList',
            title: '📜 Хронология действий',
            text: 'Здесь записаны все операции. Групповые распределения сворачиваются в одну строку для удобства. Нажмите на строку, чтобы увидеть детали.'
        }
    ], 
    settings: [
        {
            target: '.settings-page-section:first-child',
            title: '‍👩‍👧 Ваша семья',
            text: 'Здесь отображается код вашей семьи. Поделитесь им с близкими, чтобы они могли присоединиться. Кнопка "Выйти из семьи" позволит выйти из текущего аккаунта.'
        },
        {
            target: '.settings-page-section:nth-child(2)',
            title: '💾 Резервное копирование',
            text: 'Вы можете скачать все данные в JSON-файл для безопасного хранения, или загрузить данные из ранее сохранённого файла. Рекомендуем делать резервные копии регулярно.'
        },
        {
            target: '.settings-page-section:nth-child(3)',
            title: '🎓 Обучение и подсказки',
            text: 'Здесь можно сбросить прогресс обучения, если вы хотите пройти туры заново. Кнопки позволяют сбросить отдельный тур или все сразу.'
        },
        {
            target: '.danger-zone',
            title: '⚠️ Опасная зона',
            text: 'Кнопка "Стереть все данные" безвозвратно удалит всю информацию о семье, конвертах и транзакциях. Используйте только в крайнем случае!'
        }
    ],
    users: [
        {
            target: '.users-list',
            title: ' Участники семьи',
            text: 'Здесь отображаются все участники вашей семьи. У каждого пользователя свои личные конверты и процент распределения. Вы можете редактировать или удалять участников (кроме создателя).'
        },
        {
            target: '#usersList + .btn-primary',
            title: '➕ Добавить участника',
            text: 'Нажмите эту кнопку, чтобы добавить нового участника вручную. Задайте имя, эмодзи и цвет. Либо поделитесь кодом семьи — тогда участник появится автоматически при входе.'
        }
    ]
};

var modalTours = {
    createEnvelope: [
        { target: '#envelopeEmojiPicker', title: '🎨 Иконка', text: 'Выберите иконку, которая ассоциируется с целью конверта. Это поможет быстро находить его в списке.' },
        { target: '#envelopeName', title: '📝 Название', text: 'Введите понятное название: "Продукты", "Транспорт", "Копилка на отпуск".' },
        { target: '.envelope-type-toggle', title: '👤 Тип конверта', text: 'Личный — конверт принадлежит только вам. Общий — виден всем участникам семьи, и каждый может указать свой процент.' },
        { target: '#envelopePercentContainer', title: '📊 Проценты', text: 'Укажите, какой процент от дохода вы хотите откладывать сюда. Сумма процентов по всем вашим конвертам не должна превышать 100%.' },
        { 
            target: '.modal-section:nth-child(2) .form-row', 
            title: '⚙️ Округление и шаг', 
            text: 'Округление определяет, как алгоритм будет распределять сумму. Шаг — это число, кратное которому будет результат (100, 500, 1000 ₽).' 
        },
        { target: '#envelopeGoal', title: '🎯 Цель накопления', text: 'Укажите желаемую сумму. Приложение будет показывать прогресс заполнения конверта относительно этой цели.' },
        { target: '#envelopePriorityDenom', title: '💵 Приоритетный номинал', text: 'Если вы хотите, чтобы в этот конверт клались купюры определённого номинала (например, только 5000 ₽), выберите его здесь.' },
        { target: '#priorityEnvelopeContainer', title: '⭐ Приоритетный конверт', text: 'Если этот конверт для вас важнее остальных, сделайте его приоритетным. При распределении он будет наполняться первым.' },
        { target: '#envelopeBills', title: '💰 Начальный состав', text: 'Если у вас уже есть наличные для этого конверта, укажите количество купюр. Если нет — оставьте нули, вы сможете добавить деньги позже.' }
    ],
    editEnvelope: [
        { target: '.action-button:nth-child(1)', title: '✏️ Редактировать купюры', text: 'Измените текущий состав купюр в конверте вручную.' },
        { target: '.action-button:nth-child(2)', title: '➕ Положить из банка', text: 'Переместите неиспользованные купюры из общего "банка" в этот конверт.' },
        { target: '.action-button:nth-child(3)', title: '➖ Взять (потратить)', text: 'Уберите купюры из конверта, если вы их потратили в реальной жизни.' },
        { target: '.action-button:nth-child(4)', title: '🔄 Переложить', text: 'Переместите купюры из этого конверта в другой.' },
        { target: '.action-button-full', title: '📜 История', text: 'Посмотрите все операции, которые когда-либо происходили с этим конвертом.' }
    ],
    distribution: [
        { target: '#distributionTotalAmount', title: '💰 Общая сумма', text: 'Введите общую сумму наличных, которую вы хотите распределить по конвертам прямо сейчас.' },
        { target: '#distributionBillsInput', title: '🏦 Состав купюр', text: 'Укажите, купюры каких номиналов и в каком количестве вы раскладываете. Сумма должна точно совпадать с общей.' },
        { target: '#distributionFooter1 .btn-primary', title: '✅ Проверить и разложить', text: 'Нажмите "Проверить сумму". Если всё верно, алгоритм автоматически распределит деньги по конвертам согласно вашим настройкам.' }
    ],
    distributionStep2: [
        { target: '#distributionResult', title: '📦 Результат распределения', text: 'Здесь показано, сколько денег попадёт в каждый конверт. Купюры разложены по номиналам согласно вашим настройкам.' },
        { target: '.bill-visual', title: ' Ручная корректировка', text: 'Нажмите на любую купюру в результате, чтобы переложить её в другой конверт. Это полезно, если алгоритм разложил не так, как вы хотели.' },
        { target: '#distributionFooter2 .btn-primary', title: '✅ Подтвердить', text: 'Если всё устраивает, нажмите "Разложить по конвертам". Деньги будут перемещены, и операция запишется в историю.' }
    ]
};



var currentModalTourId = null;
var currentModalTourStepIndex = 0;


function startModalTour(tourId) {
    currentModalTourId = tourId;
    currentModalTourStepIndex = 0;
    
    const overlay = document.getElementById('modalTourOverlay');
    if (!overlay) return;
    
    // Для тура создания конверта делаем кнопку приоритета видимой
    if (tourId === 'createEnvelope') {
        const prioContainer = document.getElementById('priorityEnvelopeContainer');
        if (prioContainer) {
            prioContainer.style.display = 'block';
        }
    }
    
    overlay.style.display = 'block';
    setTimeout(() => {
        overlay.classList.add('active');
        renderModalTourStep();
    }, 300);
}



function renderModalTourStep() {
    const tour = modalTours[currentModalTourId];
    if (!tour || currentModalTourStepIndex >= tour.length) {
        finishModalTour();
        return;
    }
    
    const step = tour[currentModalTourStepIndex];
    const targetEl = document.querySelector(step.target);
    const spotlight = document.getElementById('modalTourSpotlight');
    const tooltip = document.getElementById('modalTourTooltip');
    
    document.getElementById('modalTourTooltipTitle').textContent = step.title;
    document.getElementById('modalTourTooltipText').textContent = step.text;
    
    const nextBtn = document.getElementById('modalTourNextBtn');
    if (currentModalTourStepIndex === tour.length - 1) {
        nextBtn.textContent = 'Понятно ✓';
    } else {
        nextBtn.textContent = 'Далее →';
    }
    
    if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const isVisible = (rect.width > 0 && rect.height > 0 && 
                          getComputedStyle(targetEl).display !== 'none' &&
                          getComputedStyle(targetEl).visibility !== 'hidden');
        
        if (!isVisible) {
            nextModalTourStep();
            return;
        }
        
        // Прокручиваем элемент в видимую область (работает и для модалок)
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            const newRect = targetEl.getBoundingClientRect();
            spotlight.style.display = 'block';
            spotlight.style.width = newRect.width + 'px';
            spotlight.style.height = newRect.height + 'px';
            spotlight.style.top = newRect.top + 'px';
            spotlight.style.left = newRect.left + 'px';
            
            const tooltipWidth = 320;
            const tooltipHeight = 200;
            const gap = 15;
            
            let tooltipLeft, tooltipTop;
            const spaceBottom = window.innerHeight - newRect.bottom;
            
            if (spaceBottom >= tooltipHeight + gap) {
                tooltipLeft = newRect.left;
                tooltipTop = newRect.bottom + gap;
            } else {
                tooltipLeft = newRect.left;
                tooltipTop = newRect.top - tooltipHeight - gap;
            }
            
            const padding = 10;
            tooltipLeft = Math.max(padding, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - padding));
            tooltipTop = Math.max(padding, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding));
            
            tooltip.style.left = tooltipLeft + 'px';
            tooltip.style.top = tooltipTop + 'px';
            tooltip.style.transform = 'none';
        }, 600); // Задержка для завершения анимации скролла
    } else {
        spotlight.style.display = 'none';
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }
}



function nextModalTourStep() {
    currentModalTourStepIndex++;
    renderModalTourStep();
}

function skipModalTour() {
    finishModalTour();
}

function finishModalTour() {
    const overlay = document.getElementById('modalTourOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 400);
    }
    
    if (currentModalTourId === 'createEnvelope') {
        const prioContainer = document.getElementById('priorityEnvelopeContainer');
        if (prioContainer) {
            if (typeof updatePriorityEnvelopeToggleVisibility === 'function') {
                updatePriorityEnvelopeToggleVisibility();
            } else {
                prioContainer.style.display = 'none';
            }
        }
    }
    
    if (currentModalTourId) {
        const userId = state.currentUserId;
        localStorage.setItem('hasSeenModalTour_' + currentModalTourId + '_' + userId, 'true');
    }
    
    currentModalTourId = null;
    currentModalTourStepIndex = 0;
}



function resetModalTours() {
    if (confirm('Сбросить обучение по модалкам (создание, редактирование, распределение)?')) {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenModalTour_createEnvelope_' + userId);
        localStorage.removeItem('hasSeenModalTour_editEnvelope_' + userId);
        localStorage.removeItem('hasSeenModalTour_distribution_' + userId);
        localStorage.removeItem('hasSeenModalTour_distributionStep2_' + userId);
        alert('Обучение по модалкам сброшено!');
    }
}



var currentTourId = null;
var currentTourStepIndex = 0;

function startTour(tourId) {
    currentTourId = tourId;
    currentTourStepIndex = 0;
    
    const overlay = document.getElementById('tourOverlay');
    if (!overlay) return;
    
    overlay.style.display = 'block';
    setTimeout(() => {
        overlay.classList.add('active');
        renderTourStep();
    }, 10);
    
    // Перерисовываем при скролле и ресайзе
    window.addEventListener('resize', renderTourStep);
    window.addEventListener('scroll', renderTourStep, true);
}


function renderTourStep() {
    const tour = tours[currentTourId];
    if (!tour || currentTourStepIndex >= tour.length) {
        finishTour();
        return;
    }
    
    const step = tour[currentTourStepIndex];
    const targetEl = document.querySelector(step.target);
    const spotlight = document.getElementById('tourSpotlight');
    const tooltip = document.getElementById('tourTooltip');
    
    document.getElementById('tourTooltipTitle').textContent = step.title;
    document.getElementById('tourTooltipText').textContent = step.text;
    
    const nextBtn = document.getElementById('tourNextBtn');
    if (currentTourStepIndex === tour.length - 1) {
        nextBtn.textContent = 'Завершить ✓';
    } else {
        nextBtn.textContent = 'Далее →';
    }
    
    if (targetEl) {
        // Проверяем, виден ли элемент
        const rect = targetEl.getBoundingClientRect();
        const isVisible = (rect.width > 0 && rect.height > 0 && 
                          getComputedStyle(targetEl).display !== 'none' &&
                          getComputedStyle(targetEl).visibility !== 'hidden');
        
        if (!isVisible) {
            // Если элемент не виден, пропускаем этот шаг или показываем в центре
            console.log('Элемент не виден, пропускаем шаг:', step.target);
            nextTourStep();
            return;
        }
        
        // Прокручиваем к элементу, если он за пределами экрана
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Небольшая задержка, чтобы скролл успел завершиться
        setTimeout(() => {
            const rect = targetEl.getBoundingClientRect();
            
            // Позиционируем прожектор (через fixed)
            spotlight.style.display = 'block';
            spotlight.style.width = rect.width + 'px';
            spotlight.style.height = rect.height + 'px';
            spotlight.style.top = rect.top + 'px';
            spotlight.style.left = rect.left + 'px';
            
            // Умное позиционирование тултипа
            const tooltipWidth = 320;
            const tooltipHeight = 200;
            const gap = 20;
            
            let tooltipLeft, tooltipTop;
            
            // Проверяем, где больше места: справа или слева от элемента
            const spaceRight = window.innerWidth - rect.right;
            const spaceLeft = rect.left;
            
            if (spaceRight >= tooltipWidth + gap) {
                // Показываем справа
                tooltipLeft = rect.right + gap;
                tooltipTop = rect.top;
            } else if (spaceLeft >= tooltipWidth + gap) {
                // Показываем слева
                tooltipLeft = rect.left - tooltipWidth - gap;
                tooltipTop = rect.top;
            } else {
                // Не влезает ни справа, ни слева — показываем снизу или сверху
                const spaceBottom = window.innerHeight - rect.bottom;
                if (spaceBottom >= tooltipHeight + gap) {
                    tooltipLeft = rect.left;
                    tooltipTop = rect.bottom + gap;
                } else {
                    tooltipLeft = rect.left;
                    tooltipTop = rect.top - tooltipHeight - gap;
                }
            }
            
            // Ограничения по краям экрана (с запасом для мобильных)
            const padding = 10;
            tooltipLeft = Math.max(padding, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - padding));
            tooltipTop = Math.max(padding, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding));
            
            tooltip.style.left = tooltipLeft + 'px';
            tooltip.style.top = tooltipTop + 'px';
            tooltip.style.transform = 'none';
        }, 400); // Увеличили задержку для надежности
    } else {
        spotlight.style.display = 'none';
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }
}



function nextTourStep() {
    currentTourStepIndex++;
    renderTourStep();
}

function skipTour() {
    finishTour();
}

function finishTour() {
    const overlay = document.getElementById('tourOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.getElementById('tourSpotlight').style.display = 'block';
        }, 400);
    }
    
    if (currentTourId) {
        const userId = state.currentUserId;
        localStorage.setItem('hasSeen' + capitalizeFirstLetter(currentTourId) + 'Tour_' + userId, 'true');
    }
    
    window.removeEventListener('resize', renderTourStep);
    window.removeEventListener('scroll', renderTourStep, true);
    currentTourId = null;
    currentTourStepIndex = 0;
}




function closeTour() {
    finishTour();
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}



// ===== INITIALIZATION =====
function init() {
    console.log('🚀 Приложение запускается...');
    try {
        const savedFamilyCode = localStorage.getItem('familyCode');
        const savedUserId = localStorage.getItem('currentUserId');
        console.log('📱 Сохранённый код семьи:', savedFamilyCode || 'нет');
        console.log('👤 Сохранённый пользователь:', savedUserId || 'нет');
        if (savedUserId) state.currentUserId = savedUserId;
        if (savedFamilyCode) {
            console.log(' Подключаемся к семье...');
            listenToFamily(savedFamilyCode);
        } else {
            console.log('🏠 Показываем стартовый экран');
            switchScreen('start');
        }
    } catch (e) {
        console.error('❌ Ошибка инициализации:', e);
        localStorage.removeItem('familyCode');
        localStorage.removeItem('currentUserId');
        switchScreen('start');
    }
}


function initializeUnusedBills() {
    BILL_DENOMINATIONS.forEach(function(d) { if (state.unusedBills[d] === undefined) state.unusedBills[d] = 0; });
}

function generateId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getUserById(userId) {
    if (userId === 'shared') return { id: 'shared', name: 'Общий', emoji: '👥', color: '#f59e0b' };
    return state.users.find(function(u) { return u.id === userId; });
}

function getCurrentUser() { return getUserById(state.currentUserId); }

function getTransactionUserId(envelopeOwners) {
    if (!envelopeOwners) return state.currentUserId;
    if (envelopeOwners.indexOf('shared') !== -1) return 'shared';
    if (envelopeOwners.length > 1) return 'shared';
    return envelopeOwners[0];
}

function addTransaction(type, amount, bills, from, to, userId, comment, fromName, toName, batchId) {
    if (!state.transactions) state.transactions = [];
    state.transactions.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        date: new Date().toISOString(),
        type: type, amount: amount, bills: bills, from: from, to: to, userId: userId,
        comment: comment || '', fromName: fromName || null, toName: toName || null,
        batchId: batchId || null
    });
    if (state.transactions.length > 1000) state.transactions = state.transactions.slice(-1000);
}


// ===== FIRESTORE SYNC =====
function listenToFamily(code) {
    console.log('🔍 Начинаем слушать семью:', code);
    if (unsubscribeFamily) {
        console.log('🔄 Отписываемся от предыдущего слушателя');
        unsubscribeFamily();
    }
    const docRef = db.collection('families').doc(code);
    unsubscribeFamily = docRef.onSnapshot((doc) => {
        console.log('📥 Получены данные из Firebase:', doc.exists ? 'документ существует' : 'документ НЕ существует');
        if (doc.exists) {
            const data = doc.data();
            console.log('📊 Данные получены');
            console.log('👥 Пользователей:', data.users ? data.users.length : 0);
            console.log(' Конвертов:', data.envelopes ? data.envelopes.length : 0);
            console.log('💰 Транзакций:', data.transactions ? data.transactions.length : 0);
            if (isSaving) {
                console.log('⏳ Идёт сохранение, пропускаем обновление из Firebase');
                return;
            }
            const localUserId = state.currentUserId;
            state.users = data.users || [];
            state.envelopes = data.envelopes || [];
            state.unusedBills = data.unusedBills || {};
            state.envelopeOrder = data.envelopeOrder || state.envelopes.map(function(e) { return e.id; });
            state.transactions = data.transactions || [];
            state.currentUserId = localUserId;
            state.envelopes.forEach(function(env) {
                if (env.goal === undefined) env.goal = 0;
                if (!env.owners) env.owners = [env.owner || 'me'];
                if (!env.userPercents) env.userPercents = {};
                if (!env.type) env.type = env.owners.length > 1 || env.owners.indexOf('shared') !== -1 ? 'shared' : 'personal';
                if (!env.priorityDenom) env.priorityDenom = null;
            });
            state.users.forEach(function(u) {
                if (!u.priorityEnvelopeId) u.priorityEnvelopeId = null;
                // Если приоритетный конверт был удален, сбрасываем его
                if (u.priorityEnvelopeId && !state.envelopes.find(function(e) { return e.id === u.priorityEnvelopeId; })) {
                    u.priorityEnvelopeId = null;
                }
            });

            initializeUnusedBills();
            console.log('✅ Данные загружены в state');
            
            // НОВАЯ ЛОГИКА: показываем экран выбора пользователя
            const activeScreen = document.querySelector('.screen.active');
            const isOnStartScreen = activeScreen && ['screen-start', 'screen-create-family', 'screen-join-family', 'screen-family-created'].indexOf(activeScreen.id) !== -1;
            
            if (isOnStartScreen) {
                showSelectUserScreen();
                hideLoading();
            } else {
                console.log('🔍 Проверка обучения для пользователя:', state.currentUserId);
                if (state.currentUserId && !localStorage.getItem('hasSeenOnboardingMaster_' + state.currentUserId)) {
                    console.log('🎓 Показываем обучение для пользователя:', state.currentUserId);
                    setTimeout(showOnboardingMaster, 500);
                } else {
                    console.log('✅ Обучение уже пройдено или пользователь не выбран');
                    render();
                }
                hideLoading();
            }
        } else {
            console.error('❌ Документ семьи не найден в Firebase');
            alert('Семья не найдена или была удалена.');
            leaveFamily();
        }
    }, function(error) {
        console.error('🔥 Ошибка при слушании семьи:', error);
        console.error('Код ошибки:', error.code);
        console.error('Сообщение:', error.message);
        if (error.code === 'permission-denied') {
            alert('Ошибка доступа к базе данных. Проверьте правила Firestore в консоли Firebase.');
        } else if (error.code === 'unavailable') {
            alert('Нет подключения к интернету. Данные будут загружены при восстановлении связи.');
        }
    });
    console.log('👂 Слушатель установлен');
}


async function saveState() {
    const code = localStorage.getItem('familyCode');
    if (!code) {
        console.log('⚠️ Код семьи не найден в localStorage');
        return;
    }
    console.log('💾 Начинаем сохранение в Firebase, код семьи:', code);
    console.log('📊 Сохраняем пользователей:', state.users.length);
    console.log('📁 Сохраняем конвертов:', state.envelopes.length);
    console.log('💰 Сохраняем транзакций:', state.transactions.length);
    try {
        await db.collection('families').doc(code).set({
            users: state.users,
            envelopes: state.envelopes,
            unusedBills: state.unusedBills,
            envelopeOrder: state.envelopeOrder,
            transactions: state.transactions
        }, { merge: true });
        console.log('✅ Данные успешно сохранены в Firebase');
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        console.error('Код ошибки:', e.code);
        console.error('Сообщение:', e.message);
        alert("Ошибка сохранения: " + e.message);
    }
}

// ===== FAMILY MANAGEMENT =====
function showStartScreen() { switchScreen('start'); }

function showCreateFamilyScreen() {
    document.getElementById('familyNameInput').value = '';
    hideError('createFamilyError');
    switchScreen('create-family');
}

function showJoinFamilyScreen() {
    document.getElementById('familyCodeInput').value = '';
    hideError('joinFamilyError');
    switchScreen('join-family');
}

async function createFamily() {
    if (isSaving) return;
    const nameInput = document.getElementById('familyNameInput');
    const name = nameInput ? nameInput.value.trim().toLowerCase().replace(/[^a-z0-9а-яё]/g, '') : '';
    if (!name) { showError('createFamilyError', 'Введите название (только буквы и цифры)'); return; }
    isSaving = true;
    showLoading();
    const suffix = Math.random().toString(36).substring(2, 8);
    const code = name + '-' + suffix;
    try {
        console.log('🏠 Создаём семью с кодом:', code);
        await db.collection('families').doc(code).set({
            users: [], envelopes: [], unusedBills: {}, envelopeOrder: [], transactions: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        localStorage.setItem('familyCode', code);
        document.getElementById('familyCodeDisplay').textContent = code;
        switchScreen('family-created');
    } catch (e) {
        console.error(e);
        showError('createFamilyError', 'Ошибка создания. Попробуйте другое название.');
    } finally { 
        isSaving = false; 
        hideLoading();
    }
}


async function joinFamily() {
    if (isSaving) return;
    const codeInput = document.getElementById('familyCodeInput');
    const code = codeInput ? codeInput.value.trim().toLowerCase() : '';
    if (!code) { showError('joinFamilyError', 'Введите код семьи'); return; }
    if (code.indexOf('-') === -1 || code.length < 5) { showError('joinFamilyError', 'Неверный формат кода'); return; }
    hideError('joinFamilyError');
    isSaving = true;
    showLoading();
    try {
        console.log('🔗 Пытаемся подключиться к семье:', code);
        const docRef = db.collection('families').doc(code);
        const doc = await docRef.get();
        if (doc.exists) {
            console.log('✅ Семья найдена, подключаемся');
            localStorage.setItem('familyCode', code);
            // НЕ вызываем hideLoading здесь — он вызовется после первого onSnapshot
            listenToFamily(code);
        } else {
            console.log('❌ Семья не найдена');
            showError('joinFamilyError', 'Семья не найдена. Проверьте код.');
            hideLoading();
        }
    } catch (e) {
        console.error(e);
        showError('joinFamilyError', 'Ошибка подключения. Проверьте интернет.');
        hideLoading();
    } finally { 
        isSaving = false; 
        // hideLoading() вызывается только при ошибке, при успехе — в listenToFamily
    }
}




function enterFamily() {
    if (state.users.length === 0) switchScreen('onboarding');
    else switchScreen('home');
}

function copyFamilyCode() {
    const code = document.getElementById('familyCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(function() { alert('Код скопирован!'); })
        .catch(function() { alert('Не удалось скопировать. Код: ' + code); });
}

function leaveFamily() {
    if (unsubscribeFamily) { unsubscribeFamily(); unsubscribeFamily = null; }
    localStorage.removeItem('familyCode');
    localStorage.removeItem('currentUserId');
    state = { users: [], currentUserId: null, envelopes: [], unusedBills: {}, envelopeOrder: [], transactions: [] };
    switchScreen('start');
}

// ===== ONBOARDING =====
async function completeOnboarding() {
    if (isSaving) return;
    const nameInput = document.getElementById('onboardingUserName');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) { alert('Введите имя'); return; }
    isSaving = true;
    const btn = document.querySelector('#screen-onboarding .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }
    const newUser = {
        id: generateId(),
        name: name,
        emoji: '👤',
        color: USER_COLORS[state.users.length % USER_COLORS.length],
        isCreator: state.users.length === 0
    };
    state.users.push(newUser);
    state.currentUserId = newUser.id;
    localStorage.setItem('currentUserId', newUser.id);
    isSaving = true;
    showLoading();
    try {
        await saveState();
        
        // Проверяем флаг для нового пользователя
        if (!localStorage.getItem('hasSeenOnboardingMaster_' + newUser.id)) {
            switchScreen('home');
            setTimeout(showOnboardingMaster, 500);
        } else {
            switchScreen('home');
        }
    } catch (e) {
        console.error(e);
        alert('Ошибка сохранения. Попробуйте ещё раз.');
        if (btn) { btn.disabled = false; btn.textContent = 'Создать →'; }
    } finally { 
        isSaving = false; 
        hideLoading();
    }
}



// ===== ВЫБОР ПОЛЬЗОВАТЕЛЯ =====

function showSelectUserScreen() {
    renderUserSelectList();
    switchScreen('select-user');
}

function showNewUserForm() {
    document.getElementById('onboardingUserName').value = '';
    const btn = document.querySelector('#screen-onboarding .btn-primary');
    if (btn) { btn.disabled = false; btn.textContent = 'Создать →'; }
    switchScreen('onboarding');
}

function renderUserSelectList() {
    var container = document.getElementById('userSelectList');
    if (!container) return;
    container.innerHTML = '';
    
    if (state.users.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary); font-size: 14px;">В семье пока нет участников. Создайте первого!</div>';
        return;
    }
    
    state.users.forEach(function(user) {
        var btn = document.createElement('button');
        btn.className = 'user-select-btn';
        btn.style.cssText = 'display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; background:var(--white); border:2px solid var(--gray-200); border-radius:var(--radius-sm); cursor:pointer; transition:all 0.2s; margin-bottom:10px; text-align:left;';
        btn.onmouseenter = function() { btn.style.borderColor = user.color; btn.style.background = user.color + '10'; };
        btn.onmouseleave = function() { btn.style.borderColor = 'var(--gray-200)'; btn.style.background = 'var(--white)'; };
        btn.onclick = function() { selectExistingUser(user.id); };
        btn.innerHTML = '<div style="width:40px; height:40px; border-radius:50%; background:' + user.color + '20; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">' + user.emoji + '</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="font-size:15px; font-weight:700; color:var(--text-primary);">' + escapeHtml(user.name) + '</div>' +
                '<div style="font-size:11px; color:var(--text-secondary);">' + (user.isCreator ? '👑 Создатель семьи' : 'Участник') + '</div>' +
            '</div>' +
            '<div style="font-size:18px; color:var(--text-secondary);">→</div>';
        container.appendChild(btn);
    });
}

function selectExistingUser(userId) {
    state.currentUserId = userId;
    localStorage.setItem('currentUserId', userId);
    console.log('✅ Выбран пользователь:', getUserById(userId).name);
    
    // Проверяем флаг конкретно для этого пользователя
    if (!localStorage.getItem('hasSeenOnboardingMaster_' + userId)) {
        switchScreen('home');
        setTimeout(showOnboardingMaster, 500);
    } else {
        switchScreen('home');
    }
}




// ===== SCREEN MANAGEMENT =====
function switchScreen(screenId) {
    currentScreen = screenId;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    var target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.sidebar-btn').forEach(function(b) { b.classList.remove('active'); });
    var sidebarBtn = document.querySelector('.sidebar-btn[data-screen="' + screenId + '"]');
    if (sidebarBtn) sidebarBtn.classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var tabBtn = document.querySelector('.tab-btn[data-screen="' + screenId + '"]');
    if (tabBtn) tabBtn.classList.add('active');
    var fab = document.getElementById('fabDistribution');
    if (fab) {
        if (screenId === 'home' && state.currentUserId) fab.style.display = 'flex';
        else fab.style.display = 'none';
    }
    if (screenId === 'stats') {
        renderUserFilter('userFilter', currentUserFilter, setUserFilter);
        renderEnvelopeTypeFilter();
        renderEnvelopeMultiselect();
        updateBalanceChartEnvelopeSelect();
        refreshStats();
    } else if (screenId === 'history') {
        renderUserFilter('userFilterHistory', historyUserFilter, setUserFilterHistory);
        renderHistoryMainContent();
    } else if (screenId === 'users') {
        renderUsersList();
    } else if (screenId === 'settings') {
        var code = localStorage.getItem('familyCode') || '-';
        var codeEl = document.getElementById('settingsFamilyCode');
        if (codeEl) codeEl.textContent = code;
        hideSuccess('settingsMessage');
    } else if (screenId === 'select-user') {
        renderUserSelectList();
    } else if (screenId === 'home') {
        render();
    }
    // Логика запуска интерактивного тура при первом переходе на вкладку
    const userId = state.currentUserId;
    if (screenId === 'home' && !localStorage.getItem('hasSeenMainTour_' + userId)) {
        setTimeout(() => startTour('main'), 600);
    } else if (screenId === 'stats' && !localStorage.getItem('hasSeenStatsTour_' + userId)) {
        setTimeout(() => startTour('stats'), 600);
    } else if (screenId === 'history' && !localStorage.getItem('hasSeenHistoryTour_' + userId)) {
        setTimeout(() => startTour('history'), 600);
    } else if (screenId === 'settings' && !localStorage.getItem('hasSeenSettingsTour_' + userId)) {
        setTimeout(() => startTour('settings'), 600);
    } else if (screenId === 'users' && !localStorage.getItem('hasSeenUsersTour_' + userId)) {
        setTimeout(() => startTour('users'), 600);
    }
    
    window.scrollTo(0, 0);

}

// ===== USER MANAGEMENT =====
function openAddUserModal() {
    editingUserId = null;
    selectedUserEmoji = '👤';
    selectedUserColor = USER_COLORS[state.users.length % USER_COLORS.length];
    document.getElementById('userModalTitle').textContent = '👤 Добавить участника';
    document.getElementById('userNameInput').value = '';
    hideError('userModalError');
    renderUserEmojiPicker();
    renderUserColorPicker();
    document.getElementById('userModal').classList.add('active');
}

function openEditUserModal(userId) {
    var user = getUserById(userId);
    if (!user) return;
    editingUserId = userId;
    selectedUserEmoji = user.emoji;
    selectedUserColor = user.color;
    document.getElementById('userModalTitle').textContent = '✏️ Редактировать участника';
    document.getElementById('userNameInput').value = user.name;
    hideError('userModalError');
    renderUserEmojiPicker();
    renderUserColorPicker();
    document.getElementById('userModal').classList.add('active');
}

function renderUserEmojiPicker() {
    var container = document.getElementById('userEmojiPicker');
    if (!container) return;
    container.innerHTML = '';
    USER_EMOJIS.forEach(function(emoji) {
        var btn = document.createElement('button');
        btn.className = 'emoji-option' + (emoji === selectedUserEmoji ? ' selected' : '');
        btn.textContent = emoji;
        btn.onclick = function() {
            selectedUserEmoji = emoji;
            container.querySelectorAll('.emoji-option').forEach(function(b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
        };
        container.appendChild(btn);
    });
}

function renderUserColorPicker() {
    var container = document.getElementById('userColorPicker');
    if (!container) return;
    container.innerHTML = '';
    USER_COLORS.forEach(function(color) {
        var btn = document.createElement('button');
        btn.className = 'color-option' + (color === selectedUserColor ? ' selected' : '');
        btn.style.background = color;
        btn.onclick = function() {
            selectedUserColor = color;
            container.querySelectorAll('.color-option').forEach(function(b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
        };
        container.appendChild(btn);
    });
}

async function saveUser() {
    if (isSaving) return;
    var nameInput = document.getElementById('userNameInput');
    var name = nameInput ? nameInput.value.trim() : '';
    if (!name) { showError('userModalError', 'Введите имя'); return; }
    isSaving = true;
    if (editingUserId) {
        var user = getUserById(editingUserId);
        if (user) { user.name = name; user.emoji = selectedUserEmoji; user.color = selectedUserColor; }
    } else {
        var newUser = { id: generateId(), name: name, emoji: selectedUserEmoji, color: selectedUserColor, isCreator: false };
        state.users.push(newUser);
        if (!state.currentUserId) {
            state.currentUserId = newUser.id;
            localStorage.setItem('currentUserId', newUser.id);
        }
    }
    await saveState();
    isSaving = false;
    closeModal('userModal');
    renderUsersList();
    renderSidebarUserList();
    renderMobileUserSwitcher();
    showSuccessMessage('usersMessage', editingUserId ? '✅ Участник обновлён!' : '✅ Участник добавлен!');
}

async function deleteUser(userId) {
    if (isSaving) return;
    var user = getUserById(userId);
    if (!user) return;
    if (user.isCreator) { alert('Нельзя удалить создателя семьи'); return; }
    if (!confirm('Удалить участника "' + user.name + '"?\n\nВсе его личные конверты и связанные транзакции будут удалены безвозвратно.')) return;
    isSaving = true;
    state.envelopes = state.envelopes.filter(function(e) {
        if (e.owners && e.owners.length === 1 && e.owners[0] === userId) return false;
        if (e.owners) e.owners = e.owners.filter(function(o) { return o !== userId; });
        return true;
    });
    state.envelopeOrder = state.envelopeOrder.filter(function(id) { return state.envelopes.some(function(e) { return e.id === id; }); });
    state.transactions = state.transactions.filter(function(t) { return t.userId !== userId; });
    state.users = state.users.filter(function(u) { return u.id !== userId; });
    if (state.currentUserId === userId) {
        state.currentUserId = state.users.length > 0 ? state.users[0].id : null;
        if (state.currentUserId) localStorage.setItem('currentUserId', state.currentUserId);
        else localStorage.removeItem('currentUserId');
    }
    await saveState();
    isSaving = false;
    renderUsersList();
    renderSidebarUserList();
    renderMobileUserSwitcher();
    showSuccessMessage('usersMessage', '️ Участник удалён');
}

function renderUsersList() {
    var container = document.getElementById('usersList');
    if (!container) return;
    container.innerHTML = '';
    if (state.users.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: var(--text-secondary);">Нет участников</div>';
        return;
    }
    state.users.forEach(function(user) {
        var envelopeCount = state.envelopes.filter(function(e) { return e.owners && e.owners.length === 1 && e.owners[0] === user.id; }).length;
        var card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = '<div class="user-card-avatar" style="background: ' + user.color + '20; color: ' + user.color + ';">' + user.emoji + '</div>' +
            '<div class="user-card-info">' +
                '<div class="user-card-name">' + escapeHtml(user.name) + (user.isCreator ? '<span class="user-card-badge">Создатель</span>' : '') + '</div>' +
                '<div class="user-card-stats">' + envelopeCount + ' личных конверт(ов)</div>' +
            '</div>' +
            '<div class="user-card-actions">' +
                '<button class="user-card-btn" onclick="openEditUserModal(\'' + user.id + '\')" title="Редактировать">✏️</button>' +
                '<button class="user-card-btn danger" onclick="deleteUser(\'' + user.id + '\')" title="Удалить" ' + (user.isCreator ? 'disabled' : '') + '>🗑️</button>' +
            '</div>';
        container.appendChild(card);
    });
}

function renderSidebarUserList() {
    var container = document.getElementById('sidebarUserList');
    if (!container) return;
    container.innerHTML = '';
    state.users.forEach(function(user) {
        var btn = document.createElement('button');
        btn.className = 'sidebar-user-btn' + (state.currentUserId === user.id ? ' active' : '');
        btn.style.borderLeft = '3px solid ' + user.color;
        btn.innerHTML = '<span class="sidebar-user-emoji">' + user.emoji + '</span><span class="sidebar-user-name">' + escapeHtml(user.name) + '</span>';
        btn.onclick = function() {
            state.currentUserId = user.id;
            localStorage.setItem('currentUserId', user.id);
            renderSidebarUserList();
            renderMobileUserSwitcher();
            render();
        };
        container.appendChild(btn);
    });
}

function renderMobileUserSwitcher() {
    var container = document.getElementById('mobileUserSwitcher');
    if (!container) return;
    container.innerHTML = '';
    state.users.forEach(function(user) {
        var btn = document.createElement('button');
        btn.className = 'mobile-user-btn' + (state.currentUserId === user.id ? ' active' : '');
        btn.innerHTML = '<span class="mobile-user-btn-emoji">' + user.emoji + '</span>' + escapeHtml(user.name);
        btn.onclick = function() {
            state.currentUserId = user.id;
            localStorage.setItem('currentUserId', user.id);
            renderMobileUserSwitcher();
            render();
        };
        container.appendChild(btn);
    });
}

function renderUserFilter(containerId, activeUserId, callback) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    // Кнопка "Все"
    var allBtn = document.createElement('button');
    allBtn.className = 'user-filter-btn' + (activeUserId === 'all' ? ' active' : '');
    allBtn.setAttribute('data-user-id', 'all');
    allBtn.innerHTML = '👁️ Все';
    allBtn.onclick = function() { callback('all', allBtn); };
    container.appendChild(allBtn);
    
    // Кнопки пользователей
    state.users.forEach(function(user) {
        var btn = document.createElement('button');
        btn.className = 'user-filter-btn' + (activeUserId === user.id ? ' active' : '');
        btn.setAttribute('data-user-id', user.id);
        btn.innerHTML = '<span class="user-filter-btn-emoji">' + user.emoji + '</span>' + escapeHtml(user.name);
        btn.onclick = function() { callback(user.id, btn); };
        container.appendChild(btn);
    });
}


function renderEnvelopeTypeFilter() {
    var container = document.getElementById('envelopeTypeFilter');
    if (!container) return;
    container.innerHTML = '';
    
    var types = [
        { id: 'all', label: '️ Все' },
        { id: 'personal', label: ' Личные' },
        { id: 'shared', label: ' Общие' }
    ];
    
    types.forEach(function(type) {
        var btn = document.createElement('button');
        btn.className = 'envelope-type-filter-btn' + (currentEnvelopeTypeFilter === type.id ? ' active' : '');
        btn.innerHTML = type.label;
        btn.onclick = function() {
            currentEnvelopeTypeFilter = type.id;
            renderEnvelopeTypeFilter();
            
            // Сбрасываем выбранные конверты, если они не соответствуют новым фильтрам
            var validEnvelopes = getEnvelopesByFilters().map(function(e) { return e.id; });
            selectedEnvelopes = selectedEnvelopes.filter(function(id) { return validEnvelopes.indexOf(id) !== -1; });
            
            renderEnvelopeMultiselect();
            updateBalanceChartEnvelopeSelect();
            refreshStats();
        };
        container.appendChild(btn);
    });
}



// ===== RENDER =====
function render() {
    renderSidebarUserList();
    renderMobileUserSwitcher();
    var currentUser = getCurrentUser();
    var currentName = currentUser ? currentUser.name : 'Я';
    var userLabel = document.getElementById('currentUserLabel');
    if (userLabel) {
        userLabel.textContent = '(Активен: ' + currentName + ')';
        userLabel.style.color = currentUser && currentUser.color ? currentUser.color : 'var(--text-secondary)';
    }
    var fab = document.getElementById('fabDistribution');
    if (fab) fab.innerHTML = '💰 Разложить (' + currentName + ')';
    var distUserName = document.getElementById('distUserName');
    if (distUserName) distUserName.textContent = currentName;
    var createBtn = document.getElementById('createEnvelopeBtn');
    if (createBtn) createBtn.style.display = 'block';
    renderTotalBalance();
    renderBalanceBreakdown();
    renderUnusedBills();
    renderEnvelopes();
}

function renderTotalBalance() {
    var t = calculateUnusedBillsTotal();
    state.envelopes.forEach(function(env) { t += calculateEnvelopeTotal(env.bills); });
    var el = document.getElementById('totalBalance');
    if (el) el.textContent = formatMoney(t);
}

function renderBalanceBreakdown() {
    var userId = state.currentUserId;
    var currentUser = getCurrentUser();
    var currentName = currentUser ? currentUser.name : 'Я';
    var u = 0, s = 0;
    state.envelopes.forEach(function(env) {
        if (!env.owners) return;
        if (env.type === 'personal' && env.owners.indexOf(userId) !== -1) u += calculateEnvelopeTotal(env.bills);
        else if (env.type === 'shared') s += calculateEnvelopeTotal(env.bills);
    });
    var userBalance = document.getElementById('userBalance');
    if (userBalance) userBalance.textContent = formatMoney(u);
    var userBalanceLabel = document.getElementById('userBalanceLabel');
    if (userBalanceLabel) userBalanceLabel.textContent = currentName + ' конверты';
    var sharedBalance = document.getElementById('sharedBalance');
    if (sharedBalance) sharedBalance.textContent = formatMoney(s);
    var bankBalance = document.getElementById('bankBalance');
    if (bankBalance) bankBalance.textContent = formatMoney(calculateUnusedBillsTotal());
}

function renderUnusedBills() {
    var t = calculateUnusedBillsTotal();
    var section = document.getElementById('unusedBillsSection');
    if (section) section.style.display = t === 0 ? 'none' : 'block';
    var unusedTotal = document.getElementById('unusedTotal');
    if (unusedTotal) unusedTotal.textContent = formatMoney(t);
    var composition = document.getElementById('unusedComposition');
    if (!composition) return;
    composition.innerHTML = '';
    BILL_DENOMINATIONS.forEach(function(d) {
        var n = state.unusedBills[d] || 0;
        if (n > 0) {
            var tag = document.createElement('span');
            tag.className = 'bill-tag';
            tag.textContent = n + '×' + d + '₽';
            composition.appendChild(tag);
        }
    });
}

function getVisibleEnvelopes() {
    return state.envelopes.filter(function(env) {
        if (!env.owners) return false;
        if (env.type === 'shared') return true;
        if (env.owners.indexOf(state.currentUserId) !== -1) return true;
        return false;
    });
}

function getVisibleOrderedEnvelopes() {
    var visible = getVisibleEnvelopes();
    var ids = new Set(visible.map(function(e) { return e.id; }));
    return state.envelopeOrder.filter(function(id) { return ids.has(id); }).map(function(id) { return state.envelopes.find(function(e) { return e.id === id; }); }).filter(function(e) { return e; });
}

function getEnvelopeOwnerLabel(env) {
    if (!env) return 'НЕИЗВЕСТНО';
    if (env.type === 'shared') return 'ОБЩИЙ';
    if (env.owners && env.owners.length === 1) {
        var user = getUserById(env.owners[0]);
        return user ? user.name.toUpperCase() : 'НЕИЗВЕСТНО';
    }
    return 'ОБЩИЙ';
}

function getEnvelopeOwnerColor(env) {
    if (!env) return 'var(--gray-400)';
    if (env.type === 'shared') return 'var(--color-shared)';
    if (env.owners && env.owners.length === 1) {
        var user = getUserById(env.owners[0]);
        return user ? user.color : 'var(--gray-400)';
    }
    return 'var(--color-shared)';
}

function renderEnvelopes() {
    var grid = document.getElementById('envelopesGrid');
    var empty = document.getElementById('emptyState');
    var btn = document.getElementById('createEnvelopeBtn');
    if (!grid || !empty || !btn) return;
    var vis = getVisibleEnvelopes();
    if (vis.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; btn.style.display = 'none'; return; }
    empty.style.display = 'none';
    btn.style.display = 'block';
    grid.innerHTML = '';
    getVisibleOrderedEnvelopes().forEach(function(env) {
        var card = document.createElement('div');
        var ownerColor = getEnvelopeOwnerColor(env);
        card.style.cssText = 'border-left: 3px solid ' + ownerColor + ';';
        card.className = 'envelope-card';
        card.onclick = function() { openEnvelopeDetail(env.id); };
        var total = calculateEnvelopeTotal(env.bills);
        var currentUser = getCurrentUser();
        var pct = 0;
        if (currentUser && env.userPercents && env.userPercents[currentUser.id]) pct = env.userPercents[currentUser.id];
        var currentName = currentUser ? currentUser.name : 'Я';
        var pctText = pct > 0 ? pct + '% от дохода (' + currentName + ')' : '';
        var goalHtml = '';
        if (env.goal > 0) {
            var progress = Math.min((total / env.goal) * 100, 100);
            var isOver = total >= env.goal;
            goalHtml = '<div class="goal-progress"><div class="goal-label"><span>🎯 Цель</span><span>' + formatMoney(total) + ' / ' + formatMoney(env.goal) + '</span></div><div class="goal-bar"><div class="goal-bar-fill' + (isOver ? ' over' : '') + '" style="width: ' + progress + '%"></div></div></div>';
        }
        var priorityBadge = '';
        if (env.type === 'personal' && currentUser && currentUser.priorityEnvelopeId === env.id) {
            priorityBadge = '<span style="position:absolute;top:10px;right:10px;font-size:16px" title="Приоритетный конверт">⭐</span>';
        }
        var ownersHtml = '';
        if (env.type === 'shared' && env.owners) {
            var ownerNames = env.owners.map(function(oid) { var u = getUserById(oid); return u ? u.emoji + ' ' + u.name : oid; }).join(', ');
            ownersHtml = '<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">👥 ' + ownerNames + '</div>';
        }
        // ИСПРАВЛЕНО: использованы обратные кавычки ` для интерполяции ${priorityBadge}
        card.innerHTML = `${priorityBadge}<div class="envelope-card-header"><div class="envelope-icon" style="background: ` + ownerColor + `20;">` + (env.icon || '📁') + `</div><div class="envelope-name">` + escapeHtml(env.name) + `<span class="owner-badge" style="background: ` + ownerColor + `;">` + getEnvelopeOwnerLabel(env) + `</span>` + ownersHtml + `</div></div><div class="envelope-amount">` + formatMoney(total) + `</div>` + (pctText ? `<div class="envelope-percent">` + pctText + `</div>` : '') + `<div class="envelope-bills">` + renderBillsList(env.bills) + `</div>` + goalHtml;
        grid.appendChild(card);
    });
}


function renderBillsList(bills) {
    var h = '';
    BILL_DENOMINATIONS.forEach(function(d) {
        var c = bills[d] || 0;
        if (c > 0) h += '<span class="envelope-bill">' + c + '×' + d + '₽</span>';
    });
    return h || '<span style="color: var(--text-secondary); font-size: 13px;">Нет купюр</span>';
}

function renderBillCounters(cid, bills) {
    var c = document.getElementById(cid);
    if (!c) return;
    c.innerHTML = '';
    BILL_DENOMINATIONS.forEach(function(d) {
        var n = bills[d] || 0;
        var div = document.createElement('div');
        div.className = 'bill-counter';
        div.innerHTML = '<span class="bill-counter-label">💵 ' + d + ' ₽</span><div class="bill-counter-controls"><button class="bill-counter-btn" onclick="decrementBill(\'' + cid + '\', ' + d + ')">−</button><span class="bill-counter-value" id="' + cid + '-' + d + '">' + n + '</span><button class="bill-counter-btn" onclick="incrementBill(\'' + cid + '\', ' + d + ')">+</button></div>';
        c.appendChild(div);
    });
}

function incrementBill(cid, d) {
    var el = document.getElementById(cid + '-' + d);
    if (!el) return;
    el.textContent = (parseInt(el.textContent) || 0) + 1;
    updateBillTotal(cid);
}

function decrementBill(cid, d) {
    var el = document.getElementById(cid + '-' + d);
    if (!el) return;
    var n = parseInt(el.textContent) || 0;
    if (n > 0) { el.textContent = n - 1; updateBillTotal(cid); }
}

function updateBillTotal(cid) {
    if (cid === 'billEditorBills') {
        var el = document.getElementById('billEditorTotal');
        if (el) el.textContent = 'Итого: ' + formatMoney(calculateBillsTotal(getBillCounts('billEditorBills')));
    } else if (cid === 'moneyActionBills') {
        var el = document.getElementById('moneyActionTotal');
        if (el) el.textContent = 'Выбрано: ' + formatMoney(calculateBillsTotal(getBillCounts('moneyActionBills')));
    }
}

function getBillCounts(cid) {
    var b = {};
    BILL_DENOMINATIONS.forEach(function(d) {
        var el = document.getElementById(cid + '-' + d);
        b[d] = el ? (parseInt(el.textContent) || 0) : 0;
    });
    return b;
}

function renderEmojiPicker(cid, sel) {
    var c = document.getElementById(cid);
    if (!c) return;
    c.innerHTML = '';
    ENVELOPE_ICONS.forEach(function(icon) {
        var btn = document.createElement('button');
        btn.className = 'emoji-option' + (icon === sel ? ' selected' : '');
        btn.textContent = icon;
        btn.onclick = function() {
            selectedEmoji = icon;
            c.querySelectorAll('.emoji-option').forEach(function(b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
        };
        c.appendChild(btn);
    });
}

// ===== ENVELOPE TYPE TOGGLE =====
function setEnvelopeType(type) {
    currentEnvelopeType = type;
    document.querySelectorAll('.type-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
    var activeBtn = document.querySelector('.type-toggle-btn[data-type="' + type + '"]');
    if (activeBtn) activeBtn.classList.add('active');
    renderEnvelopePercentFields();
}


// Подсчитывает, сколько процентов пользователь уже распределил по всем конвертам
function getUserAllocatedPercent(userId, excludeEnvelopeId) {
    var total = 0;
    state.envelopes.forEach(function(env) {
        if (env.id === excludeEnvelopeId) return; // Игнорируем текущий редактируемый конверт
        if (env.userPercents && env.userPercents[userId]) {
            total += parseFloat(env.userPercents[userId]) || 0;
        }
    });
    return total;
}

// Функция валидации поля ввода в реальном времени
function validatePercent(input, userId, available) {
    var val = parseFloat(input.value) || 0;
    var hintEl = document.getElementById('hint_' + input.id);
    var errorEl = document.getElementById('error_' + input.id);

    if (val > available) {
        input.classList.add('input-error');
        hintEl.style.display = 'none';
        errorEl.style.display = 'block';
    } else {
        input.classList.remove('input-error');
        hintEl.style.display = 'block';
        errorEl.style.display = 'none';
    }
}


function renderEnvelopePercentFields() {
    var container = document.getElementById('envelopePercentContainer');
    if (!container) return;
    container.innerHTML = '';

    var userIds = [];
    if (currentEnvelopeType === 'personal') {
        if (state.currentUserId) userIds.push(state.currentUserId);
    } else {
        state.users.forEach(function(u) { userIds.push(u.id); });
    }

    userIds.forEach(function(userId) {
        var user = getUserById(userId);
        if (!user) return;
        
        var allocated = getUserAllocatedPercent(userId, currentEnvelopeId);
        var available = Math.max(0, 100 - allocated);

        var item = document.createElement('div');
        item.className = 'envelope-percent-item';
        item.innerHTML = '<div class="envelope-percent-avatar" style="background: ' + user.color + '20; color: ' + user.color + ';">' + user.emoji + '</div>' +
            '<span class="envelope-percent-name">' + escapeHtml(user.name) + '</span>' +
            '<div class="envelope-percent-input-wrapper">' +
                '<input type="number" class="form-input percent-input" id="envelopePercent_' + userId + '" min="0" max="' + available + '" value="0" placeholder="0" oninput="validatePercent(this, \'' + userId + '\', ' + available + ')">' +
                '<div class="percent-hint" id="hint_envelopePercent_' + userId + '">Свободно: ' + available + '%</div>' +
                '<div class="percent-error" id="error_envelopePercent_' + userId + '">Превышен лимит</div>' +
            '</div>';
        container.appendChild(item);
    });
}



function checkEnvelopePercents() {
    var isValid = true;
    var inputs = document.querySelectorAll('#envelopePercentContainer .percent-input');
    inputs.forEach(function(input) {
        if (input.classList.contains('input-error')) isValid = false;
    });
    return isValid;
}


function renderDetailEnvelopePercentFields(env) {
    var container = document.getElementById('detailEnvelopePercentContainer');
    if (!container) return;
    container.innerHTML = '';

    var userIds = [];
    if (env.type === 'personal') {
        if (env.owners[0]) userIds.push(env.owners[0]);
    } else {
        state.users.forEach(function(u) { userIds.push(u.id); });
    }

    userIds.forEach(function(userId) {
        var user = getUserById(userId);
        if (!user) return;
        
        var allocated = getUserAllocatedPercent(userId, env.id);
        var available = Math.max(0, 100 - allocated);
        var currentVal = env.userPercents[userId] || 0;

        var item = document.createElement('div');
        item.className = 'envelope-percent-item';
        item.innerHTML = '<div class="envelope-percent-avatar" style="background: ' + user.color + '20; color: ' + user.color + ';">' + user.emoji + '</div>' +
            '<span class="envelope-percent-name">' + escapeHtml(user.name) + '</span>' +
            '<div class="envelope-percent-input-wrapper">' +
                '<input type="number" class="form-input percent-input" id="detailPercent_' + userId + '" min="0" max="' + available + '" value="' + currentVal + '" placeholder="0" oninput="validatePercent(this, \'' + userId + '\', ' + available + ')">' +
                '<div class="percent-hint" id="hint_detailPercent_' + userId + '">Свободно: ' + available + '%</div>' +
                '<div class="percent-error" id="error_detailPercent_' + userId + '">Превышен лимит</div>' +
            '</div>';
        container.appendChild(item);
    });
}



function checkDetailEnvelopePercents() {
    var isValid = true;
    var inputs = document.querySelectorAll('#detailEnvelopePercentContainer .percent-input');
    inputs.forEach(function(input) {
        if (input.classList.contains('input-error')) isValid = false;
    });
    return isValid;
}


function renderPriorityDenomSelect(selectId, selectedVal) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Любой номинал</option>';
    BILL_DENOMINATIONS.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d + ' ₽';
        if (String(d) === String(selectedVal)) opt.selected = true;
        sel.appendChild(opt);
    });
}

function updatePriorityEnvelopeToggleVisibility() {
    const container = document.getElementById('priorityEnvelopeContainer');
    if (!container) return;
    if (currentEnvelopeType === 'personal' && state.currentUserId && !currentEnvelopeId) {
        container.style.display = 'block';
    } else if (currentEnvelopeType === 'personal' && currentEnvelopeId) {
        const env = state.envelopes.find(e => e.id === currentEnvelopeId);
        if (env && env.owners && env.owners[0] === state.currentUserId) container.style.display = 'block';
        else container.style.display = 'none';
    } else {
        container.style.display = 'none';
    }
}

function toggleUserPriorityEnvelope() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Если уже является приоритетным - снимаем
    if (isUserPriorityEnvelope) {
        isUserPriorityEnvelope = false;
    } else {
        // Если пытаемся сделать приоритетным, но уже есть другой - нельзя
        if (currentUser.priorityEnvelopeId) {
            return; 
        }
        isUserPriorityEnvelope = true;
    }
    renderPriorityEnvelopeToggle();
}


function renderPriorityEnvelopeToggle() {
    const btn = document.getElementById('priorityEnvelopeBtn');
    if (!btn) return;
    const currentUser = getCurrentUser();
    
    // Проверяем состояние: либо флаг isUserPriorityEnvelope (при создании), либо currentUser.priorityEnvelopeId (при редактировании)
    const isCurrentlyPriority = isUserPriorityEnvelope || (currentUser && currentUser.priorityEnvelopeId === currentEnvelopeId);
    
    if (isCurrentlyPriority) {
        btn.textContent = '⭐ Снять приоритет';
        btn.classList.add('active');
        btn.classList.remove('disabled');
    } else {
        btn.textContent = 'Сделать приоритетным';
        btn.classList.remove('active');
        // Блокируем, если у пользователя уже есть другой приоритетный конверт
        if (currentUser && currentUser.priorityEnvelopeId) {
            btn.classList.add('disabled');
        } else {
            btn.classList.remove('disabled');
        }
    }
}


function renderDetailPriorityEnvelopeToggle(env) {
    const container = document.getElementById('detailPriorityEnvelopeContainer');
    const btn = document.getElementById('detailPriorityEnvelopeBtn');
    if (!container || !btn) return;
    const currentUser = getCurrentUser();
    const isCurrentlyPriority = currentUser && currentUser.priorityEnvelopeId === env.id;
    if (isCurrentlyPriority) {
        btn.textContent = '⭐ Снять приоритет';
        btn.classList.add('active');
        btn.classList.remove('disabled');
    } else {
        btn.textContent = 'Сделать приоритетным';
        btn.classList.remove('active');
        if (currentUser && currentUser.priorityEnvelopeId) btn.classList.add('disabled');
        else btn.classList.remove('disabled');
    }
}

async function toggleDetailUserPriorityEnvelope() {
    const env = state.envelopes.find(e => e.id === currentEnvelopeId);
    if (!env) return;
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    if (currentUser.priorityEnvelopeId === env.id) {
        currentUser.priorityEnvelopeId = null;
    } else {
        if (currentUser.priorityEnvelopeId) return;
        currentUser.priorityEnvelopeId = env.id;
    }
    await saveState();
    renderDetailPriorityEnvelopeToggle(env);
    render();
}


// ===== ENVELOPES =====
function openCreateEnvelope() {
    if (!state.currentUserId) { alert('Сначала войдите в систему'); return; }
    currentEnvelopeId = null;
    currentEnvelopePriorityDenom = null;
    isUserPriorityEnvelope = false;
    selectedEmoji = '';
    currentEnvelopeType = 'personal';
    document.getElementById('envelopeModalTitle').textContent = '📁 Создать конверт';
    document.getElementById('envelopeName').value = '';
    document.getElementById('envelopeRoundDirection').value = 'standard';
    document.getElementById('envelopeRoundStep').value = '100';
    document.getElementById('envelopeGoal').value = '';
    hideError('envelopeError');
    hideError('percentWarning');
    renderEmojiPicker('envelopeEmojiPicker', selectedEmoji);
    document.querySelectorAll('.type-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('.type-toggle-btn[data-type="personal"]').classList.add('active');
    renderEnvelopePercentFields();
    var b = {};
    BILL_DENOMINATIONS.forEach(function(d) { b[d] = 0; });
    renderBillCounters('envelopeBills', b);
    renderPriorityDenomSelect('envelopePriorityDenom', null)
    updatePriorityEnvelopeToggleVisibility();
    renderPriorityEnvelopeToggle();
    document.getElementById('envelopeModal').classList.add('active');
    
    const userId = state.currentUserId;
    if (!localStorage.getItem('hasSeenModalTour_createEnvelope_' + userId)) {
        setTimeout(() => startModalTour('createEnvelope'), 400);
    }
}


function openEnvelopeDetail(id) {
    currentEnvelopeId = id;
    var env = state.envelopes.find(function(e) { return e.id === id; });
    if (!env) return;
    document.getElementById('detailEnvelopeTitle').textContent = (env.icon || '📁') + ' ' + env.name;
    document.getElementById('detailEnvelopeNameInput').value = env.name;
    document.getElementById('detailEnvelopeAmount').textContent = formatMoney(calculateEnvelopeTotal(env.bills));
    document.getElementById('detailEnvelopeRoundDirection').value = env.roundDirection || 'standard';
    document.getElementById('detailEnvelopeRoundStep').value = env.roundStep || 100;
    document.getElementById('detailEnvelopeGoal').value = env.goal || '';
    
    currentEnvelopePriorityDenom = env.priorityDenom || null;
    renderPriorityDenomSelect('detailPriorityDenom', currentEnvelopePriorityDenom);

    var typeLabel = document.getElementById('detailEnvelopeTypeLabel');
    if (typeLabel) typeLabel.textContent = env.type === 'shared' ? 'Общий' : 'Личный';
    
    hideError('detailEnvelopeError');
    hideError('detailPercentWarning');
    renderDetailEnvelopePercentFields(env);
    document.getElementById('detailEnvelopeBillsSummary').innerHTML = renderBillsList(env.bills);
    
    const detailPrioContainer = document.getElementById('detailPriorityEnvelopeContainer');
    if (env.type === 'personal' && env.owners && env.owners[0] === state.currentUserId) {
        detailPrioContainer.style.display = 'block';
        renderDetailPriorityEnvelopeToggle(env);
    } else {
        detailPrioContainer.style.display = 'none';
    }
    
    document.getElementById('envelopeDetailModal').classList.add('active');
    
    const userId = state.currentUserId;
    if (!localStorage.getItem('hasSeenModalTour_editEnvelope_' + userId)) {
        setTimeout(() => startModalTour('editEnvelope'), 400);
    }
}



async function saveEnvelope() {
    if (isSaving) return;
    var name = document.getElementById('envelopeName') ? document.getElementById('envelopeName').value.trim() : '';
    var rDir = document.getElementById('envelopeRoundDirection') ? document.getElementById('envelopeRoundDirection').value : 'standard';
    var rStep = document.getElementById('envelopeRoundStep') ? parseInt(document.getElementById('envelopeRoundStep').value) : 100;
    var goal = document.getElementById('envelopeGoal') ? (parseFloat(document.getElementById('envelopeGoal').value) || 0) : 0;
    var bills = getBillCounts('envelopeBills');
    var pDenom = document.getElementById('envelopePriorityDenom').value ? parseInt(document.getElementById('envelopePriorityDenom').value) : null;
    
    if (!name) { showError('envelopeError', 'Введите название'); return; }
    var owners = [];
    var percents = {};
    if (currentEnvelopeType === 'personal') {
        owners = [state.currentUserId];
        var currentUser = getCurrentUser();
        if (currentUser) {
            var input = document.getElementById('envelopePercent_' + currentUser.id);
            percents[currentUser.id] = input ? (parseFloat(input.value) || 0) : 0;
        }
    } else {
        owners = state.users.map(function(u) { return u.id; });
        state.users.forEach(function(user) {
            var input = document.getElementById('envelopePercent_' + user.id);
            percents[user.id] = input ? (parseFloat(input.value) || 0) : 0;
        });
    }
    if (!checkEnvelopePercents()) { showError('envelopeError', 'Сумма процентов превышает 100%'); return; }
    
    var data = { 
        id: currentEnvelopeId || generateId(), 
        name: name, 
        icon: selectedEmoji, 
        type: currentEnvelopeType, 
        owners: owners, 
        userPercents: percents, 
        roundDirection: rDir, 
        roundStep: rStep, 
        goal: goal, 
        bills: bills,
        priorityDenom: pDenom
    };
    
    isSaving = true;
    if (currentEnvelopeId) {
        var idx = state.envelopes.findIndex(function(e) { return e.id === currentEnvelopeId; });
        if (idx !== -1) state.envelopes[idx] = data;
    } else {
        state.envelopes.push(data);
        state.envelopeOrder.push(data.id);
        // Если при создании выбран флаг приоритетного конверта
        if (isUserPriorityEnvelope) {
            const u = getCurrentUser();
            if (u) u.priorityEnvelopeId = data.id;
        }
        
        // Создаем транзакцию, если есть начальные купюры
        var initialTotal = calculateBillsTotal(bills);
        if (initialTotal > 0) {
            var txUserId = getTransactionUserId(owners);
            addTransaction('manual_adjust', initialTotal, bills, 'bank', data.id, txUserId, 'Создание конверта', 'Банк', name, 'create_' + Date.now());
        }
    }
    await saveState();
    isSaving = false;
    closeModal('envelopeModal');
    render();
    refreshStats();
}



async function saveEnvelopeDetail() {
    if (isSaving) return;
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    var name = document.getElementById('detailEnvelopeNameInput') ? document.getElementById('detailEnvelopeNameInput').value.trim() : '';
    var rDir = document.getElementById('detailEnvelopeRoundDirection') ? document.getElementById('detailEnvelopeRoundDirection').value : 'standard';
    var rStep = document.getElementById('detailEnvelopeRoundStep') ? parseInt(document.getElementById('detailEnvelopeRoundStep').value) : 100;
    var goal = document.getElementById('detailEnvelopeGoal') ? (parseFloat(document.getElementById('detailEnvelopeGoal').value) || 0) : 0;
    var pDenom = document.getElementById('detailPriorityDenom').value ? parseInt(document.getElementById('detailPriorityDenom').value) : null;
    
    if (!name) { showError('detailEnvelopeError', 'Введите название'); return; }
    var percents = {};
    if (env.type === 'personal') {
        var userId = env.owners[0];
        var input = document.getElementById('detailPercent_' + userId);
        percents[userId] = input ? (parseFloat(input.value) || 0) : 0;
    } else {
        state.users.forEach(function(user) {
            var input = document.getElementById('detailPercent_' + user.id);
            percents[user.id] = input ? (parseFloat(input.value) || 0) : 0;
        });
    }
    if (!checkDetailEnvelopePercents()) { showError('detailEnvelopeError', 'Сумма процентов превышает 100%'); return; }
    
    isSaving = true;
    env.name = name;
    env.userPercents = percents;
    env.roundDirection = rDir;
    env.roundStep = rStep;
    env.goal = goal;
    env.priorityDenom = pDenom;
    
    await saveState();
    isSaving = false;
    closeModal('envelopeDetailModal');
    render(); // Обновляем главную страницу сразу
}



async function deleteCurrentEnvelope() {
    if (isSaving) return;
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    if (!confirm('Удалить конверт "' + env.name + '"?')) return;
    
    // ДОБАВЛЕНО: Сброс приоритета у пользователей, если удаляемый конверт был приоритетным
    state.users.forEach(function(u) { 
        if (u.priorityEnvelopeId === env.id) u.priorityEnvelopeId = null; 
    });
    
    var txUserId = getTransactionUserId(env.owners);
    addTransaction('delete', calculateEnvelopeTotal(env.bills), Object.assign({}, env.bills), currentEnvelopeId, 'bank', txUserId, 'Удаление', env.name, 'Банк');
    BILL_DENOMINATIONS.forEach(function(d) { state.unusedBills[d] = (state.unusedBills[d] || 0) + (env.bills[d] || 0); });
    state.envelopes = state.envelopes.filter(function(e) { return e.id !== currentEnvelopeId; });
    state.envelopeOrder = state.envelopeOrder.filter(function(id) { return id !== currentEnvelopeId; });
    isSaving = true;
    await saveState();
    isSaving = false;
    closeModal('envelopeDetailModal');
}


function openBillEditor() {
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    renderBillCounters('billEditorBills', env.bills);
    updateBillTotal('billEditorBills');
    hideError('billEditorError');
    document.getElementById('billEditorModal').classList.add('active');
}

async function saveBillEditor() {
    if (isSaving) return;
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    
    var oldTotal = calculateEnvelopeTotal(env.bills);
    env.bills = getBillCounts('billEditorBills');
    var newTotal = calculateEnvelopeTotal(env.bills);
    var diff = newTotal - oldTotal;
    
    if (diff !== 0) {
        var txUserId = getTransactionUserId(env.owners);
        addTransaction(
            'manual_adjust',
            Math.abs(diff),
            {},
            diff > 0 ? 'bank' : currentEnvelopeId,
            diff > 0 ? currentEnvelopeId : 'bank',
            txUserId,
            'Ручная корректировка',
            'Банк',
            env.name,
            'manual_' + Date.now()
        );
    }
    
    isSaving = true;
    await saveState();
    isSaving = false;
    closeModal('billEditorModal');
    document.getElementById('detailEnvelopeAmount').textContent = formatMoney(newTotal);
    document.getElementById('detailEnvelopeBillsSummary').innerHTML = renderBillsList(env.bills);
    render(); // Обновляем главную страницу сразу
}



function openPutMoney() {
    moneyActionData = { type: 'put' };
    document.getElementById('moneyActionTitle').textContent = '➕ Положить из банка';
    document.getElementById('moneyActionComment').value = '';
    renderBillCounters('moneyActionBills', state.unusedBills);
    updateBillTotal('moneyActionBills');
    hideError('moneyActionError');
    document.getElementById('moneyActionModal').classList.add('active');
}

function openTakeMoney() {
    moneyActionData = { type: 'take' };
    document.getElementById('moneyActionTitle').textContent = '➖ Взять (потратить)';
    document.getElementById('moneyActionComment').value = '';
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    renderBillCounters('moneyActionBills', env.bills);
    updateBillTotal('moneyActionBills');
    hideError('moneyActionError');
    document.getElementById('moneyActionModal').classList.add('active');
}

async function confirmMoneyAction() {
    if (isSaving) return;
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    var bills = getBillCounts('moneyActionBills');
    var total = calculateBillsTotal(bills);
    if (total === 0) { showError('moneyActionError', 'Выберите купюры'); return; }
    var comment = document.getElementById('moneyActionComment') ? document.getElementById('moneyActionComment').value.trim() : '';
    var txUserId = getTransactionUserId(env.owners);
    if (moneyActionData.type === 'put') {
        for (var i = 0; i < BILL_DENOMINATIONS.length; i++) {
            var d = BILL_DENOMINATIONS[i];
            if (bills[d] > (state.unusedBills[d] || 0)) { showError('moneyActionError', 'Недостаточно ' + d + '₽ в банке'); return; }
        }
        BILL_DENOMINATIONS.forEach(function(d) { state.unusedBills[d] -= bills[d]; env.bills[d] = (env.bills[d] || 0) + bills[d]; });
        addTransaction('put', total, bills, 'bank', currentEnvelopeId, txUserId, comment, 'Банк', env.name);
    } else {
        for (var j = 0; j < BILL_DENOMINATIONS.length; j++) {
            var d = BILL_DENOMINATIONS[j];
            if (bills[d] > (env.bills[d] || 0)) { showError('moneyActionError', 'Недостаточно ' + d + '₽ в конверте'); return; }
        }
        BILL_DENOMINATIONS.forEach(function(d) { env.bills[d] -= bills[d]; });
        addTransaction('take', total, bills, currentEnvelopeId, 'external', txUserId, comment, env.name, 'Потрачено');
    }
    isSaving = true;
    await saveState();
    isSaving = false;
    closeModal('moneyActionModal');
    document.getElementById('detailEnvelopeAmount').textContent = formatMoney(calculateEnvelopeTotal(env.bills));
    document.getElementById('detailEnvelopeBillsSummary').innerHTML = renderBillsList(env.bills);
    render(); // Обновляем главную страницу сразу
}


function openEnvelopeTransfer() {
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    var others = getVisibleEnvelopes().filter(function(e) { return e.id !== currentEnvelopeId; });
    if (others.length === 0) { alert('Нет других конвертов'); return; }
    envelopeTransferData = { sourceEnvId: currentEnvelopeId };
    var c = document.getElementById('envelopeTransferBills');
    if (!c) return;
    c.innerHTML = '';
    var has = false;
    BILL_DENOMINATIONS.forEach(function(d) {
        var n = env.bills[d] || 0;
        if (n > 0) {
            has = true;
            var div = document.createElement('div');
            div.style.cssText = 'display:flex; justify-content:space-between; padding:14px; background:var(--gray-50); border-radius:10px; margin-bottom:10px; cursor:pointer; border:1.5px solid var(--gray-200);';
            div.onmouseenter = function() { div.style.borderColor = 'var(--primary)'; div.style.background = 'var(--primary-light)'; };
            div.onmouseleave = function() { if (!div.classList.contains('selected')) { div.style.borderColor = 'var(--gray-200)'; div.style.background = 'var(--gray-50)'; } };
            div.onclick = function() { selectTransferBill(d, n, div); };
            div.innerHTML = '<span style="font-weight:700;">💵 ' + d + ' ₽</span><span style="color:var(--text-secondary); font-weight:600;">' + n + ' шт.</span>';
            c.appendChild(div);
        }
    });
    if (!has) {
        c.innerHTML = '<div style="color: var(--text-secondary); padding: 20px; text-align: center;">Нет купюр</div>';
        document.getElementById('envelopeTransferTarget').disabled = true;
        document.getElementById('envelopeTransferCount').disabled = true;
        return;
    }
    document.getElementById('envelopeTransferTarget').disabled = false;
    document.getElementById('envelopeTransferCount').disabled = false;
    var sel = document.getElementById('envelopeTransferTarget');
    sel.innerHTML = '<option value="">Выберите конверт</option>';
    others.forEach(function(e) {
        var opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = (e.icon || '📁') + ' ' + e.name;
        sel.appendChild(opt);
    });
    document.getElementById('envelopeTransferCount').value = '1';
    document.getElementById('envelopeTransferAvailable').textContent = '0';
    document.getElementById('envelopeTransferComment').value = '';
    hideError('envelopeTransferError');
    document.getElementById('envelopeTransferModal').classList.add('active');
}

function selectTransferBill(d, n, el) {
    document.querySelectorAll('#envelopeTransferBills > div').forEach(function(x) { x.style.borderColor = 'var(--gray-200)'; x.style.background = 'var(--gray-50)'; x.classList.remove('selected'); });
    el.style.borderColor = 'var(--primary)';
    el.style.background = 'var(--primary-light)';
    el.classList.add('selected');
    envelopeTransferData.denom = d;
    envelopeTransferData.maxCount = n;
    document.getElementById('envelopeTransferAvailable').textContent = n;
    document.getElementById('envelopeTransferCount').max = n;
    document.getElementById('envelopeTransferCount').value = '1';
}

async function confirmEnvelopeTransfer() {
    if (isSaving) return;
    if (!envelopeTransferData.denom) { showError('envelopeTransferError', 'Выберите купюры'); return; }
    var tId = document.getElementById('envelopeTransferTarget').value;
    if (!tId) { showError('envelopeTransferError', 'Выберите конверт'); return; }
    var cnt = parseInt(document.getElementById('envelopeTransferCount').value) || 0;
    if (cnt <= 0 || cnt > envelopeTransferData.maxCount) { showError('envelopeTransferError', 'Неверное количество'); return; }
    var src = state.envelopes.find(function(e) { return e.id === envelopeTransferData.sourceEnvId; });
    var tgt = state.envelopes.find(function(e) { return e.id === tId; });
    if (!src || !tgt) return;
    var comment = document.getElementById('envelopeTransferComment').value.trim();
    var amt = cnt * envelopeTransferData.denom;
    var bills = {};
    bills[envelopeTransferData.denom] = cnt;
    var txUserId = getTransactionUserId(src.owners);
    closeModal('envelopeTransferModal');
    setTimeout(async function() {
        src.bills[envelopeTransferData.denom] -= cnt;
        tgt.bills[envelopeTransferData.denom] = (tgt.bills[envelopeTransferData.denom] || 0) + cnt;
        addTransaction('transfer', amt, bills, envelopeTransferData.sourceEnvId, tId, txUserId, comment, src.name, tgt.name);
        isSaving = true;
        await saveState();
        isSaving = false;
        openEnvelopeDetail(currentEnvelopeId);
    }, 300);
}

function openDistribution() {
    if (!state.currentUserId) { alert('Выберите пользователя для распределения'); return; }
    if (getVisibleEnvelopes().length === 0) { alert('Создайте конверты'); return; }
    distributionData = null;
    document.getElementById('distributionTotalAmount').value = '';
    document.getElementById('distributionComment').value = '';
    hideError('distributionError');
    hideSuccess('distributionSumCheck');
    document.getElementById('distributionStep1').style.display = 'block';
    document.getElementById('distributionStep2').classList.add('hidden');
    document.getElementById('distributionFooter1').style.display = 'flex';
    document.getElementById('distributionFooter2').style.display = 'none';
    var b = {};
    BILL_DENOMINATIONS.forEach(function(d) { b[d] = 0; });
    renderBillCounters('distributionBillsInput', b);
    document.getElementById('distributionModal').classList.add('active');
    
    const userId = state.currentUserId;
    if (!localStorage.getItem('hasSeenModalTour_distribution_' + userId)) {
        setTimeout(() => startModalTour('distribution'), 400);
    }
}


function checkDistributionSum() {
    var amt = parseFloat(document.getElementById('distributionTotalAmount').value) || 0;
    var bills = getBillCounts('distributionBillsInput');
    var bTot = calculateBillsTotal(bills);
    if (amt !== bTot) { showError('distributionError', 'Сумма купюр (' + formatMoney(bTot) + ') ≠ ' + formatMoney(amt)); hideSuccess('distributionSumCheck'); return; }
    if (amt === 0) { showError('distributionError', 'Введите сумму'); hideSuccess('distributionSumCheck'); return; }
    hideError('distributionError');
    document.getElementById('distributionSumCheck').textContent = '✓ Сумма: ' + formatMoney(amt);
    showSuccess('distributionSumCheck');
    distributionData = runDistributionAlgorithm(amt, bills);
    renderDistributionResult();
    document.getElementById('distributionStep1').style.display = 'none';
    document.getElementById('distributionStep2').classList.remove('hidden');
    document.getElementById('distributionFooter1').style.display = 'none';
    document.getElementById('distributionFooter2').style.display = 'flex';
    
    const userId = state.currentUserId;
    if (!localStorage.getItem('hasSeenModalTour_distributionStep2_' + userId)) {
        setTimeout(() => startModalTour('distributionStep2'), 400);
    }
}



function runDistributionAlgorithm(total, avail) {
    var uid = state.currentUserId;
    var envs = getVisibleOrderedEnvelopes();
    var currentUser = getCurrentUser();

    // 1. Вычисляем цели с учетом округления
    var targets = envs.map(function(e) {
        var p = 0;
        if (e.userPercents && e.userPercents[uid]) p = e.userPercents[uid];
        var rawTarget = total * (p / 100);
        var target = rawTarget;
        var step = e.roundStep || 100;
        if (e.roundDirection === 'up') target = Math.ceil(rawTarget / step) * step;
        else if (e.roundDirection === 'down') target = Math.floor(rawTarget / step) * step;
        else target = Math.round(rawTarget / step) * step;

        return {
            id: e.id, name: e.name, icon: e.icon, type: e.type, owners: e.owners,
            target: Math.max(0, target), allocated: 0,
            priorityDenom: e.priorityDenom || null,
            isUserPriority: (currentUser && currentUser.priorityEnvelopeId === e.id),
            env: e
        };
    });

    // 2. Масштабирование, если сумма целей > total
    var tTot = targets.reduce(function(s, t) { return s + t.target; }, 0);
    if (tTot > total && tTot > 0) {
        var sc = total / tTot;
        targets.forEach(function(t) { t.target = Math.round(t.target * sc); });
        var nTot = targets.reduce(function(s, t) { return s + t.target; }, 0);
        var diff = total - nTot;
        if (diff !== 0) targets[targets.length - 1].target += diff;
    }

    var bank = {};
    for (var k in avail) bank[k] = avail[k];
    var dist = {};
    targets.forEach(function(t) { dist[t.id] = { name: t.name, icon: t.icon, type: t.type, owners: t.owners, bills: {}, amount: 0 }; });

    var addBill = function(targetObj, denom) {
        dist[targetObj.id].bills[denom] = (dist[targetObj.id].bills[denom] || 0) + 1;
        dist[targetObj.id].amount += denom;
        targetObj.allocated += denom;
        bank[denom]--;
    };

    var findBestTarget = function(denom) {
        // 1. Приоритетный номинал конверта
        var prioMatch = targets.filter(function(t) { return t.priorityDenom === denom && (t.target - t.allocated) >= denom; });
        if (prioMatch.length > 0) return prioMatch.sort(function(a,b) { return (b.target - b.allocated) - (a.target - a.allocated); })[0];
        
        // 2. Максимальный недобор >= номинала
        var maxDeficit = targets.filter(function(t) { return (t.target - t.allocated) >= denom; });
        if (maxDeficit.length > 0) return maxDeficit.sort(function(a,b) { return (b.target - b.allocated) - (a.target - a.allocated); })[0];
        
        // 3. Принудительное переполнение (максимальный недобор > 0)
        var anyDeficit = targets.filter(function(t) { return (t.target - t.allocated) > 0; });
        if (anyDeficit.length > 0) return anyDeficit.sort(function(a,b) { return (b.target - b.allocated) - (a.target - a.allocated); })[0];
        
        // 4. Абсолютный фоллбэк
        return targets.sort(function(a,b) { return (b.target - b.allocated) - (a.target - a.allocated); })[0];
    };

    // ФАЗА 1: Приоритетный конверт пользователя
    var userPrio = targets.find(function(t) { return t.isUserPriority; });
    if (userPrio && userPrio.target > 0) {
        // Сначала приоритетный номинал
        if (userPrio.priorityDenom && bank[userPrio.priorityDenom] > 0) {
            while (bank[userPrio.priorityDenom] > 0 && (userPrio.target - userPrio.allocated) >= userPrio.priorityDenom) {
                addBill(userPrio, userPrio.priorityDenom);
            }
        }
        // Затем добиваем крупнейшими доступными
        var sortedDenoms = [].concat(BILL_DENOMINATIONS).sort(function(a,b) { return b - a; });
        for (var i = 0; i < sortedDenoms.length; i++) {
            var d = sortedDenoms[i];
            while (bank[d] > 0 && (userPrio.target - userPrio.allocated) >= d) {
                addBill(userPrio, d);
            }
        }
    }

    // ФАЗА 2: Стандартное распределение остатка
    var sortedDenoms2 = [].concat(BILL_DENOMINATIONS).sort(function(a,b) { return b - a; });
    for (var j = 0; j < sortedDenoms2.length; j++) {
        var d2 = sortedDenoms2[j];
        while (bank[d2] > 0) {
            var best = findBestTarget(d2);
            if (best) addBill(best, d2);
            else break;
        }
    }

    return { 
        distribution: dist, 
        remainingBank: bank, 
        totalAmount: total, 
        totalDistributed: Object.values(dist).reduce(function(s, d) { return s + d.amount; }, 0) 
    };
}


function calculateTargetAmount(t, p, dir, step) {
    if (p === 0) return 0;
    var tgt = t * (p / 100);
    if (dir === 'up') tgt = Math.ceil(tgt / step) * step;
    else if (dir === 'down') tgt = Math.floor(tgt / step) * step;
    else tgt = Math.round(tgt / step) * step;
    return Math.max(0, tgt);
}

function allocateBills(tgt, bank) {
    var a = {};
    BILL_DENOMINATIONS.forEach(function(d) { a[d] = 0; });
    var rem = tgt;
    BILL_DENOMINATIONS.forEach(function(d) {
        if (rem <= 0) return;
        var av = bank[d] || 0;
        var mx = Math.floor(rem / d);
        var u = Math.min(av, mx);
        if (u > 0) { a[d] = u; rem -= u * d; }
    });
    return a;
}

function renderDistributionResult() {
    var c = document.getElementById('distributionResult');
    if (!c) return;
    c.innerHTML = '';
    getVisibleOrderedEnvelopes().forEach(function(env) {
        var d = distributionData.distribution[env.id];
        if (!d) return;
        var div = document.createElement('div');
        var ownerColor = getEnvelopeOwnerColor(env);
        div.style.cssText = 'background:var(--gray-50); padding:16px; border-radius:12px; margin-bottom:12px; border-left:4px solid ' + ownerColor;
        var bh = '';
        BILL_DENOMINATIONS.forEach(function(dn) {
            var n = d.bills[dn] || 0;
            if (n > 0) bh += '<div class="bill-visual" onclick="openTransferModal(\'' + env.id + '\', ' + dn + ', ' + n + ')"><div class="bill-visual-info"><span class="bill-visual-nominal">' + dn + ' ₽</span><span class="bill-visual-count">' + n + ' шт.</span></div></div>';
        });
        div.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;"><span style="font-weight:700; font-size:15px;">' + (d.icon || '') + ' ' + escapeHtml(d.name) + ' <span class="owner-badge" style="background: ' + ownerColor + ';">' + getEnvelopeOwnerLabel(env) + '</span></span><span style="font-weight:800; font-size:18px; color:var(--primary);">' + formatMoney(d.amount) + '</span></div>' + (bh || '<div style="color: var(--text-secondary); font-size: 14px;">Пусто</div>');
        c.appendChild(div);
    });
}

function openTransferModal(srcId, d, n) {
    transferData = { sourceEnvId: srcId, denom: d, count: n };
    var src = state.envelopes.find(function(e) { return e.id === srcId; });
    if (!src) return;
    document.getElementById('transferBillInfo').innerHTML = '<div class="bill-visual" style="cursor:default;"><div class="bill-visual-info"><span class="bill-visual-nominal">' + d + ' ₽</span><span class="bill-visual-count">' + n + ' шт.</span></div></div>';
    var sel = document.getElementById('transferTargetEnvelope');
    sel.innerHTML = '';
    getVisibleEnvelopes().forEach(function(e) {
        if (e.id !== srcId) {
            var opt = document.createElement('option');
            opt.value = e.id;
            opt.textContent = (e.icon || '') + ' ' + e.name;
            sel.appendChild(opt);
        }
    });
    if (sel.children.length === 0) { alert('Нет доступных конвертов'); return; }
    document.getElementById('transferAvailable').textContent = n;
    document.getElementById('transferCount').value = '1';
    document.getElementById('transferCount').max = n;
    hideError('transferError');
    document.getElementById('transferModal').classList.add('active');
}

function executeTransfer() {
    var tId = document.getElementById('transferTargetEnvelope').value;
    var cnt = parseInt(document.getElementById('transferCount').value) || 0;
    if (cnt <= 0 || cnt > transferData.count) { showError('transferError', 'Количество от 1 до ' + transferData.count); return; }
    var src = state.envelopes.find(function(e) { return e.id === transferData.sourceEnvId; });
    var tgt = state.envelopes.find(function(e) { return e.id === tId; });
    if (!src || !tgt) return;
    closeModal('transferModal');
    setTimeout(function() {
        distributionData.distribution[transferData.sourceEnvId].bills[transferData.denom] -= cnt;
        distributionData.distribution[transferData.sourceEnvId].amount -= cnt * transferData.denom;
        if (!distributionData.distribution[tId].bills[transferData.denom]) distributionData.distribution[tId].bills[transferData.denom] = 0;
        distributionData.distribution[tId].bills[transferData.denom] += cnt;
        distributionData.distribution[tId].amount += cnt * transferData.denom;
        renderDistributionResult();
    }, 300);
}

function backToDistributionStep1() {
    document.getElementById('distributionStep1').style.display = 'block';
    document.getElementById('distributionStep2').classList.add('hidden');
    document.getElementById('distributionFooter1').style.display = 'flex';
    document.getElementById('distributionFooter2').style.display = 'none';
}

async function finalizeDistribution() {
    if (isSaving) return;
    var comment = document.getElementById('distributionComment').value.trim();
    var batchId = 'batch_' + Date.now();
    Object.keys(distributionData.distribution).forEach(function(eid) {
        var env = state.envelopes.find(function(e) { return e.id === eid; });
        if (env) {
            var d = distributionData.distribution[eid];
            if (d.amount > 0) {
                BILL_DENOMINATIONS.forEach(function(dn) { env.bills[dn] = (env.bills[dn] || 0) + (d.bills[dn] || 0); });
                var txUserId = getTransactionUserId(env.owners);
                addTransaction('distribute', d.amount, d.bills, 'external', eid, txUserId, comment, 'Распределение', env.name, batchId);
            }
        }
    });
    BILL_DENOMINATIONS.forEach(function(d) { state.unusedBills[d] = distributionData.remainingBank[d] || 0; });
    closeModal('distributionModal');
    isSaving = true;
    showLoading();
    try {
        await saveState();
        render();
        refreshStats();
    } catch (e) {
        console.error("Ошибка сохранения:", e);
        alert("Данные распределены локально, но не удалось сохранить в облако. Проверьте интернет.");
    } finally {
        isSaving = false;
        hideLoading();
    }
}



// ===== STATISTICS =====
function setTimeFilter(filter, btn) {
    currentTimeFilter = filter;
    document.querySelectorAll('#timeFilter .time-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    if (filter !== 'custom') {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
    }
    refreshStats();
}

function applyCustomDateRange() {
    var dateFrom = document.getElementById('dateFrom').value;
    var dateTo = document.getElementById('dateTo').value;
    if (dateFrom && dateTo) {
        currentTimeFilter = 'custom';
        document.querySelectorAll('#timeFilter .time-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        refreshStats();
    }
}

function setUserFilter(user, btn) {
    if (currentUserFilter === user) {
        currentUserFilter = 'all';
    } else {
        currentUserFilter = user;
    }
    
    document.querySelectorAll('#userFilter .user-filter-btn').forEach(function(b) { 
        b.classList.remove('active'); 
    });
    
    var buttons = document.querySelectorAll('#userFilter .user-filter-btn');
    for (var i = 0; i < buttons.length; i++) {
        var btnUserId = buttons[i].getAttribute('data-user-id');
        if (btnUserId === currentUserFilter) {
            buttons[i].classList.add('active');
            break;
        }
    }
    
    // Сбрасываем выбранные конверты, если они не соответствуют новым фильтрам
    var validEnvelopes = getEnvelopesByFilters().map(function(e) { return e.id; });
    selectedEnvelopes = selectedEnvelopes.filter(function(id) { return validEnvelopes.indexOf(id) !== -1; });
    
    renderEnvelopeMultiselect();
    updateBalanceChartEnvelopeSelect();
    refreshStats();
}



function toggleEnvelopeMultiselect() {
    var dropdown = document.getElementById('envelopeDropdown');
    var toggle = document.querySelector('.multiselect-toggle');
    if (dropdown) dropdown.classList.toggle('open');
    if (toggle) toggle.classList.toggle('open');
}

function renderEnvelopeMultiselect() {
    var list = document.getElementById('envelopeMultiselectList');
    if (!list) return;
    list.innerHTML = '';
    
    // Получаем конверты в зависимости от фильтров
    var envelopes = getEnvelopesByFilters();
    
    envelopes.forEach(function(env) {
        var div = document.createElement('div');
        div.className = 'envelope-checkbox';
        var isChecked = selectedEnvelopes.length === 0 || selectedEnvelopes.indexOf(env.id) !== -1;
        var ownerColor = getEnvelopeOwnerColor(env);
        div.innerHTML = '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' onchange="toggleEnvelopeSelection(\'' + env.id + '\', this.checked)">' +
            '<span class="envelope-checkbox-icon">' + (env.icon || '') + '</span>' +
            '<div class="envelope-checkbox-info">' +
                '<span class="envelope-checkbox-name">' + escapeHtml(env.name) + '</span>' +
                '<span class="envelope-checkbox-owner" style="color: ' + ownerColor + ';">' + getEnvelopeOwnerLabel(env) + '</span>' +
            '</div>' +
            '<span class="envelope-checkbox-amount">' + formatMoney(calculateEnvelopeTotal(env.bills)) + '</span>';
        list.appendChild(div);
    });
    updateEnvelopeFilterLabel();
}


function toggleEnvelopeSelection(envId, checked) {
    if (checked) {
        if (selectedEnvelopes.indexOf(envId) === -1) selectedEnvelopes.push(envId);
    } else {
        selectedEnvelopes = selectedEnvelopes.filter(function(id) { return id !== envId; });
    }
    updateEnvelopeFilterLabel();
    refreshStats();
}

function selectAllEnvelopes() {
    selectedEnvelopes = getEnvelopesByFilters().map(function(e) { return e.id; });
    renderEnvelopeMultiselect();
    refreshStats();
}


function deselectAllEnvelopes() {
    selectedEnvelopes = [];
    renderEnvelopeMultiselect();
    refreshStats();
}


function selectMyEnvelopes() {
    if (!state.currentUserId) { selectedEnvelopes = []; }
    else {
        selectedEnvelopes = state.envelopes.filter(function(e) {
            return e.type === 'personal' && e.owners && e.owners.indexOf(state.currentUserId) !== -1;
        }).map(function(e) { return e.id; });
    }
    renderEnvelopeMultiselect();
    refreshStats();
}

function selectSharedEnvelopes() {
    selectedEnvelopes = state.envelopes.filter(function(e) { return e.type === 'shared'; }).map(function(e) { return e.id; });
    renderEnvelopeMultiselect();
    refreshStats();
}

function updateEnvelopeFilterLabel() {
    var label = document.getElementById('envelopeFilterLabel');
    if (!label) return;
    if (selectedEnvelopes.length === 0) { label.textContent = 'Все конверты (' + state.envelopes.length + ')'; }
    else if (selectedEnvelopes.length === 1) {
        var env = state.envelopes.find(function(e) { return e.id === selectedEnvelopes[0]; });
        label.textContent = env ? env.name : '1 конверт';
    } else { label.textContent = selectedEnvelopes.length + ' конверт(ов)'; }
}

function toggleKpiExtended() {
    kpiExtendedVisible = !kpiExtendedVisible;
    document.getElementById('kpiGridExtended').classList.toggle('hidden', !kpiExtendedVisible);
    document.getElementById('toggleKpiBtn').textContent = kpiExtendedVisible ? 'Скрыть ↑' : 'Показать ещё ↓';
}

function getFilteredTransactions() {
    var now = new Date();
    var startDate = null;
    var endDate = null;
    if (currentTimeFilter === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (currentTimeFilter === '7days') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (currentTimeFilter === '30days') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (currentTimeFilter === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (currentTimeFilter === 'year') startDate = new Date(now.getFullYear(), 0, 1);
    else if (currentTimeFilter === 'custom') {
        var dateFrom = document.getElementById('dateFrom').value;
        var dateTo = document.getElementById('dateTo').value;
        if (dateFrom) startDate = new Date(dateFrom);
        if (dateTo) { endDate = new Date(dateTo); endDate.setHours(23, 59, 59, 999); }
    }
    return state.transactions.filter(function(t) {
        var txDate = new Date(t.date);
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        if (currentUserFilter !== 'all' && t.userId !== currentUserFilter) return false;
        
        // Фильтр по типу конверта
        if (currentEnvelopeTypeFilter !== 'all') {
            var involvesMatchingEnvelope = false;
            if (t.from) {
                var fromEnv = state.envelopes.find(function(e) { return e.id === t.from; });
                if (fromEnv && fromEnv.type === currentEnvelopeTypeFilter) involvesMatchingEnvelope = true;
            }
            if (t.to) {
                var toEnv = state.envelopes.find(function(e) { return e.id === t.to; });
                if (toEnv && toEnv.type === currentEnvelopeTypeFilter) involvesMatchingEnvelope = true;
            }
            if (!involvesMatchingEnvelope) return false;
        }
        
        if (selectedEnvelopes.length > 0) {
            if (selectedEnvelopes.indexOf(t.from) === -1 && selectedEnvelopes.indexOf(t.to) === -1) return false;
        }
        return true;
    });
}


function getPreviousPeriodTransactions() {
    var now = new Date();
    var periodLength = 0;
    if (currentTimeFilter === 'today') periodLength = 1;
    else if (currentTimeFilter === '7days') periodLength = 7;
    else if (currentTimeFilter === '30days') periodLength = 30;
    else if (currentTimeFilter === 'month') periodLength = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    else if (currentTimeFilter === 'year') periodLength = 365;
    else return [];
    var endDate = new Date(now.getTime() - periodLength * 24 * 60 * 60 * 1000);
    var startDate = new Date(endDate.getTime() - periodLength * 24 * 60 * 60 * 1000);
    return state.transactions.filter(function(t) {
        var txDate = new Date(t.date);
        return txDate >= startDate && txDate < endDate;
    });
}

function refreshStats() {
    renderKPI();
    renderBalanceChart();
    renderDailyExpenseChart();
    renderExpenseStructureChart();
}

function renderKPI() {
    var filtered = getFilteredTransactions();
    var previous = getPreviousPeriodTransactions();
    var inc = 0, exp = 0, transfers = 0, operations = 0, maxOp = 0;
    var days = new Set();
    filtered.forEach(function(tx) {
        operations++;
        if (tx.type === 'put' || tx.type === 'distribute') inc += tx.amount;
        else if (tx.type === 'take' || tx.type === 'delete') exp += tx.amount;
        else if (tx.type === 'transfer') transfers++;
        if (tx.amount > maxOp) maxOp = tx.amount;
        days.add(new Date(tx.date).toDateString());
    });
    
    // Реальный баланс: сумма всех денег в конвертах + банк
    // С учётом фильтров по пользователю и типу конверта
    var balance = 0;
    
    // Добавляем баланс банка (неиспользованные купюры)
    // Банк показываем, только если нет фильтра по конкретным конвертам
    if (selectedEnvelopes.length === 0) {
        balance += calculateUnusedBillsTotal();
    }
    
    // Добавляем баланс конвертов с учётом фильтров
    var envelopesToShow = getEnvelopesByFilters();
    if (selectedEnvelopes.length > 0) {
        envelopesToShow = envelopesToShow.filter(function(e) { 
            return selectedEnvelopes.indexOf(e.id) !== -1; 
        });
    }
    envelopesToShow.forEach(function(env) {
        balance += calculateEnvelopeTotal(env.bills);
    });
    
    var avgCheck = operations > 0 ? Math.round((inc + exp) / operations) : 0;
    var prevInc = 0, prevExp = 0;
    previous.forEach(function(tx) {
        if (tx.type === 'put' || tx.type === 'distribute') prevInc += tx.amount;
        else if (tx.type === 'take' || tx.type === 'delete') prevExp += tx.amount;
    });
    var incomeTrend = prevInc > 0 ? Math.round(((inc - prevInc) / prevInc) * 100) : 0;
    var expenseTrend = prevExp > 0 ? Math.round(((exp - prevExp) / prevExp) * 100) : 0;
    document.getElementById('kpiIncome').textContent = formatMoney(inc);
    document.getElementById('kpiExpense').textContent = formatMoney(exp);
    var balEl = document.getElementById('kpiBalance');
    balEl.textContent = formatMoney(balance);
    balEl.className = 'kpi-value ' + (balance >= 0 ? 'income' : 'expense');
    document.getElementById('kpiTransfers').textContent = transfers;
    document.getElementById('kpiOperations').textContent = operations;
    document.getElementById('kpiAvgCheck').textContent = formatMoney(avgCheck);
    document.getElementById('kpiMaxOp').textContent = formatMoney(maxOp);
    document.getElementById('kpiActiveDays').textContent = days.size;
    var incomeTrendEl = document.getElementById('kpiIncomeTrend');
    if (prevInc > 0) {
        incomeTrendEl.textContent = (incomeTrend >= 0 ? ' +' : '📉 ') + incomeTrend + '%';
        incomeTrendEl.className = 'kpi-trend ' + (incomeTrend >= 0 ? 'positive' : 'negative');
    } else incomeTrendEl.textContent = '';
    var expenseTrendEl = document.getElementById('kpiExpenseTrend');
    if (prevExp > 0) {
        expenseTrendEl.textContent = (expenseTrend >= 0 ? '📈 +' : '📉 ') + expenseTrend + '%';
        expenseTrendEl.className = 'kpi-trend ' + (expenseTrend <= 0 ? 'positive' : 'negative');
    } else expenseTrendEl.textContent = '';
}


function renderBalanceChart() {
    var filtered = getFilteredTransactions();
    var envelopeId = document.getElementById('balanceChartEnvelope').value;
    var dailyBalance = {};
    var runningBalance = 0;
    var sorted = filtered.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    sorted.forEach(function(tx) {
        var date = new Date(tx.date).toDateString();
        if (tx.type === 'put' || tx.type === 'distribute') {
            if (envelopeId === 'all' || tx.to === envelopeId) runningBalance += tx.amount;
        } else if (tx.type === 'take' || tx.type === 'delete') {
            if (envelopeId === 'all' || tx.from === envelopeId) runningBalance -= tx.amount;
        } else if (tx.type === 'manual_adjust') {
            if (tx.to === envelopeId || (envelopeId === 'all' && tx.to !== 'bank')) {
                runningBalance += tx.amount;
            } else if (tx.from === envelopeId || (envelopeId === 'all' && tx.from !== 'bank')) {
                runningBalance -= tx.amount;
            }
        }

        if (!dailyBalance[date]) dailyBalance[date] = 0;
        dailyBalance[date] = runningBalance;
    });
    var labels = Object.keys(dailyBalance).map(function(d) { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); });
    var data = Object.values(dailyBalance);
    var ctx = document.getElementById('balanceChart');
    if (!ctx) return;
    if (balanceChart) balanceChart.destroy();
    if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded'); return; }
    try {
        balanceChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Баланс', data: data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { return formatMoney(context.parsed.y); } } } }, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return formatMoney(value); } } } } }
        });
    } catch (e) { console.error('Error rendering balance chart:', e); }
}

function renderDailyExpenseChart() {
    var filtered = getFilteredTransactions();
    var dailyExpenses = {};
    filtered.forEach(function(tx) {
        if (tx.type === 'take' || tx.type === 'delete') {
            var date = new Date(tx.date).toDateString();
            if (!dailyExpenses[date]) dailyExpenses[date] = 0;
            dailyExpenses[date] += tx.amount;
        }
    });
    var labels = Object.keys(dailyExpenses).map(function(d) { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); });
    var data = Object.values(dailyExpenses);
    var ctx = document.getElementById('dailyExpenseChart');
    if (!ctx) return;
    if (dailyExpenseChart) dailyExpenseChart.destroy();
    if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded'); return; }
    try {
        dailyExpenseChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [{ label: 'Расходы', data: data, backgroundColor: '#ef4444', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { return formatMoney(context.parsed.y); } } } }, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return formatMoney(value); } } } } }
        });
    } catch (e) { console.error('Error rendering daily expense chart:', e); }
}

function renderExpenseStructureChart() {
    var filtered = getFilteredTransactions();
    var byEnvelope = {};
    filtered.forEach(function(tx) {
        if (tx.type === 'take' || tx.type === 'delete') {
            var env = state.envelopes.find(function(e) { return e.id === tx.from; });
            var name = tx.fromName || (env ? env.name : 'Удаленный');
            if (!byEnvelope[name]) byEnvelope[name] = 0;
            byEnvelope[name] += tx.amount;
        }
    });
    var labels = Object.keys(byEnvelope);
    var data = Object.values(byEnvelope);
    var colors = ['#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#6b7280', '#14b8a6'];
    var ctx = document.getElementById('expenseStructureChart');
    if (!ctx) return;
    if (expenseStructureChart) expenseStructureChart.destroy();
    if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded'); return; }
    try {
        expenseStructureChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: labels.length ? labels : ['Нет данных'], datasets: [{ data: data.length ? data : [1], backgroundColor: labels.length ? colors : ['#e5e7eb'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 }, color: '#4b5563' } }, tooltip: { callbacks: { label: function(context) { var l = context.label || ''; if (l) l += ': '; if (context.parsed !== null) l += formatMoney(context.parsed); return l; } } } } }
        });
    } catch (e) { console.error('Error rendering expense structure chart:', e); }
}

function updateBalanceChartEnvelopeSelect() {
    var select = document.getElementById('balanceChartEnvelope');
    if (!select) return;
    select.innerHTML = '<option value="all">Общий баланс</option>';
    
    // Получаем конверты в зависимости от фильтров
    var envelopes = getEnvelopesByFilters();
    
    envelopes.forEach(function(env) {
        var option = document.createElement('option');
        option.value = env.id;
        option.textContent = (env.icon || '') + ' ' + env.name + ' (' + getEnvelopeOwnerLabel(env) + ')';
        select.appendChild(option);
    });
}

function getEnvelopesByFilters() {
    var envelopes = [];
    state.envelopes.forEach(function(env) {
        if (!env.owners) return;
        
        // Фильтр по пользователю
        if (currentUserFilter !== 'all') {
            if (env.type === 'personal' && env.owners.indexOf(currentUserFilter) === -1) return;
            if (env.type === 'shared' && env.owners.indexOf(currentUserFilter) === -1) return;
        }
        
        // Фильтр по типу конверта
        if (currentEnvelopeTypeFilter !== 'all' && env.type !== currentEnvelopeTypeFilter) return;
        
        envelopes.push(env);
    });
    return envelopes;
}


// ===== HISTORY =====
function setTimeFilterHistory(filter, btn) {
    historyTimeFilter = filter;
    document.querySelectorAll('#timeFilterHistory .time-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    if (filter !== 'custom') {
        document.getElementById('dateFromHistory').value = '';
        document.getElementById('dateToHistory').value = '';
    }
    renderHistoryMainContent();
}

function applyCustomDateRangeHistory() {
    var dateFrom = document.getElementById('dateFromHistory').value;
    var dateTo = document.getElementById('dateToHistory').value;
    if (dateFrom && dateTo) {
        historyTimeFilter = 'custom';
        document.querySelectorAll('#timeFilterHistory .time-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        renderHistoryMainContent();
    }
}

function setUserFilterHistory(user, btn) {
    // Если кликнули по уже активному — сбрасываем на "Все"
    if (historyUserFilter === user) {
        historyUserFilter = 'all';
    } else {
        historyUserFilter = user;
    }
    
    document.querySelectorAll('#userFilterHistory .user-filter-btn').forEach(function(b) { 
        b.classList.remove('active'); 
    });
    
    var buttons = document.querySelectorAll('#userFilterHistory .user-filter-btn');
    for (var i = 0; i < buttons.length; i++) {
        var btnUserId = buttons[i].getAttribute('data-user-id');
        if (btnUserId === historyUserFilter) {
            buttons[i].classList.add('active');
            break;
        }
    }
    
    renderHistoryMainContent();
}


function setOperationTypeFilter(type, btn) {
    historyOperationType = type;
    document.querySelectorAll('.type-filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderHistoryMainContent();
}

function getFilteredHistoryTransactions() {
    var now = new Date();
    var startDate = null;
    var endDate = null;
    if (historyTimeFilter === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (historyTimeFilter === '7days') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (historyTimeFilter === '30days') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (historyTimeFilter === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (historyTimeFilter === 'year') startDate = new Date(now.getFullYear(), 0, 1);
    else if (historyTimeFilter === 'custom') {
        var dateFrom = document.getElementById('dateFromHistory').value;
        var dateTo = document.getElementById('dateToHistory').value;
        if (dateFrom) startDate = new Date(dateFrom);
        if (dateTo) { endDate = new Date(dateTo); endDate.setHours(23, 59, 59, 999); }
    }
    return state.transactions.filter(function(t) {
        var txDate = new Date(t.date);
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        if (historyUserFilter !== 'all' && t.userId !== historyUserFilter) return false;
        if (historyOperationType === 'manual' && t.type !== 'manual_adjust') return false;
        if (historyOperationType === 'put' && t.type !== 'put' && t.type !== 'distribute') return false;
        if (historyOperationType !== 'all' && historyOperationType !== 'manual' && historyOperationType !== 'put' && t.type !== historyOperationType) return false;
        return true;
    });
}

function renderHistoryMainContent() {
    var txs = getFilteredHistoryTransactions();
    var putCount = 0, takeCount = 0, transferCount = 0;
    var batchIds = new Set();
    
    txs.forEach(function(tx) {
        if (tx.type === 'put') {
            putCount++;
        } else if (tx.type === 'take') {
            takeCount++;
        } else if (tx.type === 'transfer') {
            transferCount++;
        } else if (tx.type === 'distribute' && tx.batchId) {
            batchIds.add(tx.batchId); // Считаем уникальные распределения
        }
    });
    
    // Добавляем количество уникальных распределений к общему числу пополнений
    putCount += batchIds.size;
    
    document.getElementById('historyTotalOps').textContent = txs.length;
    document.getElementById('historyPutCount').textContent = putCount;
    document.getElementById('historyTakeCount').textContent = takeCount;
    document.getElementById('historyTransferCount').textContent = transferCount;
    renderHistoryMainList();
}


function renderHistoryMainList() {
    var c = document.getElementById('historyMainList');
    if (!c) return;
    c.innerHTML = '';
    var txs = getFilteredHistoryTransactions().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    var searchInput = document.getElementById('historySearchInput');
    var searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchQuery) {
        txs = txs.filter(function(tx) {
            var comment = (tx.comment || '').toLowerCase();
            var fromName = (tx.fromName || '').toLowerCase();
            var toName = (tx.toName || '').toLowerCase();
            return comment.indexOf(searchQuery) !== -1 || fromName.indexOf(searchQuery) !== -1 || toName.indexOf(searchQuery) !== -1;
        });
    }
    if (txs.length === 0) {
        c.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: var(--text-secondary);">Операции не найдены</div>';
        return;
    }
    
    // Группируем транзакции по batchId
    var groups = {};
    var singleTxs = [];
    txs.forEach(function(tx) {
        if (tx.batchId && tx.type === 'distribute') {
            if (!groups[tx.batchId]) groups[tx.batchId] = [];
            groups[tx.batchId].push(tx);
        } else {
            singleTxs.push(tx);
        }
    });
    
    // Рендерим сгруппированные транзакции
    Object.keys(groups).forEach(function(batchId) {
        var group = groups[batchId];
        var totalAmount = group.reduce(function(sum, tx) { return sum + tx.amount; }, 0);
        var firstTx = group[0];
        var dt = new Date(firstTx.date);
        var ds = dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) + ' в ' + dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        var user = getUserById(firstTx.userId);
        var userName = user ? user.emoji + ' ' + user.name : firstTx.userId;
        
        var div = document.createElement('div');
        div.className = 'history-item history-item-parent';
        div.innerHTML = '<div style="flex: 1;">' +
            '<div class="history-item-header">' +
                '<div class="history-item-icon put">➕</div>' +
                '<div>' +
                    '<div class="history-item-title" style="color: var(--success);">Пополнение</div>' +
                    '<div class="history-item-meta">' + userName + ' • ' + ds + '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="history-item-amount positive">+' + formatMoney(totalAmount) + '</div>';

        
        // Обработчик клика для раскрытия
        div.onclick = function() {
            var children = document.getElementById('children-' + batchId);
            if (children) {
                children.classList.toggle('expanded');
                div.classList.toggle('expanded');
            }
        };
        c.appendChild(div);
        
        // Создаем контейнер для дочерних элементов
        var childrenDiv = document.createElement('div');
        childrenDiv.className = 'history-item-children';
        childrenDiv.id = 'children-' + batchId;
        // Добавляем заголовок "Распределение" при раскрытии
        var headerDiv = document.createElement('div');
        headerDiv.className = 'history-item-child-header';
        headerDiv.innerHTML = '<span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">💰 Распределение по ' + group.length + ' конверт' + (group.length > 1 ? 'ам' : 'у') + '</span>';
        childrenDiv.appendChild(headerDiv);

        group.forEach(function(tx) {
            var childDiv = document.createElement('div');
            childDiv.className = 'history-item-child';
            var env = state.envelopes.find(function(e) { return e.id === tx.to; });
            var envName = tx.toName || (env ? env.name : 'Неизвестно');
            var envIcon = env ? (env.icon || '📁') : '';
            childDiv.innerHTML = '<span class="history-item-child-name">' + envIcon + ' ' + escapeHtml(envName) + '</span>' +
                '<span class="history-item-child-amount">+' + formatMoney(tx.amount) + '</span>';
            childrenDiv.appendChild(childDiv);
        });

        c.appendChild(childrenDiv);
    });
    
    // Рендерим одиночные транзакции
    singleTxs.forEach(function(tx) {
        var div = document.createElement('div');
        div.className = 'history-item';
        var dt = new Date(tx.date);
        var ds = dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) + ' в ' + dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        var icon = '', iconClass = '', color = 'var(--text-primary)', title = '', amountClass = 'neutral', amountPrefix = '';
        var fe = state.envelopes.find(function(e) { return e.id === tx.from; });
        var te = state.envelopes.find(function(e) { return e.id === tx.to; });
        var fromName = tx.fromName || (fe ? fe.name : 'Удаленный конверт');
        var toName = tx.toName || (te ? te.name : (tx.to === 'external' ? 'Потрачено' : tx.to === 'bank' ? 'Банк' : 'Удаленный конверт'));
        if (tx.type === 'put') { icon = '➕'; iconClass = 'put'; color = 'var(--success)'; title = 'Пополнение "' + toName + '"'; amountClass = 'positive'; amountPrefix = '+'; }
        else if (tx.type === 'take') { icon = '➖'; iconClass = 'take'; color = 'var(--danger)'; title = 'Трата из "' + fromName + '"'; amountClass = 'negative'; amountPrefix = '-'; }
        else if (tx.type === 'transfer') { icon = '🔄'; iconClass = 'transfer'; color = 'var(--primary)'; title = '"' + fromName + '" → "' + toName + '"'; amountClass = 'neutral'; }
        else if (tx.type === 'delete') { icon = '🗑️'; iconClass = 'delete'; color = 'var(--gray-500)'; title = 'Удаление "' + fromName + '"'; amountClass = 'negative'; amountPrefix = '-'; }
        else if (tx.type === 'manual_adjust') { icon = '🔧'; iconClass = 'manual'; color = 'var(--gray-500)'; title = 'Ручная корректировка "' + toName + '"'; amountClass = tx.amount > 0 ? 'positive' : 'negative'; amountPrefix = tx.amount > 0 ? '+' : '-'; }
        var user = getUserById(tx.userId);
        var userName = user ? user.emoji + ' ' + user.name : tx.userId;
        var commentHtml = tx.comment ? '<div class="history-item-comment">💬 ' + escapeHtml(tx.comment) + '</div>' : '';
        div.innerHTML = '<div style="flex: 1;">' +
            '<div class="history-item-header">' +
                '<div class="history-item-icon ' + iconClass + '">' + icon + '</div>' +
                '<div>' +
                    '<div class="history-item-title" style="color: ' + color + ';">' + title + '</div>' +
                    '<div class="history-item-meta">' + userName + ' • ' + ds + '</div>' +
                '</div>' +
            '</div>' +
            commentHtml +
        '</div>' +
        '<div class="history-item-amount ' + amountClass + '">' + amountPrefix + formatMoney(tx.amount) + '</div>';
        c.appendChild(div);
    });
}


function openEnvelopeHistory() {
    var env = state.envelopes.find(function(e) { return e.id === currentEnvelopeId; });
    if (!env) return;
    document.getElementById('envelopeHistoryTitle').textContent = '📜 История: ' + env.name;
    var c = document.getElementById('envelopeHistoryList');
    if (!c) return;
    c.innerHTML = '';
    var txs = state.transactions.filter(function(t) { return t.from === currentEnvelopeId || t.to === currentEnvelopeId; }).sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    if (txs.length === 0) { c.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: var(--text-secondary);">Нет операций</div>'; }
    else {
        txs.forEach(function(tx) {
            var div = document.createElement('div');
            div.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between; align-items: flex-start;';
            var dt = new Date(tx.date);
            var ds = dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' + dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            var icon = '', color = 'var(--text-primary)', desc = '', pos = false;
            var fromName = tx.fromName || 'Удаленный конверт';
            var toName = tx.toName || 'Удаленный конверт';
            if (tx.to === currentEnvelopeId) {
                pos = true; color = 'var(--success)';
                if (tx.type === 'put') { icon = '➕'; desc = 'Пополнение'; }
                else if (tx.type === 'transfer') { icon = '🔄'; desc = 'Из "' + fromName + '"'; }
                else if (tx.type === 'distribute') { icon = '💰'; desc = 'Распределение'; }
            } else {
                pos = false; color = 'var(--danger)';
                if (tx.type === 'take') { icon = '➖'; desc = 'Трата'; }
                else if (tx.type === 'transfer') { icon = ''; desc = 'В "' + toName + '"'; }
                else if (tx.type === 'delete') { icon = '🗑️'; desc = 'Удаление'; }
            }
            var ch = tx.comment ? '<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">💬 ' + escapeHtml(tx.comment) + '</div>' : '';
            div.innerHTML = '<div style="flex: 1;"><div style="font-weight: 600; font-size: 14px; color: ' + color + ';">' + icon + ' ' + desc + '</div><div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">' + ds + '</div>' + ch + '</div><div style="font-weight: 700; font-size: 15px; color: ' + color + '; margin-left: 12px;">' + (pos ? '+' : '-') + formatMoney(tx.amount) + '</div>';
            c.appendChild(div);
        });
    }
    document.getElementById('envelopeHistoryModal').classList.add('active');
}

// ===== SETTINGS =====
function exportData() {
    var s = JSON.stringify(state, null, 2);
    var b = new Blob([s], { type: 'application/json' });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u;
    a.download = 'budget-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(u);
    showSuccessMessage('settingsMessage', 'Экспортировано');
}

function importData(ev) {
    var f = ev.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
        try {
            var d = JSON.parse(e.target.result);
            if (!d.envelopes || !d.unusedBills) throw new Error('Неверный формат');
            state = d;
            if (!state.users) state.users = [];
            if (!state.currentUserId && state.users.length > 0) {
                state.currentUserId = state.users[0].id;
                localStorage.setItem('currentUserId', state.currentUserId);
            }
            if (!state.transactions) state.transactions = [];
            state.envelopes.forEach(function(env) {
                if (env.goal === undefined) env.goal = 0;
                if (!env.owners) {
                    if (env.owner === 'shared') env.owners = ['shared'];
                    else env.owners = [env.owner || 'me'];
                }
                if (!env.type) env.type = env.owners.length > 1 || env.owners.indexOf('shared') !== -1 ? 'shared' : 'personal';
            });
            initializeUnusedBills();
            saveState();
            showSuccessMessage('settingsMessage', 'Импортировано');
        } catch (err) { alert('Ошибка: ' + err.message); }
    };
    r.readAsText(f);
    ev.target.value = '';
}

async function clearAllData() {
    if (isSaving) return;
    if (confirm('Удалить ВСЕ данные семьи? Это действие нельзя отменить.')) {
        const code = localStorage.getItem('familyCode');
        if (code) {
            try { await db.collection('families').doc(code).delete(); }
            catch (e) { console.error("Error deleting family:", e); }
        }
        leaveFamily();
        showSuccessMessage('settingsMessage', 'Все данные удалены');
    }
}

function resetTour(tourId) {
    const userId = state.currentUserId;
    localStorage.removeItem('hasSeen' + capitalizeFirstLetter(tourId) + 'Tour_' + userId);
    alert('Тур "' + tourId + '" сброшен. Перейдите на соответствующую вкладку, чтобы пройти его снова.');
}



function resetAllTours() {
    if (confirm('Сбросить все интерактивные туры по интерфейсу?')) {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenMainTour_' + userId);
        localStorage.removeItem('hasSeenStatsTour_' + userId);
        localStorage.removeItem('hasSeenHistoryTour_' + userId);
        localStorage.removeItem('hasSeenSettingsTour_' + userId);
        localStorage.removeItem('hasSeenUsersTour_' + userId);
        alert('Все туры сброшены!');
    }
}



// ===== ИНДИКАТОР ЗАГРУЗКИ =====
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}


// ===== ИНТЕРАКТИВНОЕ ОБУЧЕНИЕ ИЗ НАСТРОЕК =====

function showInteractiveTooltip(target, text, callback) {
    const getElement = () => {
        if (typeof target === 'string') {
            return document.querySelector(target);
        }
        return target;
    };
    
    const el = getElement();
    if (!el) {
        console.error('Элемент не найден:', target);
        return;
    }
    
    // Убрали проверку на нулевые размеры — просто пробуем показать
    const rect = el.getBoundingClientRect();
    
    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10001;pointer-events:none;';
    
    const spotlight = document.createElement('div');
    spotlight.className = 'tour-spotlight';
    spotlight.style.zIndex = '10002';
    spotlight.style.pointerEvents = 'none';
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.style.zIndex = '10003';
    tooltip.style.pointerEvents = 'none';
    tooltip.innerHTML = '<p class="tour-tooltip-text" style="text-align:center; margin-bottom:0;">' + text + '</p>';
    
    overlay.appendChild(spotlight);
    overlay.appendChild(tooltip);
    document.body.appendChild(overlay);
    
    const updatePosition = () => {
        const rect = el.getBoundingClientRect();
        spotlight.style.display = 'block';
        spotlight.style.width = rect.width + 'px';
        spotlight.style.height = rect.height + 'px';
        spotlight.style.top = rect.top + 'px';
        spotlight.style.left = rect.left + 'px';
        
        const tooltipWidth = Math.min(280, window.innerWidth - 20);
        let tLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        tLeft = Math.max(10, Math.min(tLeft, window.innerWidth - tooltipWidth - 10));
        
        let tTop = rect.bottom + 15;
        if (tTop + 100 > window.innerHeight) {
            tTop = rect.top - 110;
        }
        
        tooltip.style.left = tLeft + 'px';
        tooltip.style.top = tTop + 'px';
        tooltip.style.width = tooltipWidth + 'px';
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    const cleanup = () => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        if (callback) callback();
    };
    
    el.addEventListener('click', cleanup, true);
    
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            cleanup();
        }
    }, 5000);
}


function startInteractiveTour(type) {
    if (type === 'main') {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenMainTour_' + userId);
        switchScreen('home');
        setTimeout(() => {
            showInteractiveTooltip('.header', 'Это главный экран. Здесь отображается общий баланс и все ваши конверты.', () => {});
        }, 500);
    }
    else if (type === 'stats') {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenStatsTour_' + userId);
        switchScreen('stats');
        setTimeout(() => {
            showInteractiveTooltip('.stats-filters', 'Это раздел статистики. Здесь вы можете анализировать свои расходы и доходы.', () => {});
        }, 500);
    }
    else if (type === 'history') {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenHistoryTour_' + userId);
        switchScreen('history');
        setTimeout(() => {
            showInteractiveTooltip('.operation-type-filter', 'Это раздел истории. Здесь записаны все операции с вашими конвертами.', () => {});
        }, 500);
    }
    else if (type === 'settings') {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenSettingsTour_' + userId);
        switchScreen('settings');
        setTimeout(() => {
            showInteractiveTooltip('.settings-page-section:first-child', 'Это раздел настроек. Здесь вы можете управлять семьей и обучением.', () => {});
        }, 500);
    }
    else if (type === 'users') {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenUsersTour_' + userId);
        switchScreen('users');
        setTimeout(() => {
            showInteractiveTooltip('.users-list', 'Это раздел участников. Здесь вы можете управлять членами семьи.', () => {});
        }, 500);
    }
    else if (type === 'distribute') {
        if (getVisibleEnvelopes().length === 0) {
            alert('Сначала создайте хотя бы один конверт, чтобы распределить деньги.');
            return;
        }
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenModalTour_distribution_' + userId);
        localStorage.removeItem('hasSeenModalTour_distributionStep2_' + userId);
        switchScreen('home');
        setTimeout(() => {
            showInteractiveTooltip('#fabDistribution', 'Нажмите на кнопку "Разложить", чтобы начать распределение денег.', () => {});
        }, 500);
    }
    else if (type === 'create') {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenModalTour_createEnvelope_' + userId);
        switchScreen('home');
        setTimeout(() => {
            // Ищем только ВИДИМЫЙ элемент
            let target = null;
            
            // Проверяем #createEnvelopeBtn (виден, когда есть конверты)
            const createBtn = document.getElementById('createEnvelopeBtn');
            if (createBtn && createBtn.offsetParent !== null) {
                target = createBtn;
            }
            
            // Проверяем кнопку в empty-state (видна, когда нет конвертов)
            if (!target) {
                const emptyBtn = document.querySelector('.empty-state .btn-primary');
                if (emptyBtn && emptyBtn.offsetParent !== null) {
                    target = emptyBtn;
                }
            }
            
            if (target) {
                showInteractiveTooltip(target, 'Нажмите, чтобы создать новый конверт.', () => {});
            } else {
                console.error('Видимая кнопка создания конверта не найдена');
            }
        }, 600);
    }
    else if (type === 'edit') {
        const envelopes = getVisibleEnvelopes();
        if (envelopes.length === 0) {
            alert('Сначала создайте хотя бы один конверт, чтобы его редактировать.');
            return;
        }
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenModalTour_editEnvelope_' + userId);
        switchScreen('home');
        setTimeout(() => {
            const firstCard = document.querySelector('.envelope-card');
            if (firstCard) {
                showInteractiveTooltip(firstCard, 'Нажмите на этот конверт, чтобы открыть его настройки.', () => {});
            } else {
                alert('Конверты не найдены');
            }
        }, 500);
    }
}

function resetAllLearning() {
    if (confirm('Сбросить ВСЕ обучение (интерфейс и модалки)?')) {
        const userId = state.currentUserId;
        localStorage.removeItem('hasSeenOnboardingMaster_' + userId);
        localStorage.removeItem('hasSeenMainTour_' + userId);
        localStorage.removeItem('hasSeenStatsTour_' + userId);
        localStorage.removeItem('hasSeenHistoryTour_' + userId);
        localStorage.removeItem('hasSeenSettingsTour_' + userId);
        localStorage.removeItem('hasSeenUsersTour_' + userId);
        localStorage.removeItem('hasSeenModalTour_createEnvelope_' + userId);
        localStorage.removeItem('hasSeenModalTour_editEnvelope_' + userId);
        localStorage.removeItem('hasSeenModalTour_distribution_' + userId);
        localStorage.removeItem('hasSeenModalTour_distributionStep2_' + userId);
        alert('Все обучение сброшено! Перезагрузите страницу или перейдите на главный экран.');
    }
}




// ===== HELPERS =====
function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove('active'); }
function showError(id, msg) { var el = document.getElementById(id); if (el) { el.textContent = msg; el.classList.add('visible'); } }
function hideError(id) { var el = document.getElementById(id); if (el) el.classList.remove('visible'); }
function showSuccess(id) { var el = document.getElementById(id); if (el) el.classList.add('visible'); }
function hideSuccess(id) { var el = document.getElementById(id); if (el) el.classList.remove('visible'); }
function showSuccessMessage(id, msg) { var el = document.getElementById(id); if (el) { el.textContent = msg; el.classList.add('visible'); setTimeout(function() { el.classList.remove('visible'); }, 3000); } }
function formatMoney(a) { return new Intl.NumberFormat('ru-RU').format(a) + ' ₽'; }
function calculateEnvelopeTotal(b) { return calculateBillsTotal(b); }
function calculateBillsTotal(b) { var t = 0; BILL_DENOMINATIONS.forEach(function(d) { t += (b[d] || 0) * d; }); return t; }
function calculateUnusedBillsTotal() { return calculateBillsTotal(state.unusedBills); }
function escapeHtml(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

document.addEventListener('DOMContentLoaded', init);
