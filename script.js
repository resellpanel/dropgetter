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
    const visualPrizeText = document.getElementById('visual-prize-text');


    let userId = null;
    let caseKey = null;
    let caseCost = 0;
    let balance = 0;
    let caseName = 'Неизвестный кейс';
    let caseEmoji = '❓';
    let possiblePrizes = ['⭐', '💣', '🎁', '❓', '💎', '🍀', '✨']; // Дефолтные, если из URL не придут

    function showState(stateId) {
        ['loading-state', 'error-state', 'case-display-state', 'opening-state'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = (id === stateId) ? 'flex' : 'none';
                 // Для корректного отображения flex-направления
                if (id === stateId) {
                     el.style.flexDirection = 'column';
                     el.style.alignItems = 'center';
                     el.style.justifyContent = 'center';
                }
            }
        });
        // Для состояния display, кнопка может быть не по центру, если описание длинное
        if (stateId === 'case-display-state' && caseDisplayStateDiv) {
             caseDisplayStateDiv.style.justifyContent = 'space-around';
        }
    }

    function showError(message, autoClose = false) {
        if (errorMessageP) errorMessageP.textContent = message;
        showState('error-state');
        if (autoClose && tg) {
            setTimeout(() => tg.close(), 2500);
        }
    }
    
    showState('loading-state'); // Показываем загрузку по умолчанию

    if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#FFC107'); // Пример установки цвета шапки
        // tg.setBackgroundColor(tg.themeParams.bg_color || '#FFF9C4'); // Установка цвета фона WebApp


        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userId = tg.initDataUnsafe.user.id?.toString();
        }

        const queryParams = new URLSearchParams(window.location.search);
        console.log("Raw Query Params:", window.location.search);

        const pUserIdFromUrl = queryParams.get('userId');
        if (!userId && pUserIdFromUrl) userId = pUserIdFromUrl;

        caseKey = queryParams.get('caseKey');
        const pCaseCost = queryParams.get('caseCost');
        const pBalance = queryParams.get('balance');
        const pCaseName = queryParams.get('caseName');
        const pCaseEmoji = queryParams.get('caseEmoji');
        const prizesParam = queryParams.get('prizes');

        console.log("Parsed Params:", { userId, caseKey, pCaseCost, pBalance, pCaseName, pCaseEmoji, prizesParam});


        if (prizesParam) {
            try {
                let decodedPrizes = decodeURIComponent(prizesParam);
                possiblePrizes = JSON.parse(decodedPrizes);
                if (!Array.isArray(possiblePrizes) || possiblePrizes.length === 0) {
                    console.warn("Prizes data from URL is invalid or empty, using defaults.");
                    possiblePrizes = ['⭐', '💣', '🎁', '❓', '💎', '🍀', '✨'];
                }
            } catch (e) {
                console.error("Error parsing prizes data:", e, "Raw prizes param:", prizesParam);
                showError("Ошибка данных призов для анимации.", true);
                return; // Прерываем выполнение, если призы критичны
            }
        } else {
             console.warn("Prizes data not found in URL, using defaults for animation.");
        }


        if (userId && caseKey && pCaseCost !== null && pBalance !== null) {
            caseCost = parseInt(pCaseCost, 10);
            balance = parseInt(pBalance, 10);

            if (isNaN(caseCost) || isNaN(balance)) {
                showError("Ошибка: некорректные числовые данные (стоимость или баланс).", true);
                return;
            }

            caseName = pCaseName ? decodeURIComponent(pCaseName) : 'Кейс';
            caseEmoji = pCaseEmoji ? decodeURIComponent(pCaseEmoji) : '❓';

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
            console.error("One or more critical parameters are missing:", { userId, caseKey, pCaseCost, pBalance });
            showError("Ошибка: Необходимые данные для отображения кейса отсутствуют.", true);
        }

    } else {
        console.error("Telegram WebApp API не найдено.");
        showError("Ошибка: Не удалось инициализировать приложение. Попробуйте открыть в Telegram.", true);
    }

    function populateRouletteTrack(trackElement, prizesArray) {
        if (!trackElement) return;
        trackElement.innerHTML = ''; // Очищаем

        const repetitionFactor = 30; // Больше для более длинной и плавной прокрутки
        let fullTrackItems = [];
        for (let i = 0; i < repetitionFactor; i++) {
            let shuffledPrizes = [...prizesArray].sort(() => 0.5 - Math.random());
            fullTrackItems = fullTrackItems.concat(shuffledPrizes);
        }

        fullTrackItems.forEach(prizeEmoji => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('roulette-item');
            itemDiv.textContent = prizeEmoji;
            trackElement.appendChild(itemDiv);
        });
        return fullTrackItems; // Возвращаем для возможного использования
    }

    async function startRouletteAnimation() {
        if (!rouletteTrack || possiblePrizes.length === 0) {
            showError("Ошибка анимации: нет данных о призах.", true);
            return;
        }

        const fullTrackItems = populateRouletteTrack(rouletteTrack, possiblePrizes);
        if (openingStatusText) openingStatusText.textContent = "Крутим барабаны...";
        if (visualPrizeText) visualPrizeText.style.display = 'none';


        const itemWidth = 70; // Ширина из CSS .roulette-item
        const viewportWidth = rouletteTrack.parentElement.clientWidth; // Ширина видимой области

        // Начальное "быстрое" смещение, чтобы рулетка не начиналась с самого края
        const initialOffset = (fullTrackItems.length / 2 - 5) * itemWidth; // Начнем примерно с середины
        rouletteTrack.style.transition = 'none';
        rouletteTrack.style.transform = `translateX(-${initialOffset}px)`;

        // Выбираем случайный "визуальный" приз
        const visualWinIndexInOriginalSet = Math.floor(Math.random() * possiblePrizes.length);
        const visualWinEmoji = possiblePrizes[visualWinIndexInOriginalSet];

        // Находим индекс этого приза ближе к концу трека для красивой остановки
        // Ищем с конца (например, в последних 3-х повторениях набора)
        let targetStopOverallIndex = -1;
        for (let i = fullTrackItems.length - 1; i >= fullTrackItems.length - (possiblePrizes.length * 3); i--) {
            if (fullTrackItems[i] === visualWinEmoji) {
                targetStopOverallIndex = i;
                break;
            }
        }
        if (targetStopOverallIndex === -1) { // Если вдруг не нашли, берем случайный из последних
            targetStopOverallIndex = fullTrackItems.length - Math.floor(possiblePrizes.length * 1.5) + visualWinIndexInOriginalSet;
        }
        
        // Вычисляем позицию X для остановки так, чтобы targetStopOverallIndex был по центру указателя
        const finalPositionX = -(targetStopOverallIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));

        // Даем браузеру время применить начальное смещение
        await new Promise(resolve => setTimeout(resolve, 50));

        const animationDuration = 5000 + Math.random() * 1500; // 5 - 6.5 секунд
        rouletteTrack.style.transition = `transform ${animationDuration}ms cubic-bezier(0.2, 0.9, 0.3, 1.0)`; // Более плавная кривая
        rouletteTrack.style.transform = `translateX(${finalPositionX}px)`;

        setTimeout(() => {
            if (openingStatusText) openingStatusText.textContent = "Удача улыбнулась!";
            if (visualPrizeText) {
                visualPrizeText.textContent = `Похоже, это: ${visualWinEmoji}`;
                visualPrizeText.style.display = 'block';
            }
            
            const dataToSend = JSON.stringify({
                action: 'open_case',
                userId: userId, // Убедитесь, что userId определен глобально или передан
                caseKey: caseKey, // Убедитесь, что caseKey определен
            });
            tg.sendData(dataToSend);
            
             setTimeout(() => {
                if(tg) tg.close();
             }, 2000); // Даем 2 секунды на просмотр и закрываем

        }, animationDuration + 100); // +100ms на завершение
    }

    function handleOpenCase() {
        if (!tg) { showError("Ошибка Telegram API", true); return; }
        if (!caseKey || userId === null || typeof caseCost !== 'number' || typeof balance !== 'number' ) {
            showError("Ошибка: Данные для открытия кейса неполные или некорректны.", true); return;
        }
        if (balance < caseCost) {
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            // Сообщение о недостатке средств уже должно быть видимо
            return;
        }

        showState('opening-state');
        if (openCaseBtn) openCaseBtn.disabled = true;
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy'); // Сильнее вибрация

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

    // Применение темы Telegram при загрузке
    if (tg && tg.themeParams) {
        const root = document.documentElement;
        const themeMappings = {
            'bg_color': '--body-bg',
            'text_color': '--main-text',
            'hint_color': '--hint-text',
            'link_color': '--link-color',
            'button_color': '--button-bg',
            'button_text_color': '--button-text',
            'secondary_bg_color': '--container-bg-tg' // Для фона контейнера, если он должен отличаться от body
        };
        for (const key in tg.themeParams) {
            if (Object.hasOwnProperty.call(tg.themeParams, key) && themeMappings[key]) {
                root.style.setProperty(themeMappings[key], tg.themeParams[key]);
            }
        }
        // Если вы хотите, чтобы цвета из style.css были дефолтными, а тема ТГ их переопределяла,
        // то в CSS нужно использовать эти --tg-theme-* переменные вместо ваших --primary-yellow и т.д.
        // Либо наоборот, если ваши кастомные цвета приоритетнее, то не устанавливать их здесь или делать это с проверкой.
        // Для примера, сейчас я оставляю ваши кастомные цвета в CSS, а тема ТГ может их переопределить, если CSS переменные используются в стилях.
        // Чтобы это работало, ваш CSS должен использовать переменные типа var(--tg-theme-bg-color)
    }
});
