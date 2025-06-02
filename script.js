// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // --- DOM Elements (наличие проверяется перед использованием) ---
    const appBalanceSpan = document.getElementById('app-balance');
    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-button');
    const initialLoadingScreen = document.getElementById('initial-loading-screen');
    const caseOpeningScreen = document.getElementById('case-opening-screen');
    const stakesScreen = document.getElementById('stakes-game-screen');
    const caseEmojiOpenDiv = document.getElementById('case-emoji-open');
    const caseNameOpenH2 = document.getElementById('case-name-open');
    const caseCostOpenSpan = document.getElementById('case-cost-open');
    const userBalanceOpenSpan = document.getElementById('user-balance-open');
    const notEnoughFundsOpenP = document.getElementById('not-enough-funds-open');
    const openActualCaseBtn = document.getElementById('open-actual-case-btn');
    const openingStatusTextCaseP = document.getElementById('opening-status-text-case');
    const rouletteTrackCaseDiv = caseOpeningScreen ? caseOpeningScreen.querySelector('.roulette-track-case') : null;
    const visualPrizeTextCaseP = document.getElementById('visual-prize-text-case');
    const casesListContainer = document.getElementById('cases-list-container');
    const backToGamesBtnFromCase = document.getElementById('back-to-games-from-case-btn');
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
    const helpInfoBlock = document.getElementById('help-info-block');
    const showHelpBtn = document.getElementById('show-help-btn');
    const depositTgStarsWebappBtn = document.getElementById('deposit-tg-stars-webapp-btn');
    const depositManualWebappBtn = document.getElementById('deposit-manual-webapp-btn');
    const playStakesWebappBtn = document.getElementById('play-stakes-webapp-btn');
    const userBalanceStakesSpan = document.getElementById('user-balance-stakes');
    const stakesBetAmountInput = document.getElementById('stakes-bet-amount');
    const confirmStakesBetBtn = document.getElementById('confirm-stakes-bet-btn');
    const stakesResultTextP = document.getElementById('stakes-result-text');
    const slotEmojiSpans = [
        document.getElementById('slot-emoji-1'), document.getElementById('slot-emoji-2'), document.getElementById('slot-emoji-3'),
    ].filter(el => el !== null);
    const minBetStakesInfo = document.getElementById('min-bet-stakes-info');
    const backToGamesBtnFromStakes = document.getElementById('back-to-games-from-stakes-btn');
    const errorDisplayDiv = document.getElementById('error-display'); // Предполагаем, что есть div для вывода ошибок

    // --- Global Variables ---
    let currentUserId = null;
    let currentProfileData = {};
    let currentFetchedGameCases = [];
    let currentCaseDataForOpening = null;
    let isGameInProgress = false;
    const DEFAULT_MIN_BET_STAKES = 10;

    // --- Utility Functions ---
    function generateNonce() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now();
    }

    function showErrorInApp(message, isCritical = false) {
        console.error("WebApp Error:", message); // Оставляем для возможной отладки в будущем
        if (tg && tg.showAlert) {
            tg.showAlert(message);
        }
        if (errorDisplayDiv) { // Попытка вывести ошибку в UI
            const errorP = document.createElement('p');
            errorP.textContent = `Ошибка: ${message}`;
            errorP.style.color = 'red';
            errorDisplayDiv.innerHTML = ''; // Очистить предыдущие
            errorDisplayDiv.appendChild(errorP);
            errorDisplayDiv.style.display = 'block';
        }
        if (isCritical) {
            hideInitialLoading(); // Если критическая, убираем экран загрузки
            // Можно заблокировать кнопки или показать сообщение "Перезапустите приложение"
        }
    }

    function hideInitialLoading() {
        if (initialLoadingScreen) initialLoadingScreen.style.display = 'none';
    }

    function applyTheme() {
        if (tg && tg.themeParams) {
            try {
                const r = document.documentElement.style; const theme = tg.themeParams;
                if (theme.bg_color) r.setProperty('--main-bg', theme.bg_color);
                if (theme.text_color) r.setProperty('--text-color-light', theme.text_color);
                if (theme.button_color) r.setProperty('--primary-yellow', theme.button_color);
                if (theme.button_text_color) r.setProperty('--text-color-dark', theme.button_text_color);
                if (theme.secondary_bg_color) {
                    r.setProperty('--container-bg', theme.secondary_bg_color);
                    r.setProperty('--input-bg', theme.secondary_bg_color);
                }
                if (theme.button_color && theme.button_color.startsWith('#') && theme.button_color.length === 7) {
                    let rH = theme.button_color.substring(1, 3), gH = theme.button_color.substring(3, 5), bH = theme.button_color.substring(5, 7);
                    r.setProperty('--border-color', `rgba(${parseInt(rH, 16)},${parseInt(gH, 16)},${parseInt(bH, 16)},0.4)`);
                    r.setProperty('--accent-yellow-glow', `rgba(${parseInt(rH, 16)},${parseInt(gH, 16)},${parseInt(bH, 16)},0.6)`);
                }
                tg.setHeaderColor(theme.secondary_bg_color || theme.bg_color || '#1c1c1e');
            } catch (e) {
                console.warn("Theme application error:", e);
            }
        }
    }

    function updateAppBalance(newBalanceInput) {
        const newBalance = Number(newBalanceInput); // Приводим к числу
        if (isNaN(newBalance)) {
            currentProfileData.balance = 0;
        } else {
            currentProfileData.balance = newBalance;
        }
        [appBalanceSpan, profileBalanceB, userBalanceOpenSpan, userBalanceStakesSpan].forEach(el => {
            if (el) el.textContent = currentProfileData.balance;
        });
    }

    function navigateToScreen(screenId) {
        screens.forEach(s => s.classList.remove('active-screen'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active-screen');
        } else {
            showErrorInApp(`Screen not found: ${screenId}`);
            if (document.getElementById('games-screen')) { // Фоллбэк на главный экран
                 document.getElementById('games-screen').classList.add('active-screen');
            }
        }

        navButtons.forEach(b => b.classList.toggle('active', b.dataset.targetscreen === screenId));

        if (tg && tg.BackButton) {
            if (screenId === 'case-opening-screen' || screenId === 'stakes-game-screen') {
                tg.BackButton.show();
                navButtons.forEach(b => b.classList.remove('active'));
            } else {
                tg.BackButton.hide();
                const activeNav = Array.from(navButtons).find(b => b.dataset.targetscreen === screenId);
                if (activeNav) activeNav.classList.add('active');
            }
        }
    }
    // --- Event Listeners for Navigation ---
    navButtons.forEach(b => {
        if (b && b.dataset && b.dataset.targetscreen) {
            b.addEventListener('click', () => navigateToScreen(b.dataset.targetscreen));
        }
    });
    if (backToGamesBtnFromCase) backToGamesBtnFromCase.addEventListener('click', () => navigateToScreen('games-screen'));
    if (backToGamesBtnFromStakes) backToGamesBtnFromStakes.addEventListener('click', () => navigateToScreen('games-screen'));


    // --- Data Rendering Functions ---
    function renderProfileData(profile) {
        if (!profile) return;
        try {
            if (profileUserIdCode) profileUserIdCode.textContent = profile.userId || 'N/A';
            if (profileFirstNameSpan) profileFirstNameSpan.textContent = profile.firstName || 'N/A';
            if (profileUsernameSpan) profileUsernameSpan.textContent = profile.username ? `@${profile.username}` : 'N/A';
            updateAppBalance(profile.balance); // Already handles NaN
            if (profileJoinDateSpan) profileJoinDateSpan.textContent = profile.joinDate || 'N/A';
            if (profileStakesPlayedSpan) profileStakesPlayedSpan.textContent = String(profile.stakesPlayed || 0);
            if (profileCasesPlayedSpan) profileCasesPlayedSpan.textContent = String(profile.casesPlayed || 0);
            if (profileRoulettePlayedSpan) profileRoulettePlayedSpan.textContent = String(profile.roulettePlayed || 0);
            if (profileTotalDepositedSpan) profileTotalDepositedSpan.textContent = String(profile.totalDeposited || 0);
            if (profileTotalWonSpan) profileTotalWonSpan.textContent = String(profile.totalWon || 0);
            if (referralLinkHrefA) {
                referralLinkHrefA.href = profile.referralLink || '#';
                referralLinkHrefA.textContent = profile.referralLink || 'Нет ссылки';
            }
            if (referralCountSpan) referralCountSpan.textContent = String(profile.referralsCount || 0);
            if (referralBonusSpan) referralBonusSpan.textContent = String(profile.referralBonus || 0);
            if (helpInfoBlock && profile.helpText) {
                helpInfoBlock.innerHTML = String(profile.helpText).replace(/\n/g, '<br>');
            }
        } catch (e) {
            showErrorInApp("Ошибка отображения данных профиля.");
            console.error("renderProfileData error:", e);
        }
    }

    function renderCasesList(cases) { // cases - массив объектов с короткими ключами {k, n, e, c, d, pa}
        if (!casesListContainer) { return; }
        casesListContainer.innerHTML = ''; // Очищаем перед рендерингом
        if (!cases || !Array.isArray(cases) || cases.length === 0) {
            casesListContainer.innerHTML = '<p>Доступных кейсов нет.</p>';
            return;
        }

        try {
            cases.forEach(caseData => {
                if (!caseData || typeof caseData !== 'object') return; // Пропускаем невалидные элементы

                const divEl = document.createElement('div');
                divEl.className = 'case-item-webapp';

                // Используем короткие ключи, проверяя их наличие
                const emoji = caseData.e || '❓';
                const name = caseData.n || 'Неизвестный кейс';
                const cost = typeof caseData.c === 'number' ? caseData.c : 0;
                const description = caseData.d || ''; // description -> d

                divEl.innerHTML = `<span>${emoji} ${name}</span><span class="cost">${cost} ⭐</span>`;
                if (description) {
                    const pDesc = document.createElement('p');
                    pDesc.className = 'case-item-description-webapp';
                    pDesc.textContent = description;
                    divEl.appendChild(pDesc);
                }
                divEl.addEventListener('click', () => {
                    currentCaseDataForOpening = caseData; // Сохраняем объект с короткими ключами
                    setupCaseOpeningScreen();
                    navigateToScreen('case-opening-screen');
                });
                casesListContainer.appendChild(divEl);
            });
        } catch (e) {
            showErrorInApp("Ошибка отображения списка кейсов.");
            console.error("renderCasesList error:", e);
            casesListContainer.innerHTML = '<p>Ошибка при отображении кейсов.</p>';
        }
    }

    // --- Game Logic Functions ---
    function setupCaseOpeningScreen() {
        if (!currentCaseDataForOpening || typeof currentCaseDataForOpening !== 'object') {
            showErrorInApp("Ошибка данных кейса для открытия (внутренняя).");
            navigateToScreen('games-screen');
            return;
        }
        try {
            // Используем короткие ключи из currentCaseDataForOpening
            const name = currentCaseDataForOpening.n || 'Кейс';
            const emoji = currentCaseDataForOpening.e || '❓';
            const cost = Number(currentCaseDataForOpening.c) || 0;

            if (caseEmojiOpenDiv) caseEmojiOpenDiv.textContent = emoji;
            if (caseNameOpenH2) caseNameOpenH2.textContent = name;
            if (caseCostOpenSpan) caseCostOpenSpan.textContent = cost;
            if (userBalanceOpenSpan) userBalanceOpenSpan.textContent = currentProfileData.balance || 0;

            if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Нажмите, чтобы открыть";
            if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';
            if (rouletteTrackCaseDiv) rouletteTrackCaseDiv.innerHTML = '';
            isGameInProgress = false;

            const userBal = Number(currentProfileData.balance) || 0;
            const canAfford = userBal >= cost;

            if (openActualCaseBtn) openActualCaseBtn.disabled = !canAfford;
            if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = canAfford ? 'none' : 'block';
        } catch (e) {
            showErrorInApp("Ошибка подготовки экрана открытия кейса.");
            console.error("setupCaseOpeningScreen error:", e);
        }
    }

    function populateRouletteTrack(trackEl, prizesAnimInput = [], reps = 7) { // prizesAnimInput - массив {e, c}
        if (!trackEl) return [];
        trackEl.innerHTML = '';
        let prizesAnim = prizesAnimInput;
        if (!prizesAnim || !Array.isArray(prizesAnim) || prizesAnim.length === 0) {
            prizesAnim = [{'e':'❓', 'c':'U'}]; // emoji->e, category->c
        }
        
        let fullEmojis = prizesAnim.map(p => (p && p.e) || '❓'); // Берем только эмодзи (p.e)
        if (fullEmojis.length === 0) fullEmojis = ['❓']; // Гарантируем, что не пустой

        let repeatedEmojis = [];
        for(let i=0; i < reps; i++) repeatedEmojis.push(...fullEmojis);

        const leadTrailCount = Math.max(7, Math.floor(fullEmojis.length * 0.8));
        const finalTrack = [
            ...repeatedEmojis.slice(-leadTrailCount), 
            ...repeatedEmojis, 
            ...repeatedEmojis.slice(0, leadTrailCount)
        ];
        finalTrack.forEach(emojiChar => { 
            const divItem = document.createElement('div');
            divItem.className = 'roulette-item';
            divItem.textContent = emojiChar;
            trackEl.appendChild(divItem);
        });
        return finalTrack;
    }

    async function startCaseRouletteAnimation() {
        if (isGameInProgress || !rouletteTrackCaseDiv || !currentCaseDataForOpening || typeof currentCaseDataForOpening !== 'object') return;
        
        isGameInProgress = true; 
        if (openActualCaseBtn) openActualCaseBtn.disabled = true;

        const prizesForAnimation = currentCaseDataForOpening.pa; // prizesForAnimation -> pa
        if (!prizesForAnimation || !Array.isArray(prizesForAnimation) || prizesForAnimation.length === 0) { 
            showErrorInApp("Нет призов для анимации!");
            isGameInProgress = false;
            if (openActualCaseBtn) openActualCaseBtn.disabled = (Number(currentProfileData.balance) || 0) < (Number(currentCaseDataForOpening.c) || 0);
            return; 
        }
        const trackEmojis = populateRouletteTrack(rouletteTrackCaseDiv, prizesForAnimation);

        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Открываем...";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';

        const itemWidth = rouletteTrackCaseDiv.firstChild ? rouletteTrackCaseDiv.firstChild.offsetWidth : 80; // Динамически или фоллбэк
        const viewportWidth = rouletteTrackCaseDiv.parentElement ? rouletteTrackCaseDiv.parentElement.clientWidth : 300;
        
        const initialOffsetIndex = Math.floor(prizesForAnimation.length * 0.8) + Math.floor(Math.random() * 3);
        const initialTranslateX = -(initialOffsetIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));
        
        rouletteTrackCaseDiv.style.transition = 'none';
        rouletteTrackCaseDiv.style.transform = `translateX(${initialTranslateX}px)`;

        const visualWinningPrize = prizesForAnimation[Math.floor(Math.random() * prizesForAnimation.length)] || {e:'❓'};
        const visualWinningEmoji = visualWinningPrize.e || '❓';

        let targetStopIndex = -1;
        const minStopRange = prizesForAnimation.length * 2; 
        const maxStopRange = Math.max(minStopRange, trackEmojis.length - prizesForAnimation.length * 2 -1);
        
        for (let i = maxStopRange; i >= minStopRange; i--) {
            if (trackEmojis[i] === visualWinningEmoji) { targetStopIndex = i; break; }
        }
        if (targetStopIndex === -1) { 
            targetStopIndex = Math.floor(minStopRange + Math.random() * (maxStopRange - minStopRange + 1));
        }
        targetStopIndex = Math.max(0, Math.min(targetStopIndex, trackEmojis.length - 1));

        const finalTranslateX = -(targetStopIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));
        
        await new Promise(resolve => setTimeout(resolve, 100)); 
        
        const animationDuration = 4800 + Math.random() * 1200;
        rouletteTrackCaseDiv.style.transition = `transform ${animationDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`;
        rouletteTrackCaseDiv.style.transform = `translateX(${finalTranslateX}px)`;

        setTimeout(() => {
            if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Готово!";
            if (visualPrizeTextCaseP) {
                visualPrizeTextCaseP.textContent = `(визуал: ${visualWinningEmoji})`;
                visualPrizeTextCaseP.style.display = 'block';
            }
            // Отправляем запрос боту. Бот ожидает ПОЛНЫЙ ключ кейса (из currentCaseDataForOpening.k)
            // Убедитесь, что currentCaseDataForOpening.k это тот ключ, что в БД бота.
            requestDataFromBot({
                action: 'open_case_request',
                caseKey: currentCaseDataForOpening.k, 
                nonce: generateNonce()
            });
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            if (tg.showAlert) tg.showAlert("Результат открытия кейса отправлен в чат.");
            // Не закрываем WebApp автоматически, даем пользователю увидеть результат в чате
            // setTimeout(() => { if (tg && tg.close) tg.close(); }, 2000); 
            isGameInProgress = false; // Игра завершена
             // Кнопку разблокируем после получения нового баланса от бота или по таймауту
             // пока просто разблокируем, но лучше делать это после обновления баланса
            if (openActualCaseBtn) openActualCaseBtn.disabled = (Number(currentProfileData.balance) || 0) < (Number(currentCaseDataForOpening.c) || 0);


        }, animationDuration + 200);
    }
    if (openActualCaseBtn) openActualCaseBtn.addEventListener('click', startCaseRouletteAnimation);

    function setupStakesScreen() {
        if (!stakesScreen || !stakesScreen.classList.contains('active-screen')) return;
        try {
            if (userBalanceStakesSpan) userBalanceStakesSpan.textContent = currentProfileData.balance || 0;
            if (stakesBetAmountInput) stakesBetAmountInput.value = '';
            if (stakesResultTextP) { stakesResultTextP.textContent = 'Введите сумму и сделайте ставку!'; stakesResultTextP.style.color = 'var(--text-color-light)';}
            if (slotEmojiSpans.length > 0) slotEmojiSpans.forEach(s => {if(s)s.textContent = '❔';});
            if (confirmStakesBetBtn) confirmStakesBetBtn.disabled = false;
            
            const minBetValue = (currentProfileData && typeof currentProfileData.minBetStakes !== 'undefined') 
                                ? currentProfileData.minBetStakes 
                                : DEFAULT_MIN_BET_STAKES;
            if (minBetStakesInfo) minBetStakesInfo.textContent = String(minBetValue);
            if (stakesBetAmountInput) stakesBetAmountInput.placeholder = `Сумма (мин. ${minBetValue})`;
            isGameInProgress = false;
        } catch (e) {
            showErrorInApp("Ошибка подготовки экрана ставок.");
            console.error("setupStakesScreen error:", e);
        }
    }

    async function playSlotsAnimation() {
        if (slotEmojiSpans.length === 0) return;
        const emojis = ["🎰","🍒","🍓","🍊","🍋","🍉","⭐","💎","🎁","💔","🍀","🔔","BAR","❼"];
        let animationFrame = 0;
        const maxAnimationFrames = 20 + Math.floor(Math.random() * 10);
        return new Promise(resolve => {
            function animateFrame() {
                slotEmojiSpans.forEach(s => { if (s) s.textContent = emojis[Math.floor(Math.random() * emojis.length)]; });
                animationFrame++;
                if (animationFrame < maxAnimationFrames) {
                    setTimeout(animateFrame, 70 + animationFrame * 3);
                } else {
                    slotEmojiSpans.forEach(s => { if (s) s.textContent = emojis[Math.floor(Math.random() * emojis.length)]; });
                    resolve();
                }
            }
            animateFrame();
        });
    }
    
    if (confirmStakesBetBtn) {
        confirmStakesBetBtn.addEventListener('click', async () => {
            if (isGameInProgress) return;
            const betString = stakesBetAmountInput ? stakesBetAmountInput.value : '';
            if (!betString) { 
                if(stakesResultTextP) { stakesResultTextP.textContent = `Введите сумму.`; stakesResultTextP.style.color='#E74C3C';}
                if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error'); 
                return;
            }
            const betAmount = parseInt(betString, 10);
            const minBetValue = (currentProfileData && typeof currentProfileData.minBetStakes !== 'undefined') 
                                ? currentProfileData.minBetStakes 
                                : DEFAULT_MIN_BET_STAKES;

            if (isNaN(betAmount) || betAmount < minBetValue) { 
                if(stakesResultTextP) { stakesResultTextP.textContent = `Мин. ставка: ${minBetValue} ⭐.`; stakesResultTextP.style.color='#E74C3C';}
                if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
                return;
            }
            const userBal = Number(currentProfileData.balance) || 0;
            if (betAmount > userBal) { 
                if(stakesResultTextP) { stakesResultTextP.textContent="Недостаточно средств!"; stakesResultTextP.style.color='#E74C3C';}
                if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
                return;
            }
            isGameInProgress = true;
            if(confirmStakesBetBtn) confirmStakesBetBtn.disabled = true;
            if(stakesResultTextP) stakesResultTextP.textContent = "Делаем ставку...";
            
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            await playSlotsAnimation();
            
            requestDataFromBot({
                action: 'make_stake_request',
                betAmount: betAmount,
                nonce: generateNonce()
            });
            if(stakesResultTextP) stakesResultTextP.textContent = "Ставка сделана!";
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            if (tg.showAlert) tg.showAlert(`Ставка ${betAmount}⭐ принята. Результат в чате.`);
             // Не закрываем WebApp, даем пользователю сделать еще ставку или выйти
            // setTimeout(() => { if (tg && tg.close) tg.close(); }, 1500);
            isGameInProgress = false; // Игра завершена
            // Кнопку разблокируем после получения нового баланса от бота или по таймауту
            if(confirmStakesBetBtn) confirmStakesBetBtn.disabled = false; 
        });
    }
    
    // --- Other Event Listeners ---
    if (activatePromocodeBtn) {
        activatePromocodeBtn.addEventListener('click', () => {
            const codeValue = promocodeInput ? promocodeInput.value.trim() : '';
            if (codeValue) { 
                requestDataFromBot({action:'activate_promo_webapp', promoCode: codeValue, nonce: generateNonce()}); 
                if (promocodeInput) promocodeInput.value=''; 
                if (tg.showAlert) tg.showAlert(`Промокод "${codeValue}" отправлен. Результат в чате.`);
            } else { if (tg.showAlert) tg.showAlert("Введите промокод!"); }
        });
    }
    if (getReferralLinkBtn && referralInfoBlock) { getReferralLinkBtn.addEventListener('click', () => { referralInfoBlock.style.display = referralInfoBlock.style.display === 'none' ? 'block' : 'none'; });}
    if (showHelpBtn && helpInfoBlock) { showHelpBtn.addEventListener('click', () => { helpInfoBlock.style.display = helpInfoBlock.style.display === 'none' ? 'block' : 'none'; });}
    
    if (depositTgStarsWebappBtn) { 
        depositTgStarsWebappBtn.addEventListener('click', () => { 
            requestDataFromBot({action:'request_deposit_method', method:'stars', nonce: generateNonce()}); 
            if (tg.showAlert) tg.showAlert("Для пополнения через Stars перейдите в чат с ботом.");
        });
    }
    if (depositManualWebappBtn) { 
        depositManualWebappBtn.addEventListener('click', () => { 
            requestDataFromBot({action:'request_deposit_method', method:'manual', nonce: generateNonce()}); 
            if (tg.showAlert) tg.showAlert("Для пополнения через TON/Crypto перейдите в чат с ботом.");
        });
    }
    if (playStakesWebappBtn) { 
        playStakesWebappBtn.addEventListener('click', () => { 
            setupStakesScreen(); 
            navigateToScreen('stakes-game-screen');
        });
    }
    
    // --- Data Sending Function ---
    function requestDataFromBot(dataPayload) {
        if (!tg || !currentUserId) { showErrorInApp("Ошибка отправки: нет ID или Telegram API."); return; }
        try {
            const dataToSend = JSON.stringify({userId: currentUserId, ...dataPayload});
            const logFriendlyData = dataToSend.length > 250 ? dataToSend.substring(0,250) + "..." : dataToSend;
            console.log("Sending to bot:", logFriendlyData); // Для отладки, если будет доступна консоль
            tg.sendData(dataToSend); 
        } catch (e) { 
            console.error("Data preparation or tg.sendData error:", e); 
            showErrorInApp("Ошибка связи с сервером при отправке данных.");
        }
    }

    // --- App Initialization ---
    function main() {
        if (!tg) {
            showErrorInApp("Telegram WebApp API не доступно. Пожалуйста, убедитесь, что вы открываете приложение внутри Telegram.", true);
            hideInitialLoading();
            return;
        }
        try {
            initializeApp();
        } catch (e) {
            console.error("Fatal initialization error:", e);
            showErrorInApp("Критическая ошибка при запуске приложения. Попробуйте перезапустить.", true);
            hideInitialLoading();
        }
    }
    main(); // Запускаем приложение
});
