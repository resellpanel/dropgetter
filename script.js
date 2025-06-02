// script_v2.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Элементы UI
    const appBalanceSpan = document.getElementById('app-balance');
    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-button');
    const initialLoadingScreen = document.getElementById('initial-loading-screen');
    const mainHubScreen = document.getElementById('main-hub-screen'); // Пока не используется, но можно добавить
    const depositScreen = document.getElementById('deposit-screen');
    const gamesScreen = document.getElementById('games-screen');
    const profileScreen = document.getElementById('profile-screen');
    const caseOpeningScreen = document.getElementById('case-opening-screen');

    // Элементы для открытия кейса (скопированы из старого и адаптированы ID)
    const caseEmojiOpenDiv = document.getElementById('case-emoji-open');
    const caseNameOpenH2 = document.getElementById('case-name-open');
    const caseCostOpenSpan = document.getElementById('case-cost-open');
    const userBalanceOpenSpan = document.getElementById('user-balance-open');
    const notEnoughFundsOpenP = document.getElementById('not-enough-funds-open');
    const openActualCaseBtn = document.getElementById('open-actual-case-btn'); // Кнопка на экране открытия кейса
    const openingStatusTextCaseP = document.getElementById('opening-status-text-case');
    const rouletteTrackCaseDiv = document.querySelector('.roulette-track-case');
    const visualPrizeTextCaseP = document.getElementById('visual-prize-text-case');
    const casesListContainer = document.getElementById('cases-list-container');


    // Глобальные переменные для данных, полученных из URL
    let currentUserId = null;
    let currentBalance = 0;
    let currentCaseDataForOpening = null; // { key, name, emoji, cost, prizesForAnimation }

    // --- Инициализация и получение параметров ---
    function initializeApp() {
        if (!tg) {
            showErrorInApp("Telegram API не найдено. Пожалуйста, откройте в Telegram.");
            return;
        }
        tg.ready();
        tg.expand();
        applyTheme(); // Применяем тему ТГ

        const queryParams = new URLSearchParams(window.location.search);
        currentUserId = queryParams.get('userId');
        const balanceParam = queryParams.get('balance');
        
        if (currentUserId && balanceParam !== null) {
            currentBalance = parseInt(balanceParam, 10);
            if (isNaN(currentBalance)) currentBalance = 0;
            updateAppBalance(currentBalance);
        } else {
            showErrorInApp("Ошибка: ID пользователя или баланс не переданы.");
            // Можно запросить данные у бота, если WebApp открыт без параметров
            // requestDataFromBot({ action: 'get_initial_data' });
            // Пока просто ошибка
            return;
        }

        // Определяем, какой экран показать в зависимости от entrypoint
        const entrypoint = queryParams.get('entrypoint');
        if (entrypoint === 'case_open') {
            const caseKey = queryParams.get('caseKey');
            const caseName = queryParams.get('caseName') ? decodeURIComponent(queryParams.get('caseName')) : 'Кейс';
            const caseEmoji = queryParams.get('caseEmoji') ? decodeURIComponent(queryParams.get('caseEmoji')) : '❓';
            const caseCost = queryParams.get('caseCost') ? parseInt(queryParams.get('caseCost'), 10) : 0;
            const prizesParam = queryParams.get('prizes');
            let prizesForAnimation = ['⭐', '💣', '🎁'];
            if (prizesParam) {
                try {
                    prizesForAnimation = JSON.parse(decodeURIComponent(prizesParam));
                    if (!Array.isArray(prizesForAnimation) || prizesForAnimation.length === 0) {
                        prizesForAnimation = ['⭐', '💣', '🎁'];
                    }
                } catch (e) { console.error("Error parsing prizes for case open:", e); }
            }
            currentCaseDataForOpening = { key: caseKey, name: caseName, emoji: caseEmoji, cost: caseCost, prizesForAnimation };
            setupCaseOpeningScreen();
            navigateToScreen('case-opening-screen');
        } else {
            // По умолчанию открываем экран игр, если нет другого entrypoint
            navigateToScreen('games-screen');
            // Можно также загрузить список кейсов для экрана игр
            loadCasesForGamesScreen();
        }
        hideInitialLoading();
    }

    function applyTheme() {
        if (tg && tg.themeParams) {
            const root = document.documentElement;
            // Пройдемся по основным цветам и установим их, если они есть в теме
            if (tg.themeParams.bg_color) root.style.setProperty('--main-bg', tg.themeParams.bg_color);
            if (tg.themeParams.text_color) root.style.setProperty('--text-color-light', tg.themeParams.text_color);
            if (tg.themeParams.button_color) root.style.setProperty('--secondary-yellow-matte', tg.themeParams.button_color);
            if (tg.themeParams.button_text_color) root.style.setProperty('--main-bg', tg.themeParams.button_text_color); // Для текста на желтых кнопках
            if (tg.themeParams.secondary_bg_color) root.style.setProperty('--container-bg', tg.themeParams.secondary_bg_color);

            // Шапку WebApp можно тоже стилизовать
            tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#141416');
        }
    }

    function updateAppBalance(newBalance) {
        currentBalance = newBalance;
        if (appBalanceSpan) appBalanceSpan.textContent = newBalance;
        // Также обновляем баланс на всех экранах, где он отображается
        document.querySelectorAll('.current-balance-stakes, #user-balance-open').forEach(el => el.textContent = newBalance);
    }

    function hideInitialLoading() {
        if (initialLoadingScreen) initialLoadingScreen.classList.remove('active-screen');
    }

    function showErrorInApp(message) {
        // TODO: Реализовать более красивый показ ошибок внутри WebApp
        console.error("WebApp Error:", message);
        alert(message); // Временное решение
        if (initialLoadingScreen) initialLoadingScreen.classList.remove('active-screen');
        // Можно показать специальный экран ошибки
    }
    
    // --- Навигация ---
    function navigateToScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active-screen');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active-screen');
        }

        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.targetscreen === screenId) {
                button.classList.add('active');
            }
        });
        // Если открывается экран открытия кейса, делаем неактивными все кнопки навигации
        if (screenId === 'case-opening-screen') {
             navButtons.forEach(button => button.classList.remove('active'));
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.dataset.targetscreen;
            navigateToScreen(targetScreenId);
            if (targetScreenId === 'games-screen') loadCasesForGamesScreen();
            // Дополнительные действия при переключении, например, загрузка данных
        });
    });
    
    document.querySelectorAll('.back-to-games-btn').forEach(button => {
        button.addEventListener('click', () => navigateToScreen('games-screen'));
    });

    // --- Логика открытия кейса (адаптированная) ---
    function setupCaseOpeningScreen() {
        if (!currentCaseDataForOpening) return;
        const { name, emoji, cost, prizesForAnimation } = currentCaseDataForOpening;

        if (caseEmojiOpenDiv) caseEmojiOpenDiv.textContent = emoji;
        if (caseNameOpenH2) caseNameOpenH2.textContent = name;
        if (caseCostOpenSpan) caseCostOpenSpan.textContent = cost;
        if (userBalanceOpenSpan) userBalanceOpenSpan.textContent = currentBalance; // Используем глобальный баланс
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Нажмите, чтобы открыть";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';


        if (currentBalance < cost) {
            if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = 'block';
            if (openActualCaseBtn) openActualCaseBtn.disabled = true;
        } else {
            if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = 'none';
            if (openActualCaseBtn) openActualCaseBtn.disabled = false;
        }
    }
    
    let isCaseOpeningInProgress = false;

    async function startCaseRouletteAnimation() {
        if (!rouletteTrackCaseDiv || !currentCaseDataForOpening || isCaseOpeningInProgress) return;
        isCaseOpeningInProgress = true;
        if (openActualCaseBtn) openActualCaseBtn.disabled = true;

        const prizesForAnimation = currentCaseDataForOpening.prizesForAnimation;
        if (!prizesForAnimation || prizesForAnimation.length === 0) {
            showErrorInApp("Нет призов для анимации кейса!");
            isCaseOpeningInProgress = false;
            if (openActualCaseBtn) openActualCaseBtn.disabled = (currentBalance < currentCaseDataForOpening.cost);
            return;
        }
        
        populateRouletteTrack(rouletteTrackCaseDiv, prizesForAnimation);
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Крутится...";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';

        const itemWidth = 70;
        const fullTrackItems = Array.from(rouletteTrackCaseDiv.children);
        const viewportWidth = rouletteTrackCaseDiv.parentElement.clientWidth;

        const initialOffset = (fullTrackItems.length / 2 - 3) * itemWidth;
        rouletteTrackCaseDiv.style.transition = 'none';
        rouletteTrackCaseDiv.style.transform = `translateX(-${initialOffset}px)`;

        const visualWinPrizeObject = prizesForAnimation[Math.floor(Math.random() * prizesForAnimation.length)];
        const visualWinEmoji = (typeof visualWinPrizeObject === 'object' && visualWinPrizeObject.emoji) ? visualWinPrizeObject.emoji : visualWinPrizeObject;


        let targetStopOverallIndex = -1;
        for (let i = fullTrackItems.length - 1; i >= fullTrackItems.length - (prizesForAnimation.length * 4); i--) {
            const itemContent = fullTrackItems[i].textContent; // Сравниваем по текстовому содержимому (эмодзи)
            if (itemContent === visualWinEmoji) {
                targetStopOverallIndex = i;
                break;
            }
        }
        if (targetStopOverallIndex === -1) {
            targetStopOverallIndex = fullTrackItems.length - Math.floor(prizesForAnimation.length * 1.5) + Math.floor(Math.random() * prizesForAnimation.length) ;
        }
        
        const finalPositionX = -(targetStopOverallIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));

        await new Promise(resolve => setTimeout(resolve, 50));

        const animationDuration = 4000 + Math.random() * 1000;
        rouletteTrackCaseDiv.style.transition = `transform ${animationDuration}ms cubic-bezier(0.2, 0.95, 0.35, 1.0)`;
        rouletteTrackCaseDiv.style.transform = `translateX(${finalPositionX}px)`;

        setTimeout(() => {
            if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Удача!";
            if (visualPrizeTextCaseP) {
                visualPrizeTextCaseP.textContent = `Похоже, это: ${visualWinEmoji}`;
                visualPrizeTextCaseP.style.display = 'block';
            }
            
            // Отправляем данные боту
            requestDataFromBot({
                action: 'open_case',
                caseKey: currentCaseDataForOpening.key
            });
            // Не закрываем сразу, ждем ответа от бота в чат
            // isCaseOpeningInProgress = false; // Разблокируем после ответа от бота или таймаута
            // if (openActualCaseBtn) openActualCaseBtn.disabled = (currentBalance < currentCaseDataForOpening.cost);
            setTimeout(() => { // Автозакрытие через некоторое время
                 if (tg) tg.close();
            }, 2500);

        }, animationDuration + 100);
    }

    if (openActualCaseBtn) {
        openActualCaseBtn.addEventListener('click', startCaseRouletteAnimation);
    }

    // --- Загрузка списка кейсов ---
    function loadCasesForGamesScreen() {
        if (casesListContainer) casesListContainer.innerHTML = '<p>Загрузка кейсов...</p>';
        // В реальном приложении здесь был бы fetch-запрос к боту
        // requestDataFromBot({ action: 'get_game_cases_list' });
        // Пока просто заглушка или используем переданные данные, если они есть
        
        // Заглушка: если бы кейсы передавались в URL (не рекомендуется для списка)
        const demoCases = [
            { key: 'common', name: 'Обычный Кейс', emoji: '🎁', cost: 50, prizesForAnimation: ['⭐', '💣'] },
            { key: 'rare', name: 'Редкий Кейс', emoji: '💎', cost: 100, prizesForAnimation: ['💎', '⭐', '💣'] }
        ];
        renderCasesList(demoCases);
    }

    function renderCasesList(cases) {
        if (!casesListContainer) return;
        casesListContainer.innerHTML = '';
        if (!cases || cases.length === 0) {
            casesListContainer.innerHTML = '<p>Доступных кейсов нет.</p>';
            return;
        }
        cases.forEach(caseData => {
            const caseDiv = document.createElement('div');
            caseDiv.classList.add('case-item-webapp');
            caseDiv.innerHTML = `
                <span>${caseData.emoji} ${caseData.name}</span>
                <span class="cost">${caseData.cost} ⭐</span>
            `;
            caseDiv.addEventListener('click', () => {
                // Сохраняем данные кейса и переходим на экран открытия
                currentCaseDataForOpening = caseData;
                setupCaseOpeningScreen();
                navigateToScreen('case-opening-screen');
            });
            casesListContainer.appendChild(caseDiv);
        });
    }
    
    // --- Общая функция для отправки данных боту ---
    function requestDataFromBot(data) {
        if (!tg || !currentUserId) {
            showErrorInApp("Не могу отправить данные: нет ID пользователя или Telegram API.");
            return;
        }
        const dataToSend = JSON.stringify({
            userId: currentUserId,
            ...data // Добавляем остальные данные из объекта
        });
        console.log("Sending to bot:", dataToSend);
        tg.sendData(dataToSend);
    }

    // Инициализация приложения
    initializeApp();
});
