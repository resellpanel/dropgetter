// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Элементы UI
    const appBalanceSpan = document.getElementById('app-balance');
    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-button');
    const initialLoadingScreen = document.getElementById('initial-loading-screen');
    
    const gamesScreen = document.getElementById('games-screen');
    const caseOpeningScreen = document.getElementById('case-opening-screen');
    const profileScreen = document.getElementById('profile-screen');
    const depositScreen = document.getElementById('deposit-screen');

    // Элементы открытия кейса
    const caseEmojiOpenDiv = document.getElementById('case-emoji-open');
    const caseNameOpenH2 = document.getElementById('case-name-open');
    const caseCostOpenSpan = document.getElementById('case-cost-open');
    const userBalanceOpenSpan = document.getElementById('user-balance-open');
    const notEnoughFundsOpenP = document.getElementById('not-enough-funds-open');
    const openActualCaseBtn = document.getElementById('open-actual-case-btn');
    const openingStatusTextCaseP = document.getElementById('opening-status-text-case');
    const rouletteTrackCaseDiv = document.querySelector('.roulette-track-case');
    const visualPrizeTextCaseP = document.getElementById('visual-prize-text-case');
    const casesListContainer = document.getElementById('cases-list-container');
    const backToGamesBtnFromCase = document.getElementById('back-to-games-from-case-btn');

    // Элементы профиля
    const profileUserIdCode = document.getElementById('profile-user-id');
    const profileFirstNameSpan = document.getElementById('profile-first-name');
    const profileUsernameSpan = document.getElementById('profile-username');
    const profileBalanceB = document.getElementById('profile-balance');
    const profileJoinDateSpan = document.getElementById('profile-join-date');
    const profileStakesPlayedSpan = document.getElementById('profile-stakes-played');
    const profileCasesPlayedSpan = document.getElementById('profile-cases-played');
    const profileRoulettePlayedSpan = document.getElementById('profile-roulette-played');
    const profileTotalDepositedSpan = document.getElementById('profile-total-deposited');
    const profileTotalWonSpan = document.getElementById('profile-total-won');

    const promocodeInput = document.getElementById('promocode-input');
    const activatePromocodeBtn = document.getElementById('activate-promocode-btn');
    const getReferralLinkBtn = document.getElementById('get-referral-link-btn');
    const referralInfoBlock = document.getElementById('referral-info-block');
    const referralLinkHrefA = document.getElementById('referral-link-href');
    const referralCountSpan = document.getElementById('referral-count');
    const referralBonusSpan = document.getElementById('referral-bonus');

    // Элементы пополнения (кнопки)
    const depositTgStarsWebappBtn = document.getElementById('deposit-tg-stars-webapp-btn');
    const depositManualWebappBtn = document.getElementById('deposit-manual-webapp-btn');
    
    // Кнопка Ставки
    const playStakesWebappBtn = document.getElementById('play-stakes-webapp-btn');


    // Глобальные переменные
    let currentUserId = null;
    let currentProfileData = {}; // Будет содержать все данные профиля
    let currentFetchedGameCases = []; // Список всех кейсов
    let currentCaseDataForOpening = null; // Данные для конкретного кейса, который открывается

    function initializeApp() {
        if (!tg) {
            showErrorInApp("Telegram API не найдено. Пожалуйста, откройте в Telegram.");
            hideInitialLoading();
            return;
        }
        tg.ready();
        tg.expand(); // Раскрываем WebApp на весь экран
        applyTheme(); // Применяем цвета из темы Telegram

        // Парсим параметры из URL
        const queryParams = new URLSearchParams(window.location.search);
        currentUserId = queryParams.get('userId');
        const profileDataParam = queryParams.get('profileData');
        const gameCasesParam = queryParams.get('gameCases');
        const entrypoint = queryParams.get('entrypoint') || 'main_hub';

        if (!currentUserId) {
            showErrorInApp("Критическая ошибка: ID пользователя не передан в WebApp.");
            hideInitialLoading();
            return;
        }

        if (profileDataParam) {
            try {
                currentProfileData = JSON.parse(decodeURIComponent(profileDataParam));
                updateAppBalance(currentProfileData.balance || 0);
                renderProfileData(currentProfileData); // Отображаем данные профиля
            } catch (e) {
                console.error("Error parsing profileData from URL:", e, profileDataParam);
                showErrorInApp("Ошибка загрузки данных профиля.");
                // Попытаться запросить данные у бота, если они не пришли
                // requestDataFromBot({ action: 'request_refresh_data_webapp' });
            }
        } else {
            console.warn("profileData not found in URL params. WebApp might not function correctly.");
             showErrorInApp("Данные профиля не загружены. Попробуйте /start.");
        }

        if (gameCasesParam) {
            try {
                currentFetchedGameCases = JSON.parse(decodeURIComponent(gameCasesParam));
                renderCasesList(currentFetchedGameCases); // Отображаем список кейсов
            } catch (e) {
                console.error("Error parsing gameCases from URL:", e, gameCasesParam);
                showErrorInApp("Ошибка загрузки списка игровых кейсов.");
            }
        } else {
             console.warn("gameCases not found in URL params.");
             if(casesListContainer) casesListContainer.innerHTML = '<p>Игровые кейсы не загружены. Попробуйте /start.</p>';
        }
        
        // Логика для entrypoint (если открывается конкретный кейс)
        if (entrypoint === 'case_open') {
            const caseKey = queryParams.get('caseKey');
            // Ищем данные этого кейса в уже загруженном списке currentFetchedGameCases
            const targetCase = currentFetchedGameCases.find(c => c.key === caseKey);
            if (targetCase) {
                 currentCaseDataForOpening = { // Собираем все нужные данные
                    key: targetCase.key,
                    name: targetCase.name,
                    emoji: targetCase.emoji,
                    cost: targetCase.cost,
                    prizesForAnimation: targetCase.prizesForAnimation || [{'emoji':'⭐','category':'STARS'}] // Используем из списка или дефолт
                };
            } else { // Если кейс не найден в общем списке (маловероятно, но возможно)
                // Пытаемся собрать из URL, если они там есть
                const caseName = queryParams.get('caseName') ? decodeURIComponent(queryParams.get('caseName')) : 'Кейс';
                const caseEmoji = queryParams.get('caseEmoji') ? decodeURIComponent(queryParams.get('caseEmoji')) : '❓';
                const caseCost = queryParams.get('caseCost') ? parseInt(queryParams.get('caseCost'), 10) : 0;
                const prizesAnimParam = queryParams.get('prizesForAnimation');
                let prizesForAnimation = [{'emoji':'⭐','category':'STARS'}];
                if (prizesAnimParam) {
                    try { prizesForAnimation = JSON.parse(decodeURIComponent(prizesAnimParam)); } catch (e) { console.error("Err parsing prizesForAnim from URL direct:", e); }
                }
                 currentCaseDataForOpening = { key: caseKey, name: caseName, emoji: caseEmoji, cost: caseCost, prizesForAnimation };
            }

            if (currentCaseDataForOpening && currentCaseDataForOpening.key) {
                setupCaseOpeningScreen(); // Настраиваем экран открытия кейса
                navigateToScreen('case-opening-screen'); // Показываем его
            } else {
                showErrorInApp("Не удалось загрузить данные для открытия кейса.");
                navigateToScreen('games-screen'); // Возврат на экран игр
            }
        } else {
            navigateToScreen('games-screen'); // Экран по умолчанию - игры
        }
        hideInitialLoading(); // Скрываем экран загрузки
    }

    function applyTheme() { // Применение темы Telegram
        if (tg && tg.themeParams) {
            const root = document.documentElement;
            if (tg.themeParams.bg_color) root.style.setProperty('--main-bg', tg.themeParams.bg_color);
            if (tg.themeParams.text_color) root.style.setProperty('--text-color-light', tg.themeParams.text_color);
            if (tg.themeParams.button_color) root.style.setProperty('--secondary-yellow-matte', tg.themeParams.button_color);
            if (tg.themeParams.button_text_color) root.style.setProperty('--text-color-dark', tg.themeParams.button_text_color);
            if (tg.themeParams.secondary_bg_color) root.style.setProperty('--container-bg', tg.themeParams.secondary_bg_color);
            try { tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#141416'); } catch(e) { console.warn("Failed to set header color", e); }
        }
    }
    
    function updateAppBalance(newBalance) { // Обновление баланса в UI
        currentProfileData.balance = newBalance; // Обновляем в кеше
        if (appBalanceSpan) appBalanceSpan.textContent = newBalance;
        if (profileBalanceB) profileBalanceB.textContent = newBalance;
        if (userBalanceOpenSpan) userBalanceOpenSpan.textContent = newBalance; // На экране открытия кейса
        // Также можно обновить баланс в других местах, если он там отображается
    }

    function hideInitialLoading() {
        if (initialLoadingScreen) initialLoadingScreen.style.display = 'none';
    }

    function showErrorInApp(message) { // Отображение ошибок
        console.error("WebApp Error:", message);
        tg.showAlert(message); // Используем стандартный alert Telegram WebApp
    }
    
    function navigateToScreen(screenId) { // Навигация между экранами
        screens.forEach(screen => screen.classList.remove('active-screen'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add('active-screen');

        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.targetscreen === screenId) button.classList.add('active');
        });
        // Если это экран открытия кейса, делаем все кнопки навигации неактивными
        if (screenId === 'case-opening-screen') {
             navButtons.forEach(button => button.classList.remove('active'));
        }
    }

    navButtons.forEach(button => { // Слушатели на кнопки навигации
        button.addEventListener('click', () => {
            const targetScreenId = button.dataset.targetscreen;
            navigateToScreen(targetScreenId);
            // При переходе на экран профиля, обновляем его данные
            if (targetScreenId === 'profile-screen') renderProfileData(currentProfileData);
            // При переходе на экран игр, обновляем список кейсов (если он мог измениться)
            // if (targetScreenId === 'games-screen') renderCasesList(currentFetchedGameCases); // Обычно не меняется без перезапуска
        });
    });
    
    // Кнопка "Назад" с экрана открытия кейса
    if (backToGamesBtnFromCase) {
        backToGamesBtnFromCase.addEventListener('click', () => navigateToScreen('games-screen'));
    }
    
    // --- Логика отображения данных профиля ---
    function renderProfileData(profile) {
        if (!profile || Object.keys(profile).length === 0) return;
        if (profileUserIdCode) profileUserIdCode.textContent = profile.userId || 'N/A';
        if (profileFirstNameSpan) profileFirstNameSpan.textContent = profile.firstName || 'N/A';
        if (profileUsernameSpan) profileUsernameSpan.textContent = profile.username ? `@${profile.username}` : 'N/A';
        if (profileBalanceB) profileBalanceB.textContent = profile.balance || 0;
        if (profileJoinDateSpan) profileJoinDateSpan.textContent = profile.joinDate || 'N/A';
        
        if (profileStakesPlayedSpan) profileStakesPlayedSpan.textContent = profile.stakesPlayed || 0;
        if (profileCasesPlayedSpan) profileCasesPlayedSpan.textContent = profile.casesPlayed || 0;
        if (profileRoulettePlayedSpan) profileRoulettePlayedSpan.textContent = profile.roulettePlayed || 0;
        
        if (profileTotalDepositedSpan) profileTotalDepositedSpan.textContent = profile.totalDeposited || 0;
        if (profileTotalWonSpan) profileTotalWonSpan.textContent = profile.totalWon || 0;

        if (referralLinkHrefA) referralLinkHrefA.href = profile.referralLink || '#';
        if (referralLinkHrefA) referralLinkHrefA.textContent = profile.referralLink || 'Нет ссылки';
        if (referralCountSpan) referralCountSpan.textContent = profile.referralsCount || 0;
        if (referralBonusSpan) referralBonusSpan.textContent = profile.referralBonus || 0;
    }

    // --- Логика отображения кейсов ---
    function renderCasesList(cases) {
        if (!casesListContainer) return;
        casesListContainer.innerHTML = ''; // Очищаем
        if (!cases || cases.length === 0) {
            casesListContainer.innerHTML = '<p>Доступных кейсов нет. Зайдите позже!</p>';
            return;
        }
        cases.forEach(caseData => {
            const caseDiv = document.createElement('div');
            caseDiv.classList.add('case-item-webapp');
            caseDiv.innerHTML = `
                <span>${caseData.emoji} ${caseData.name}</span>
                <span class="cost">${caseData.cost} ⭐</span>
            `;
            // Описание можно добавить при наведении или в отдельный блок
            if (caseData.description) {
                const descP = document.createElement('p');
                descP.classList.add('case-item-description-webapp'); // Добавьте стили для этого класса
                descP.textContent = caseData.description;
                descP.style.fontSize = '0.8em'; 
                descP.style.color = 'var(--text-color-light-muted)'; // Пример
                descP.style.marginTop = '5px';
                caseDiv.appendChild(descP);
            }

            caseDiv.addEventListener('click', () => {
                currentCaseDataForOpening = caseData; // Сохраняем для экрана открытия
                setupCaseOpeningScreen();
                navigateToScreen('case-opening-screen');
            });
            casesListContainer.appendChild(caseDiv);
        });
    }
    
    // --- Логика открытия кейса (Анимация и запрос к боту) ---
    function setupCaseOpeningScreen() {
        if (!currentCaseDataForOpening) {
            console.error("setupCaseOpeningScreen: currentCaseDataForOpening is null");
            showErrorInApp("Ошибка: Данные кейса для открытия не найдены.");
            navigateToScreen('games-screen');
            return;
        }
        
        const { name, emoji, cost } = currentCaseDataForOpening;

        if (caseEmojiOpenDiv) caseEmojiOpenDiv.textContent = emoji;
        if (caseNameOpenH2) caseNameOpenH2.textContent = name;
        if (caseCostOpenSpan) caseCostOpenSpan.textContent = cost;
        if (userBalanceOpenSpan) userBalanceOpenSpan.textContent = currentProfileData.balance; // Используем актуальный баланс
        
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Нажмите, чтобы открыть";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';
        if (rouletteTrackCaseDiv) rouletteTrackCaseDiv.innerHTML = ''; // Очищаем предыдущую рулетку

        isCaseOpeningInProgress = false; // Сбрасываем флаг
        if (openActualCaseBtn) openActualCaseBtn.disabled = false; // Кнопка активна

        if (currentProfileData.balance < cost) {
            if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = 'block';
            if (openActualCaseBtn) openActualCaseBtn.disabled = true;
        } else {
            if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = 'none';
        }
    }
    
    let isCaseOpeningInProgress = false; // Флаг, что анимация/открытие идет

    function populateRouletteTrack(trackElement, prizesForAnimation = [], repetitions = 6) {
        trackElement.innerHTML = ''; // Очищаем
        if (!prizesForAnimation || prizesForAnimation.length === 0) {
            prizesForAnimation = [{'emoji':'❓','category':'UNKNOWN'}]; // Заглушка, если нет призов
        }
        
        let fullSetOfEmojis = [];
        for (let i = 0; i < repetitions; i++) {
            // Убедимся, что prizesForAnimation - это массив объектов с emoji
            const emojisThisRep = prizesForAnimation.map(p => (typeof p === 'object' && p.emoji) ? p.emoji : '❓');
            fullSetOfEmojis.push(...emojisThisRep);
        }

        // Добавляем еще элементы в начало и конец для "бесконечной" прокрутки
        const viewportVisibleItemsRoughly = 5; // Примерно сколько видно в viewport
        const leadingTrailingCount = Math.max(viewportVisibleItemsRoughly, Math.floor(prizesForAnimation.length / 2));
        
        const leadingItems = fullSetOfEmojis.slice(-leadingTrailingCount);
        const trailingItems = fullSetOfEmojis.slice(0, leadingTrailingCount);
        
        const finalTrackEmojis = [...leadingItems, ...fullSetOfEmojis, ...trailingItems];

        finalTrackEmojis.forEach(emoji => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('roulette-item');
            itemDiv.textContent = emoji;
            trackElement.appendChild(itemDiv);
        });
        return finalTrackEmojis; // Возвращаем массив эмодзи для определения индекса остановки
    }


    async function startCaseRouletteAnimation() {
        if (!rouletteTrackCaseDiv || !currentCaseDataForOpening || isCaseOpeningInProgress) return;
        
        isCaseOpeningInProgress = true;
        if (openActualCaseBtn) openActualCaseBtn.disabled = true; // Блокируем кнопку

        const prizesForAnim = currentCaseDataForOpening.prizesForAnimation;
        if (!prizesForAnim || prizesForAnim.length === 0) {
            showErrorInApp("Нет призов для анимации кейса!");
            isCaseOpeningInProgress = false;
            if (openActualCaseBtn) openActualCaseBtn.disabled = (currentProfileData.balance < currentCaseDataForOpening.cost);
            return;
        }
        
        const fullTrackEmojis = populateRouletteTrack(rouletteTrackCaseDiv, prizesForAnim);
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Крутится...";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';

        const itemWidth = 80; // Должно совпадать с CSS (min-width .roulette-item)
        const viewportWidth = rouletteTrackCaseDiv.parentElement.clientWidth; // Ширина видимой части

        // Начальное смещение, чтобы указатель был не на первом элементе
        const initialOffsetIndex = Math.floor(prizesForAnim.length / 2) + 3; // Примерно
        const initialTranslateX = -(initialOffsetIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));
        
        rouletteTrackCaseDiv.style.transition = 'none'; // Убираем анимацию для начальной установки
        rouletteTrackCaseDiv.style.transform = `translateX(${initialTranslateX}px)`;

        // "Визуальный" выигрыш для анимации (случайный из доступных эмодзи)
        const visualWinEmoji = prizesForAnim[Math.floor(Math.random() * prizesForAnim.length)].emoji;

        // Ищем индекс этого эмодзи ближе к концу трека (для эффекта прокрутки)
        // Ищем в "основной" части трека (не в добавленных head/tail)
        const mainTrackPartStart = Math.max(5, Math.floor(prizesForAnim.length / 2)); // Индекс начала основной части
        const mainTrackPartEnd = fullTrackEmojis.length - Math.max(5, Math.floor(prizesForAnimation.length / 2));
        let targetStopOverallIndex = -1;

        // Ищем с конца основной части, чтобы анимация выглядела длиннее
        for (let i = mainTrackPartEnd - 1; i >= mainTrackPartStart + prizesForAnim.length; i--) { 
            if (fullTrackEmojis[i] === visualWinEmoji) {
                targetStopOverallIndex = i;
                break;
            }
        }
        // Если не нашли (очень маловероятно), берем случайный из последней трети основной части
        if (targetStopOverallIndex === -1) {
             const searchStartIndex = Math.max(mainTrackPartStart, Math.floor(mainTrackPartEnd * 0.66));
             const tempIndex = fullTrackEmojis.slice(searchStartIndex, mainTrackPartEnd).indexOf(visualWinEmoji);
             if (tempIndex !== -1) targetStopOverallIndex = searchStartIndex + tempIndex;
             else targetStopOverallIndex = mainTrackPartEnd - Math.floor(Math.random() * prizesForAnim.length) -1;
        }
        
        // Рассчитываем финальную позицию X, чтобы targetStopOverallIndex оказался под указателем
        const finalPositionX = -(targetStopOverallIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));

        // Небольшая задержка перед началом основной анимации
        await new Promise(resolve => setTimeout(resolve, 100));

        const animationDuration = 4000 + Math.random() * 1500; // 4-5.5 секунд
        rouletteTrackCaseDiv.style.transition = `transform ${animationDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`;
        rouletteTrackCaseDiv.style.transform = `translateX(${finalPositionX}px)`;

        // После завершения анимации
        setTimeout(() => {
            if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Удача!";
            if (visualPrizeTextCaseP) {
                visualPrizeTextCaseP.textContent = `Похоже, это: ${visualWinEmoji}`;
                visualPrizeTextCaseP.style.display = 'block';
            }
            
            // Отправляем запрос боту на реальное открытие кейса
            requestDataFromBot({
                action: 'open_case_request', // Важно: имя action как на бэкенде
                userId: currentUserId, // userId уже есть в requestDataFromBot
                caseKey: currentCaseDataForOpening.key
            });
            
            // Не разблокируем кнопку и не меняем состояние - ждем ответа от бота в чат.
            // WebApp можно закрыть через некоторое время, чтобы пользователь увидел результат в чате.
            tg.HapticFeedback.impactOccurred('medium'); // Виброотклик

            setTimeout(() => { 
                 if (tg && tg.close) tg.close();
            }, 2000); // Закрываем WebApp через 2 секунды после анимации

        }, animationDuration + 150); // +150ms на завершение CSS transition
    }

    if (openActualCaseBtn) {
        openActualCaseBtn.addEventListener('click', startCaseRouletteAnimation);
    }

    // --- Обработчики для кнопок на других экранах ---
    if (activatePromocodeBtn) {
        activatePromocodeBtn.addEventListener('click', () => {
            const code = promocodeInput.value.trim();
            if (code) {
                requestDataFromBot({
                    action: 'activate_promo_webapp',
                    promoCode: code
                });
                promocodeInput.value = ''; // Очищаем поле
                tg.showAlert(`Промокод "${code}" отправлен на проверку. Результат будет в чате.`);
                // Результат придет в чат, баланс в WebApp обновится при следующем запуске
            } else {
                tg.showAlert("Введите промокод!");
            }
        });
    }

    if (getReferralLinkBtn) {
        getReferralLinkBtn.addEventListener('click', () => {
            if (referralInfoBlock) {
                referralInfoBlock.style.display = referralInfoBlock.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    // Кнопки пополнения - просто отправляют запрос боту
    if (depositTgStarsWebappBtn) {
        depositTgStarsWebappBtn.addEventListener('click', () => {
            requestDataFromBot({ action: 'request_deposit_options_webapp' });
            tg.showAlert("Запрос на пополнение через Telegram Stars отправлен. Следуйте инструкциям в чате с ботом.");
            // tg.close(); // Можно закрыть WebApp
        });
    }
    if (depositManualWebappBtn) {
        depositManualWebappBtn.addEventListener('click', () => {
            requestDataFromBot({ action: 'request_deposit_options_webapp' });
            tg.showAlert("Запрос на пополнение через TON/Crypto отправлен. Следуйте инструкциям в чате с ботом.");
            // tg.close();
        });
    }
    
    // Кнопка Ставки
    if (playStakesWebappBtn) {
        playStakesWebappBtn.addEventListener('click', () => {
            requestDataFromBot({ action: 'request_stakes_interface_webapp' });
            tg.showAlert("Для игры в Ставки следуйте инструкциям в чате с ботом.");
            // tg.close();
        });
    }
    
    // --- Общая функция для отправки данных боту ---
    function requestDataFromBot(data) {
        if (!tg || !currentUserId) {
            showErrorInApp("Не могу отправить данные: нет ID пользователя или Telegram API.");
            return;
        }
        // userId уже должен быть в data при вызове, или добавляем его здесь
        const dataToSend = JSON.stringify({
            userId: currentUserId, // Гарантируем, что userId всегда есть
            ...data 
        });
        console.log("Sending to bot:", dataToSend);
        try {
            tg.sendData(dataToSend);
        } catch (e) {
            console.error("Error in tg.sendData:", e);
            showErrorInApp("Ошибка отправки данных на сервер. Попробуйте позже.");
        }
    }

    // --- Инициализация приложения ---
    try {
        initializeApp();
    } catch (e) {
        console.error("Fatal error during initialization:", e);
        showErrorInApp("Произошла критическая ошибка при запуске приложения. Пожалуйста, попробуйте перезапустить его через команду /app или /start.");
        hideInitialLoading();
    }
});
