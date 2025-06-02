// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    const loadingStateDiv = document.getElementById('loading-state');
    const errorStateDiv = document.getElementById('error-state');
    const errorMessageP = document.getElementById('error-message');
    const closeErrorBtn = document.getElementById('close-error-btn');
    const caseDisplayStateDiv = document.getElementById('case-display-state');
    const caseEmojiDiv = document.getElementById('case-emoji');
    const caseNameH1 = document.getElementById('case-name');
    const caseCostSpan = document.getElementById('case-cost');
    const userBalanceSpan = document.getElementById('user-balance');
    const notEnoughFundsP = document.getElementById('not-enough-funds');
    const openCaseBtn = document.getElementById('open-case-btn');
    const openBtnCostSpan = document.getElementById('open-btn-cost');
    const openingStateDiv = document.getElementById('opening-state');
    const rouletteTrack = document.querySelector('.roulette-track');
    const openingStatusText = document.getElementById('opening-status-text');

    let userId = null;
    let caseKey = null;
    let caseCost = 0;
    let balance = 0;
    let caseName = 'Неизвестный кейс';
    let caseEmoji = '❓';
    let possiblePrizes = ['⭐', '💣', '🎁', '❓']; // Дефолтные призы для анимации

    function showState(stateId) {
        ['loading-state', 'error-state', 'case-display-state', 'opening-state'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (id === stateId) ? 'flex' : 'none'; // Используем flex для центрирования
            if (id === stateId && el) { // Добавим flex-direction для некоторых
                if (id === 'loading-state' || id === 'opening-state' || id === 'error-state') {
                    el.style.flexDirection = 'column';
                }
            }
        });
    }

    function showError(message) {
        if (errorMessageP) errorMessageP.textContent = message;
        showState('error-state');
    }

    if (tg) {
        tg.ready();
        tg.expand();
        // document.body.style.backgroundColor = tg.themeParams.bg_color || '#FFF8E1'; // Используем CSS переменные
        // document.body.style.color = tg.themeParams.text_color || '#4A3B00';
        // document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#FFF8E1');
        // document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#4A3B00');
        // document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#B0A070');
        // document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#D4AF37');
        // document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#FFC107');
        // document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#4A3B00');
        // document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || 'rgba(255, 243, 200, 0.7)');


        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userId = tg.initDataUnsafe.user.id?.toString();
        }

        const queryParams = new URLSearchParams(window.location.search);
        caseKey = queryParams.get('caseKey');
        const pCaseCost = queryParams.get('caseCost');
        const pBalance = queryParams.get('balance');
        const pCaseName = queryParams.get('caseName');
        const pCaseEmoji = queryParams.get('caseEmoji');
        const pUserIdFromUrl = queryParams.get('userId');
        const prizesParam = queryParams.get('prizes');

        if (!userId && pUserIdFromUrl) userId = pUserIdFromUrl;

        if (prizesParam) {
            try {
                possiblePrizes = JSON.parse(decodeURIComponent(prizesParam));
                if (!Array.isArray(possiblePrizes) || possiblePrizes.length === 0) {
                    possiblePrizes = ['⭐', '💣', '🎁', '❓', '💎', '🍀'];
                }
            } catch (e) {
                console.error("Error parsing prizes data:", e);
                showError("Ошибка загрузки данных о призах для анимации.");
            }
        }


        if (caseKey && pCaseCost !== null && pBalance !== null && userId) {
            caseCost = parseInt(pCaseCost, 10);
            balance = parseInt(pBalance, 10);
            if (pCaseName) caseName = decodeURIComponent(pCaseName);
            if (pCaseEmoji) caseEmoji = decodeURIComponent(pCaseEmoji);

            if (caseEmojiDiv) caseEmojiDiv.textContent = caseEmoji;
            if (caseNameH1) caseNameH1.textContent = caseName;
            if (caseCostSpan) caseCostSpan.textContent = caseCost.toString();
            if (userBalanceSpan) userBalanceSpan.textContent = balance.toString();
            if (openBtnCostSpan) openBtnCostSpan.textContent = caseCost.toString();

            if (balance < caseCost) {
                if (notEnoughFundsP) notEnoughFundsP.style.display = 'block';
                if (openCaseBtn) openCaseBtn.disabled = true;
            } else {
                 if (notEnoughFundsP) notEnoughFundsP.style.display = 'none';
                 if (openCaseBtn) openCaseBtn.disabled = false;
            }
            showState('case-display-state');
        } else {
            console.error("Missing data:", {caseKey, pCaseCost, pBalance, userId});
            showError("Ошибка: Необходимые данные для открытия кейса отсутствуют.");
        }

    } else {
        console.error("Telegram WebApp API не найдено.");
        showError("Ошибка: Не удалось инициализировать приложение Telegram. Попробуйте открыть в Telegram.");
    }

    function populateRouletteTrack() {
        if (!rouletteTrack) return;
        rouletteTrack.innerHTML = '';

        const repetitionFactor = 20; // Больше повторений для длинной ленты
        let fullTrackItems = [];
        for (let i = 0; i < repetitionFactor; i++) {
            let shuffledPrizes = [...possiblePrizes].sort(() => 0.5 - Math.random());
            fullTrackItems = fullTrackItems.concat(shuffledPrizes);
        }

        fullTrackItems.forEach(prizeEmoji => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('roulette-item');
            itemDiv.textContent = prizeEmoji;
            rouletteTrack.appendChild(itemDiv);
        });
    }

    async function startRouletteAnimation() {
        if (!rouletteTrack || possiblePrizes.length === 0) return;

        populateRouletteTrack();
        if (openingStatusText) openingStatusText.textContent = "Крутим барабаны...";

        const itemWidth = 70; // Ширина из CSS
        const itemsInTrack = rouletteTrack.children.length;
        const viewportWidth = rouletteTrack.parentElement.clientWidth;

        rouletteTrack.style.transition = 'none';
        rouletteTrack.style.transform = `translateX(0px)`; // Начальное положение

        // Целевой элемент для ВИЗУАЛЬНОЙ остановки
        // Пусть это будет элемент где-то во второй половине трека, но не у самого конца
        const targetStopIndex = Math.floor(itemsInTrack * 0.75) + Math.floor(Math.random() * (possiblePrizes.length * 2));
        const finalPositionX = -(targetStopIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));

        // Быстрая прокрутка в начало анимации (чтобы не было видно старта с 0px)
        const initialFastScroll = -(itemsInTrack * itemWidth * 0.3); // Прокрутим на 30% трека
        rouletteTrack.style.transform = `translateX(${initialFastScroll}px)`;


        await new Promise(resolve => setTimeout(resolve, 50)); // Короткая пауза

        // Основная анимация
        const animationDuration = 5000 + Math.random() * 1000; // 5-6 секунд
        rouletteTrack.style.transition = `transform ${animationDuration}ms cubic-bezier(0.2, 0.8, 0.25, 1)`;
        rouletteTrack.style.transform = `translateX(${finalPositionX}px)`;

        setTimeout(() => {
            if (openingStatusText) openingStatusText.textContent = "Результат получен!";
            
            const dataToSend = JSON.stringify({
                action: 'open_case',
                userId: userId,
                caseKey: caseKey,
            });
            tg.sendData(dataToSend);
            
            // Закрываем WebApp через некоторое время, чтобы пользователь увидел результат анимации
             setTimeout(() => {
                if(tg) tg.close();
             }, 1500); // Даем время на просмотр и закрываем

        }, animationDuration + 200); // +200ms на всякий случай
    }

    function handleOpenCase() {
        if (!tg) { showError("Ошибка Telegram API"); return; }
        if (!caseKey || userId === null || caseCost === undefined || balance === undefined ) { // caseCost может быть 0
            showError("Ошибка: Данные для открытия кейса неполные."); return;
        }
        if (balance < caseCost) {
            // Сообщение уже показывается, но можно добавить вибрацию
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        showState('opening-state');
        if (openCaseBtn) openCaseBtn.disabled = true;
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

        startRouletteAnimation();
    }

    if (openCaseBtn) {
        openCaseBtn.addEventListener('click', handleOpenCase);
    }
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', () => {
            if(tg) tg.close();
        });
    }

    // Устанавливаем CSS переменные из темы Telegram, если они есть
    if (tg && tg.themeParams) {
        const root = document.documentElement;
        for (const key in tg.themeParams) {
            if (Object.hasOwnProperty.call(tg.themeParams, key)) {
                // Преобразуем ключи типа 'bg_color' в '--tg-theme-bg-color'
                const cssVarName = `--tg-theme-${key.replace(/_/g, '-')}`;
                root.style.setProperty(cssVarName, tg.themeParams[key]);
            }
        }
    }
});
