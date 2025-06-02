// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // --- Элементы UI ---
    const appBalanceSpan = document.getElementById('app-balance');
    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-button');
    const initialLoadingScreen = document.getElementById('initial-loading-screen');
    
    // Экраны
    const gamesScreen = document.getElementById('games-screen');
    const caseOpeningScreen = document.getElementById('case-opening-screen');
    const profileScreen = document.getElementById('profile-screen');
    const depositScreen = document.getElementById('deposit-screen');
    const stakesScreen = document.getElementById('stakes-game-screen'); // Новый экран ставок

    // Кейсы
    const caseEmojiOpenDiv = document.getElementById('case-emoji-open');
    const caseNameOpenH2 = document.getElementById('case-name-open');
    const caseCostOpenSpan = document.getElementById('case-cost-open');
    const userBalanceOpenSpan = document.getElementById('user-balance-open'); // Баланс на экране кейса
    const notEnoughFundsOpenP = document.getElementById('not-enough-funds-open');
    const openActualCaseBtn = document.getElementById('open-actual-case-btn');
    const openingStatusTextCaseP = document.getElementById('opening-status-text-case');
    const rouletteTrackCaseDiv = caseOpeningScreen.querySelector('.roulette-track-case'); // Уточняем поиск
    const visualPrizeTextCaseP = document.getElementById('visual-prize-text-case');
    const casesListContainer = document.getElementById('cases-list-container');
    const backToGamesBtnFromCase = document.getElementById('back-to-games-from-case-btn');

    // Профиль
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
    const helpInfoBlock = document.getElementById('help-info-block'); // Для помощи
    const showHelpBtn = document.getElementById('show-help-btn'); // Кнопка для помощи


    // Пополнение
    const depositTgStarsWebappBtn = document.getElementById('deposit-tg-stars-webapp-btn');
    const depositManualWebappBtn = document.getElementById('deposit-manual-webapp-btn');
    
    // Ставки (новый экран)
    const playStakesWebappBtn = document.getElementById('play-stakes-webapp-btn'); // Кнопка перехода на экран ставок
    const userBalanceStakesSpan = document.getElementById('user-balance-stakes');
    const stakesBetAmountInput = document.getElementById('stakes-bet-amount');
    const confirmStakesBetBtn = document.getElementById('confirm-stakes-bet-btn');
    const stakesResultTextP = document.getElementById('stakes-result-text');
    const stakesAnimationContainer = document.getElementById('stakes-animation-container'); // Для анимации слотов
    const slotEmojiSpans = [ // Элементы для эмодзи слотов
        document.getElementById('slot-emoji-1'),
        document.getElementById('slot-emoji-2'),
        document.getElementById('slot-emoji-3'),
    ];
    const minBetStakesInfo = document.getElementById('min-bet-stakes-info'); // Отображение мин. ставки
    const backToGamesBtnFromStakes = document.getElementById('back-to-games-from-stakes-btn');


    // --- Глобальные переменные ---
    let currentUserId = null;
    let currentProfileData = {}; 
    let currentFetchedGameCases = []; 
    let currentCaseDataForOpening = null;
    let isGameInProgress = false; // Общий флаг для блокировки UI во время игры

    const DEFAULT_MIN_BET_STAKES = 10; // Заглушка, если не придет из profileData

    // --- Инициализация ---
    function initializeApp() {
        if (!tg) {
            showErrorInApp("Telegram API не найдено. Пожалуйста, откройте в Telegram.");
            hideInitialLoading(); return;
        }
        tg.ready(); tg.expand(); applyTheme();
        tg.BackButton.onClick(() => navigateToScreen('games-screen')); // Глобальная кнопка назад ТГ

        const params = new URLSearchParams(window.location.search);
        currentUserId = params.get('userId');
        const profileDataStr = params.get('profileData');
        const gameCasesStr = params.get('gameCases');
        const entrypoint = params.get('entrypoint') || 'main_hub';

        if (!currentUserId) {
            showErrorInApp("Критическая ошибка: ID пользователя не передан.");
            hideInitialLoading(); return;
        }

        if (profileDataStr) {
            try {
                currentProfileData = JSON.parse(decodeURIComponent(profileDataStr));
                updateAppBalance(currentProfileData.balance || 0);
                renderProfileData(currentProfileData);
                if(minBetStakesInfo) minBetStakesInfo.textContent = currentProfileData.minBetStakes || DEFAULT_MIN_BET_STAKES;

            } catch (e) { console.error("Error parsing profileData:", e); showErrorInApp("Ошибка данных профиля."); }
        } else { console.warn("profileData not in URL."); showErrorInApp("Данные профиля не загружены."); }

        if (gameCasesStr) {
            try {
                currentFetchedGameCases = JSON.parse(decodeURIComponent(gameCasesStr));
                renderCasesList(currentFetchedGameCases);
            } catch (e) { console.error("Error parsing gameCases:", e); showErrorInApp("Ошибка списка кейсов."); }
        } else { console.warn("gameCases not in URL."); if(casesListContainer) casesListContainer.innerHTML = '<p>Кейсы не загружены.</p>';}
        
        if (entrypoint === 'case_open') {
            const caseKey = params.get('caseKey');
            const targetCase = currentFetchedGameCases.find(c => c.key === caseKey) || 
                                (params.get('caseName') ? { // Запасной вариант, если кейса нет в общем списке
                                    key: caseKey, name: decodeURIComponent(params.get('caseName')), emoji: decodeURIComponent(params.get('caseEmoji') || '❓'),
                                    cost: parseInt(params.get('caseCost') || 0, 10),
                                    prizesForAnimation: JSON.parse(decodeURIComponent(params.get('prizesForAnimation') || '[{"emoji":"?"}]'))
                                } : null);
            if (targetCase) {
                currentCaseDataForOpening = targetCase;
                setupCaseOpeningScreen(); navigateToScreen('case-opening-screen');
            } else { showErrorInApp("Не удалось загрузить данные кейса."); navigateToScreen('games-screen'); }
        } else { navigateToScreen('games-screen'); }
        hideInitialLoading();
    }

    function applyTheme() {
        if (tg && tg.themeParams) {
            const r = document.documentElement.style;
            if (tg.themeParams.bg_color) r.setProperty('--main-bg', tg.themeParams.bg_color);
            if (tg.themeParams.text_color) r.setProperty('--text-color-light', tg.themeParams.text_color);
            if (tg.themeParams.button_color) r.setProperty('--secondary-yellow-matte', tg.themeParams.button_color);
            if (tg.themeParams.button_text_color) r.setProperty('--text-color-dark', tg.themeParams.button_text_color);
            if (tg.themeParams.secondary_bg_color) r.setProperty('--container-bg', tg.themeParams.secondary_bg_color);
            try { tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#1c1c1e'); } catch(e){} // Темная шапка
        }
    }
    
    function updateAppBalance(newBalance) {
        if (typeof newBalance !== 'number' || isNaN(newBalance)) newBalance = 0;
        currentProfileData.balance = newBalance;
        if (appBalanceSpan) appBalanceSpan.textContent = newBalance;
        if (profileBalanceB) profileBalanceB.textContent = newBalance;
        if (userBalanceOpenSpan) userBalanceOpenSpan.textContent = newBalance;
        if (userBalanceStakesSpan) userBalanceStakesSpan.textContent = newBalance;
    }

    function hideInitialLoading() { if (initialLoadingScreen) initialLoadingScreen.style.display = 'none'; }
    function showErrorInApp(message) { console.error("WebApp Error:", message); tg.showAlert(message); }
    
    function navigateToScreen(screenId) {
        screens.forEach(s => s.classList.remove('active-screen'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active-screen');
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.targetscreen === screenId));
        
        if (screenId === 'case-opening-screen' || screenId === 'stakes-game-screen') {
            tg.BackButton.show(); // Показываем кнопку "Назад" ТГ
            navButtons.forEach(b => b.classList.remove('active')); // Деактивируем нижнюю навигацию
        } else {
            tg.BackButton.hide();
        }
    }

    navButtons.forEach(b => b.addEventListener('click', () => navigateToScreen(b.dataset.targetscreen)));
    if (backToGamesBtnFromCase) backToGamesBtnFromCase.addEventListener('click', () => navigateToScreen('games-screen'));
    if (backToGamesBtnFromStakes) backToGamesBtnFromStakes.addEventListener('click', () => navigateToScreen('games-screen'));
    
    // --- Отображение данных ---
    function renderProfileData(profile) {
        if (!profile) return;
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
        if (referralLinkHrefA) { referralLinkHrefA.href = profile.referralLink || '#'; referralLinkHrefA.textContent = profile.referralLink || 'Нет ссылки';}
        if (referralCountSpan) referralCountSpan.textContent = profile.referralsCount || 0;
        if (referralBonusSpan) referralBonusSpan.textContent = profile.referralBonus || 0;
        if (helpInfoBlock && profile.helpText) helpInfoBlock.innerHTML = profile.helpText.replace(/\n/g, '<br>');
    }

    function renderCasesList(cases) {
        if (!casesListContainer) return;
        casesListContainer.innerHTML = '';
        if (!cases || cases.length === 0) { casesListContainer.innerHTML = '<p>Доступных кейсов нет.</p>'; return; }
        cases.forEach(caseData => {
            const div = document.createElement('div');
            div.classList.add('case-item-webapp');
            div.innerHTML = `<span>${caseData.emoji} ${caseData.name}</span><span class="cost">${caseData.cost} ⭐</span>`;
            if (caseData.description) {
                const p = document.createElement('p');
                p.className = 'case-item-description-webapp'; p.textContent = caseData.description;
                div.appendChild(p);
            }
            div.addEventListener('click', () => { currentCaseDataForOpening = caseData; setupCaseOpeningScreen(); navigateToScreen('case-opening-screen'); });
            casesListContainer.appendChild(div);
        });
    }
    
    // --- Логика открытия кейса ---
    function setupCaseOpeningScreen() {
        if (!currentCaseDataForOpening) { showErrorInApp("Ошибка данных кейса."); navigateToScreen('games-screen'); return; }
        const { name, emoji, cost } = currentCaseDataForOpening;
        if (caseEmojiOpenDiv) caseEmojiOpenDiv.textContent = emoji;
        if (caseNameOpenH2) caseNameOpenH2.textContent = name;
        if (caseCostOpenSpan) caseCostOpenSpan.textContent = cost;
        if (userBalanceOpenSpan) userBalanceOpenSpan.textContent = currentProfileData.balance;
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Нажмите, чтобы открыть";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';
        if (rouletteTrackCaseDiv) rouletteTrackCaseDiv.innerHTML = '';
        isGameInProgress = false;
        if (openActualCaseBtn) openActualCaseBtn.disabled = (currentProfileData.balance < cost);
        if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = (currentProfileData.balance < cost) ? 'block' : 'none';
    }
    
    function populateRouletteTrack(trackEl, prizesAnim = [], reps = 7) {
        trackEl.innerHTML = '';
        if (!prizesAnim || prizesAnim.length === 0) prizesAnim = [{'emoji':'❓','category':'UNKNOWN'}];
        let fullEmojis = [];
        for (let i = 0; i < reps; i++) fullEmojis.push(...prizesAnim.map(p => (p.emoji || '❓')));
        const leadTrailCount = Math.max(5, Math.floor(prizesAnim.length * 0.7));
        const finalTrack = [...fullEmojis.slice(-leadTrailCount), ...fullEmojis, ...fullEmojis.slice(0, leadTrailCount)];
        finalTrack.forEach(e => { const d = document.createElement('div'); d.className = 'roulette-item'; d.textContent = e; trackEl.appendChild(d); });
        return finalTrack;
    }

    async function startCaseRouletteAnimation() {
        if (isGameInProgress || !rouletteTrackCaseDiv || !currentCaseDataForOpening) return;
        isGameInProgress = true;
        if (openActualCaseBtn) openActualCaseBtn.disabled = true;

        const prizesAnim = currentCaseDataForOpening.prizesForAnimation;
        if (!prizesAnim || prizesAnim.length === 0) {
            showErrorInApp("Нет призов для анимации!"); isGameInProgress = false; if (openActualCaseBtn) openActualCaseBtn.disabled = false; return;
        }
        
        const trackEmojis = populateRouletteTrack(rouletteTrackCaseDiv, prizesAnim);
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Открываем...";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';

        const itemW = 80; const viewportW = rouletteTrackCaseDiv.parentElement.clientWidth;
        const initialOffsetIdx = Math.floor(prizesAnim.length * 0.8); // Смещение для старта
        const initialTX = -(initialOffsetIdx * itemW - (viewportW / 2) + (itemW / 2));
        rouletteTrackCaseDiv.style.transition = 'none';
        rouletteTrackCaseDiv.style.transform = `translateX(${initialTX}px)`;

        const visualWinEmoji = prizesAnim[Math.floor(Math.random() * prizesAnim.length)].emoji;
        
        let targetStopIdx = -1;
        const searchStart = Math.max(prizesAnim.length, Math.floor(trackEmojis.length * 0.6)); // Искать ближе к концу
        for (let i = trackEmojis.length - prizesAnim.length - 5; i >= searchStart; i--) { // Ищем с конца, но не в самом хвосте
            if (trackEmojis[i] === visualWinEmoji) { targetStopIdx = i; break; }
        }
        if (targetStopIdx === -1) targetStopIdx = trackEmojis.length - prizesAnim.length - Math.floor(Math.random() * 3) - 3; // Запасной вариант

        const finalTX = -(targetStopIdx * itemW - (viewportW / 2) + (itemW / 2));
        await new Promise(r => setTimeout(r, 100));
        const animDur = 4500 + Math.random() * 1000;
        rouletteTrackCaseDiv.style.transition = `transform ${animDur}ms cubic-bezier(0.2, 0.8, 0.25, 1)`;
        rouletteTrackCaseDiv.style.transform = `translateX(${finalTX}px)`;

        setTimeout(() => {
            if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Готово!";
            if (visualPrizeTextCaseP) { visualPrizeTextCaseP.textContent = `Выпало (визуально): ${visualWinEmoji}`; visualPrizeTextCaseP.style.display = 'block';}
            
            requestDataFromBot({ action: 'open_case_request', caseKey: currentCaseDataForOpening.key });
            tg.HapticFeedback.impactOccurred('medium');
            tg.showAlert("Результат открытия кейса будет отправлен в чат с ботом.");
            setTimeout(() => { if (tg && tg.close) tg.close(); }, 2500); // Закрываем через 2.5с
            // isGameInProgress = false; // Не сбрасываем, т.к. WebApp закроется
        }, animDur + 150);
    }
    if (openActualCaseBtn) openActualCaseBtn.addEventListener('click', startCaseRouletteAnimation);

    // --- Логика Ставок (Stakes) ---
    function setupStakesScreen() {
        if (!stakesScreen.classList.contains('active-screen')) return; // Только если экран активен
        if (userBalanceStakesSpan) userBalanceStakesSpan.textContent = currentProfileData.balance || 0;
        if (stakesBetAmountInput) stakesBetAmountInput.value = '';
        if (stakesResultTextP) stakesResultTextP.textContent = 'Введите сумму и сделайте ставку!';
        if (stakesResultTextP) stakesResultTextP.style.color = 'var(--text-color-light)';
        slotEmojiSpans.forEach(s => { if(s) s.textContent = '❔'; });
        if (confirmStakesBetBtn) confirmStakesBetBtn.disabled = false;
        isGameInProgress = false;
    }

    async function playSlotsAnimation() {
        if (!stakesAnimationContainer || slotEmojiSpans.some(s => !s)) return; // Проверка наличия элементов
        const emojis = ["🎰", "🍒", "🍓", "🍊", "🍋", "🍉", "⭐", "💎", "🎁", "💔", "🍀", "🔔", "BAR", "❼"];
        let animFrame = 0;
        const maxFrames = 20 + Math.floor(Math.random() * 10); // 20-29 кадров

        return new Promise(resolve => {
            function animate() {
                slotEmojiSpans.forEach(span => span.textContent = emojis[Math.floor(Math.random() * emojis.length)]);
                animFrame++;
                if (animFrame < maxFrames) {
                    setTimeout(animate, 80 + animFrame * 2); // Замедление анимации
                } else {
                    // Финальные эмодзи (случайные, т.к. реальный результат придет от бота)
                    slotEmojiSpans.forEach(span => span.textContent = emojis[Math.floor(Math.random() * emojis.length)]);
                    resolve();
                }
            }
            animate();
        });
    }
    
    if (confirmStakesBetBtn) {
        confirmStakesBetBtn.addEventListener('click', async () => {
            if (isGameInProgress) return;
            const betAmount = parseInt(stakesBetAmountInput.value, 10);
            const minBet = currentProfileData.minBetStakes || DEFAULT_MIN_BET_STAKES;

            if (isNaN(betAmount) || betAmount < minBet) {
                if (stakesResultTextP) { stakesResultTextP.textContent = `Минимальная ставка: ${minBet} ⭐.`; stakesResultTextP.style.color = '#E74C3C';}
                tg.HapticFeedback.notificationOccurred('error'); return;
            }
            if (betAmount > currentProfileData.balance) {
                if (stakesResultTextP) { stakesResultTextP.textContent = "Недостаточно средств!"; stakesResultTextP.style.color = '#E74C3C';}
                tg.HapticFeedback.notificationOccurred('error'); return;
            }

            isGameInProgress = true;
            if (confirmStakesBetBtn) confirmStakesBetBtn.disabled = true;
            if (stakesResultTextP) stakesResultTextP.textContent = "Крутим барабаны...";
            tg.HapticFeedback.impactOccurred('light');

            await playSlotsAnimation();
            
            requestDataFromBot({ action: 'make_stake_request', betAmount: betAmount });
            if (stakesResultTextP) stakesResultTextP.textContent = "Ставка сделана!";
            tg.HapticFeedback.impactOccurred('medium');
            tg.showAlert(`Ваша ставка ${betAmount} ⭐ принята. Результат будет отправлен в чат с ботом.`);
            setTimeout(() => { if (tg && tg.close) tg.close(); }, 2000);
        });
    }
    
    // --- Обработчики других кнопок ---
    if (activatePromocodeBtn) {
        activatePromocodeBtn.addEventListener('click', () => {
            const code = promocodeInput.value.trim();
            if (code) {
                requestDataFromBot({ action: 'activate_promo_webapp', promoCode: code });
                promocodeInput.value = '';
                tg.showAlert(`Промокод "${code}" отправлен. Результат в чате.`);
            } else { tg.showAlert("Введите промокод!"); }
        });
    }

    if (getReferralLinkBtn) {
        getReferralLinkBtn.addEventListener('click', () => {
            if (referralInfoBlock) referralInfoBlock.style.display = referralInfoBlock.style.display === 'none' ? 'block' : 'none';
        });
    }
    if (showHelpBtn) { // Кнопка Помощь
        showHelpBtn.addEventListener('click', () => {
            if (helpInfoBlock) helpInfoBlock.style.display = helpInfoBlock.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (depositTgStarsWebappBtn) {
        depositTgStarsWebappBtn.addEventListener('click', () => {
            requestDataFromBot({ action: 'request_deposit_method', method: 'stars' });
            tg.showAlert("Для пополнения через Telegram Stars перейдите в чат с ботом.");
            // tg.close(); // Можно закрыть, чтобы пользователь сразу перешел в чат
        });
    }
    if (depositManualWebappBtn) {
        depositManualWebappBtn.addEventListener('click', () => {
            requestDataFromBot({ action: 'request_deposit_method', method: 'manual' });
            tg.showAlert("Для пополнения через TON/Crypto перейдите в чат с ботом.");
            // tg.close();
        });
    }
    
    // Кнопка "Ставки" на главном экране игр
    if (playStakesWebappBtn) {
        playStakesWebappBtn.addEventListener('click', () => {
            setupStakesScreen(); // Настраиваем экран перед показом
            navigateToScreen('stakes-game-screen');
        });
    }
    
    // --- Общая функция отправки данных боту ---
    function requestDataFromBot(data) {
        if (!tg || !currentUserId) { showErrorInApp("Ошибка отправки: нет ID или Telegram API."); return; }
        const dataToSend = JSON.stringify({ userId: currentUserId, ...data });
        console.log("Sending to bot:", dataToSend.length > 200 ? dataToSend.substring(0,200) + "..." : dataToSend);
        try { tg.sendData(dataToSend); } catch (e) { console.error("tg.sendData error:", e); showErrorInApp("Ошибка связи с сервером.");}
    }

    // --- Инициализация ---
    try { initializeApp(); } catch (e) {
        console.error("Fatal init error:", e);
        showErrorInApp("Критическая ошибка запуска. Перезапустите через /start.");
        hideInitialLoading();
    }
});
