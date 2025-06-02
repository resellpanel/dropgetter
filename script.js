// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Элементы UI
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

    let userId = null;
    let caseKey = null;
    let caseCost = 0;
    let balance = 0;
    let caseName = 'Неизвестный кейс';
    let caseEmoji = '❓';

    function showState(stateId) {
        ['loading-state', 'error-state', 'case-display-state', 'opening-state'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (id === stateId) ? 'block' : 'none';
        });
    }

    function showError(message) {
        if (errorMessageP) errorMessageP.textContent = message;
        showState('error-state');
    }

    if (tg) {
        tg.ready();
        tg.expand(); // Развернуть WebApp на весь экран

        // Настройка темы
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#f0f0f0';
        document.body.style.color = tg.themeParams.text_color || '#000000';
        // Можно также применить tg.themeParams.secondary_bg_color к .container и т.д.

        // Получение данных
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

        if (!userId && pUserIdFromUrl) userId = pUserIdFromUrl;

        if (pCaseKey && pCaseCost && pBalance) {
            caseCost = parseInt(pCaseCost, 10);
            balance = parseInt(pBalance, 10);
            if (pCaseName) caseName = decodeURIComponent(pCaseName);
            if (pCaseEmoji) caseEmoji = decodeURIComponent(pCaseEmoji);

            // Обновление UI
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
            showError("Ошибка: Необходимые данные для открытия кейса отсутствуют в URL.");
        }

        // Обработчик основной кнопки действия (если она нужна)
        // tg.MainButton.setText(`Открыть за ${caseCost} ⭐`);
        // tg.MainButton.onClick(() => handleOpenCase());
        // if (caseKey && caseCost && balance >= caseCost) {
        //     tg.MainButton.show();
        // } else {
        //     tg.MainButton.hide();
        // }

    } else {
        console.error("Telegram WebApp API не найдено.");
        showError("Ошибка: Не удалось инициализировать приложение Telegram. Попробуйте открыть в Telegram.");
    }

    function handleOpenCase() {
        if (!tg) { alert("Ошибка Telegram API"); return; }
        if (!caseKey || userId === null || caseCost === 0 || balance === 0) { // Проверка на 0 тоже
            alert("Ошибка: Данные неполные."); return;
        }
        if (balance < caseCost) {
            alert(`Недостаточно средств!`); return;
        }

        showState('opening-state');
        // tg.MainButton.showProgress(); // Показать прогресс на основной кнопке
        if (openCaseBtn) openCaseBtn.disabled = true;


        const dataToSend = JSON.stringify({
            action: 'open_case',
            userId: userId,
            caseKey: caseKey,
        });

        tg.sendData(dataToSend);
        
        // Можно добавить небольшую задержку перед закрытием, чтобы пользователь увидел "Открываем..."
        // setTimeout(() => {
        //    tg.close();
        // }, 1500);
        // Или просто ждать, пока бот сам закроет или пользователь нажмет кнопку назад в Telegram
    }

    if (openCaseBtn) {
        openCaseBtn.addEventListener('click', handleOpenCase);
    }
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', () => {
            if(tg) tg.close();
        });
    }
});