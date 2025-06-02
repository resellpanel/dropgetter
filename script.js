// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Элементы DOM
    const appBalanceSpan = document.getElementById('app-balance');
    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-button');
    const initialLoadingScreen = document.getElementById('initial-loading-screen');
    // const gamesScreen = document.getElementById('games-screen'); // Не используется напрямую для навигации здесь
    const caseOpeningScreen = document.getElementById('case-opening-screen');
    // const profileScreen = document.getElementById('profile-screen');
    // const depositScreen = document.getElementById('deposit-screen');
    const stakesScreen = document.getElementById('stakes-game-screen');
    const caseEmojiOpenDiv = document.getElementById('case-emoji-open');
    const caseNameOpenH2 = document.getElementById('case-name-open');
    const caseCostOpenSpan = document.getElementById('case-cost-open');
    const userBalanceOpenSpan = document.getElementById('user-balance-open');
    const notEnoughFundsOpenP = document.getElementById('not-enough-funds-open');
    const openActualCaseBtn = document.getElementById('open-actual-case-btn');
    const openingStatusTextCaseP = document.getElementById('opening-status-text-case');
    const rouletteTrackCaseDiv = caseOpeningScreen.querySelector('.roulette-track-case');
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

    let currentUserId = null;
    let currentProfileData = {};
    let currentFetchedGameCases = [];
    let currentCaseDataForOpening = null;
    let isGameInProgress = false;
    const DEFAULT_MIN_BET_STAKES = 10; // Должно совпадать с бэкендом или передаваться

    function generateNonce() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now();
    }

    function initializeApp() {
        if (!tg) { showErrorInApp("Telegram API не найдено."); hideInitialLoading(); return; }
        tg.ready();
        tg.expand();
        applyTheme();

        tg.BackButton.onClick(() => {
            const currentScreenEl = document.querySelector('.screen.active-screen');
            if (currentScreenEl && (currentScreenEl.id === 'case-opening-screen' || currentScreenEl.id === 'stakes-game-screen')) {
                navigateToScreen('games-screen');
            } else if (currentScreenEl && currentScreenEl.id !== 'games-screen') {
                navigateToScreen('games-screen');
            } else {
                // Можно добавить tg.close(); если нужно закрывать по кнопке назад на главном экране
            }
        });

        const params = new URLSearchParams(window.location.search);
        currentUserId = params.get('userId');
        const profileDataStr = params.get('profileData');
        const gameCasesStr = params.get('gameCases'); // Имя параметра 'gameCases' не менялось
        const entrypoint = params.get('entrypoint') || 'main_hub';

        if (!currentUserId) { showErrorInApp("Критическая ошибка: ID пользователя не передан."); hideInitialLoading(); return; }

        if (profileDataStr) {
            try {
                currentProfileData = JSON.parse(decodeURIComponent(profileDataStr));
                updateAppBalance(currentProfileData.balance);
                renderProfileData(currentProfileData); // Ключи в profileData не менялись
                if (minBetStakesInfo && typeof currentProfileData.minBetStakes !== 'undefined') {
                     minBetStakesInfo.textContent = currentProfileData.minBetStakes;
                } else if (minBetStakesInfo) {
                     minBetStakesInfo.textContent = DEFAULT_MIN_BET_STAKES;
                }
            } catch (e) { console.error("Error parsing profileData:", e); showErrorInApp("Ошибка данных профиля."); }
        } else { console.warn("profileData not in URL."); showErrorInApp("Данные профиля не загружены."); }

        if (gameCasesStr) {
            try {
                // JSON.parse(decodeURIComponent(gameCasesStr)) вернет массив объектов с короткими ключами
                currentFetchedGameCases = JSON.parse(decodeURIComponent(gameCasesStr));
                renderCasesList(currentFetchedGameCases); // Функция должна быть готова к коротким ключам
            } catch (e) { console.error("Error parsing gameCases:", e); showErrorInApp("Ошибка списка кейсов. Возможно, данные повреждены."); }
        } else {
            console.warn("gameCases not in URL.");
            if (casesListContainer) casesListContainer.innerHTML = '<p>Кейсы не загружены.</p>';
        }

        if (entrypoint === 'case_open') {
            const caseKeyParam = params.get('caseKey'); // Имя параметра URL
            let targetCase = currentFetchedGameCases.find(c => c.k === caseKeyParam); // Ищем по короткому ключу 'k'

            if (!targetCase && params.has('caseName')) { // Если не нашли в загруженных, пробуем собрать из параметров URL
                let prizesForAnim = [];
                if (params.has('prizesForAnimation')) {
                    try {
                        // JSON.parse(decodeURIComponent(params.get('prizesForAnimation'))) вернет массив объектов с {e, c}
                        prizesForAnim = JSON.parse(decodeURIComponent(params.get('prizesForAnimation')));
                    } catch (e) { console.error("Error parsing prizesForAnimation for entrypoint:", e); prizesForAnim = [{"e":"?"}]; }
                }
                targetCase = {
                    k: caseKeyParam, // короткий ключ для консистентности
                    n: decodeURIComponent(params.get('caseName')),
                    e: decodeURIComponent(params.get('caseEmoji') || '❓'),
                    c: parseInt(params.get('caseCost') || 0, 10),
                    pa: prizesForAnim // prizesForAnimation -> pa, и внутри призы с {e, c}
                };
            }

            if (targetCase) {
                currentCaseDataForOpening = targetCase;
                setupCaseOpeningScreen(); // Должна использовать короткие ключи из currentCaseDataForOpening
                navigateToScreen('case-opening-screen');
            } else { showErrorInApp("Не удалось загрузить данные кейса для открытия."); navigateToScreen('games-screen'); }
        } else {
            navigateToScreen('games-screen');
        }
        hideInitialLoading();
    }

    function applyTheme() {
        if (tg && tg.themeParams) {
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
                let rH=theme.button_color.substring(1,3),gH=theme.button_color.substring(3,5),bH=theme.button_color.substring(5,7);
                r.setProperty('--border-color',`rgba(${parseInt(rH,16)},${parseInt(gH,16)},${parseInt(bH,16)},0.4)`);
                r.setProperty('--accent-yellow-glow',`rgba(${parseInt(rH,16)},${parseInt(gH,16)},${parseInt(bH,16)},0.6)`);
            }
            try { tg.setHeaderColor(theme.secondary_bg_color || theme.bg_color || '#1c1c1e'); } catch(e){ console.warn("Failed to set header color", e); }
        }
    }

    function updateAppBalance(newBalance) {
        if (typeof newBalance !== 'number' || isNaN(newBalance)) newBalance = 0;
        currentProfileData.balance = newBalance;
        [appBalanceSpan, profileBalanceB, userBalanceOpenSpan, userBalanceStakesSpan].forEach(el => { if (el) el.textContent = newBalance; });
    }

    function hideInitialLoading() { if (initialLoadingScreen) initialLoadingScreen.style.display = 'none'; }
    function showErrorInApp(message) { console.error("WebApp Error:", message); if(tg && tg.showAlert) tg.showAlert(message); }

    function navigateToScreen(screenId) {
        screens.forEach(s => s.classList.remove('active-screen'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active-screen');

        navButtons.forEach(b => b.classList.toggle('active', b.dataset.targetscreen === screenId));

        if (screenId === 'case-opening-screen' || screenId === 'stakes-game-screen') {
            tg.BackButton.show();
            navButtons.forEach(b => b.classList.remove('active')); // Убираем активность с нижней навигации
        } else {
            tg.BackButton.hide();
            // Восстанавливаем активность на кнопке нижней навигации, если она есть
            const activeNav = Array.from(navButtons).find(b => b.dataset.targetscreen === screenId);
            if (activeNav) activeNav.classList.add('active');
        }
    }

    navButtons.forEach(b => b.addEventListener('click', () => navigateToScreen(b.dataset.targetscreen)));
    if (backToGamesBtnFromCase) backToGamesBtnFromCase.addEventListener('click', () => navigateToScreen('games-screen'));
    if (backToGamesBtnFromStakes) backToGamesBtnFromStakes.addEventListener('click', () => navigateToScreen('games-screen'));

    function renderProfileData(profile) { // Ключи в profileData не менялись
        if (!profile) return;
        if (profileUserIdCode) profileUserIdCode.textContent = profile.userId || 'N/A';
        if (profileFirstNameSpan) profileFirstNameSpan.textContent = profile.firstName || 'N/A';
        if (profileUsernameSpan) profileUsernameSpan.textContent = profile.username ? `@${profile.username}` : 'N/A';
        updateAppBalance(profile.balance || 0);
        if (profileJoinDateSpan) profileJoinDateSpan.textContent = profile.joinDate || 'N/A';
        if (profileStakesPlayedSpan) profileStakesPlayedSpan.textContent = profile.stakesPlayed || 0;
        if (profileCasesPlayedSpan) profileCasesPlayedSpan.textContent = profile.casesPlayed || 0;
        if (profileRoulettePlayedSpan) profileRoulettePlayedSpan.textContent = profile.roulettePlayed || 0;
        if (profileTotalDepositedSpan) profileTotalDepositedSpan.textContent = profile.totalDeposited || 0;
        if (profileTotalWonSpan) profileTotalWonSpan.textContent = profile.totalWon || 0;
        if (referralLinkHrefA) { referralLinkHrefA.href = profile.referralLink || '#'; referralLinkHrefA.textContent = profile.referralLink || 'Нет ссылки';}
        if (referralCountSpan) referralCountSpan.textContent = profile.referralsCount || 0;
        if (referralBonusSpan) referralBonusSpan.textContent = profile.referralBonus || 0;
        if (helpInfoBlock && profile.helpText) { helpInfoBlock.innerHTML = profile.helpText.replace(/\n/g, '<br>');}
    }

    function renderCasesList(cases) { // cases - массив объектов с короткими ключами k, n, e, c, d, pa
        if (!casesListContainer) return;
        casesListContainer.innerHTML = '';
        if (!cases || cases.length === 0) { casesListContainer.innerHTML = '<p>Доступных кейсов нет.</p>'; return; }

        cases.forEach(caseData => { // caseData = {k, n, e, c, d, pa}
            const divEl = document.createElement('div');
            divEl.className = 'case-item-webapp';
            // Используем короткие ключи
            divEl.innerHTML = `<span>${caseData.e} ${caseData.n}</span><span class="cost">${caseData.c} ⭐</span>`;
            if (caseData.d) { // description -> d
                const pDesc = document.createElement('p');
                pDesc.className = 'case-item-description-webapp';
                pDesc.textContent = caseData.d;
                divEl.appendChild(pDesc);
            }
            divEl.addEventListener('click', () => {
                currentCaseDataForOpening = caseData; // Сохраняем объект с короткими ключами
                setupCaseOpeningScreen();
                navigateToScreen('case-opening-screen');
            });
            casesListContainer.appendChild(divEl);
        });
    }

    function setupCaseOpeningScreen() { // Использует currentCaseDataForOpening (с короткими ключами)
        if (!currentCaseDataForOpening) { showErrorInApp("Ошибка данных кейса для открытия."); navigateToScreen('games-screen'); return; }
        const { n, e, c } = currentCaseDataForOpening; // name->n, emoji->e, cost->c
        if (caseEmojiOpenDiv) caseEmojiOpenDiv.textContent = e;
        if (caseNameOpenH2) caseNameOpenH2.textContent = n;
        if (caseCostOpenSpan) caseCostOpenSpan.textContent = c;
        if (userBalanceOpenSpan) userBalanceOpenSpan.textContent = currentProfileData.balance;
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Нажмите, чтобы открыть";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';
        if (rouletteTrackCaseDiv) rouletteTrackCaseDiv.innerHTML = ''; // Очищаем трек
        isGameInProgress = false;
        const canAfford = (currentProfileData.balance || 0) >= (c || 0);
        if (openActualCaseBtn) openActualCaseBtn.disabled = !canAfford;
        if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = canAfford ? 'none' : 'block';
    }

    function populateRouletteTrack(trackEl, prizesAnim = [], reps = 7) { // prizesAnim - массив {e, c}
        trackEl.innerHTML = '';
        if (!prizesAnim || prizesAnim.length === 0) prizesAnim = [{'e':'❓', 'c':'U'}]; // emoji->e, category->c
        
        let fullEmojis = prizesAnim.map(p => (p.e || '❓')); // Берем только эмодзи (p.e)
        let repeatedEmojis = [];
        for(let i=0; i < reps; i++) repeatedEmojis.push(...fullEmojis);

        const leadTrailCount = Math.max(7, Math.floor(fullEmojis.length * 0.8)); // Для плавной остановки
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
        return finalTrack; // Возвращаем массив эмодзи, которые в треке
    }

    async function startCaseRouletteAnimation() {
        if (isGameInProgress || !rouletteTrackCaseDiv || !currentCaseDataForOpening) return;
        isGameInProgress = true; 
        if (openActualCaseBtn) openActualCaseBtn.disabled = true;

        const prizesForAnimation = currentCaseDataForOpening.pa; // prizesForAnimation -> pa
        if (!prizesForAnimation || prizesForAnimation.length === 0) { 
            showErrorInApp("Нет призов для анимации!");
            isGameInProgress = false;
            if (openActualCaseBtn) openActualCaseBtn.disabled = false;
            return; 
        }
        const trackEmojis = populateRouletteTrack(rouletteTrackCaseDiv, prizesForAnimation); // prizesForAnimation - массив {e,c}

        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Открываем...";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';

        const itemWidth = 80; // Ширина одного элемента рулетки в px (должна соответствовать CSS)
        const viewportWidth = rouletteTrackCaseDiv.parentElement.clientWidth;
        
        // Начальное смещение (чтобы не начиналось с первого элемента)
        const initialOffsetIndex = Math.floor(prizesForAnimation.length * 0.8) + Math.floor(Math.random() * 3);
        const initialTranslateX = -(initialOffsetIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));
        
        rouletteTrackCaseDiv.style.transition = 'none';
        rouletteTrackCaseDiv.style.transform = `translateX(${initialTranslateX}px)`;

        // Визуальный "выигрышный" эмодзи (случайный из доступных для анимации)
        const visualWinningPrize = prizesForAnimation[Math.floor(Math.random() * prizesForAnimation.length)] || {e:'❓'};
        const visualWinningEmoji = visualWinningPrize.e; // emoji -> e

        let targetStopIndex = -1;
        const minStopRange = prizesForAnimation.length * 2; // Чтобы прокрутилось хотя бы пару раз
        const maxStopRange = trackEmojis.length - prizesForAnimation.length * 2; // Оставляем место в конце
        
        // Ищем индекс "выигрышного" эмодзи в подходящем диапазоне
        for (let i = maxStopRange; i >= minStopRange; i--) {
            if (trackEmojis[i] === visualWinningEmoji) {
                targetStopIndex = i;
                break;
            }
        }
        if (targetStopIndex === -1) { // Если не нашли (маловероятно), выбираем случайный в диапазоне
            targetStopIndex = Math.floor(minStopRange + Math.random() * (maxStopRange - minStopRange));
        }
        // Коррекция, чтобы не выходить за пределы
        targetStopIndex = Math.max(0, Math.min(targetStopIndex, trackEmojis.length - 1));


        const finalTranslateX = -(targetStopIndex * itemWidth - (viewportWidth / 2) + (itemWidth / 2));
        
        await new Promise(resolve => setTimeout(resolve, 100)); // Небольшая задержка перед анимацией
        
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
            requestDataFromBot({
                action: 'open_case_request',
                caseKey: currentCaseDataForOpening.k, // Отправляем 'k' как caseKey
                nonce: generateNonce()
            });
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            tg.showAlert("Результат открытия кейса отправлен в чат.");
            setTimeout(() => { if (tg && tg.close) tg.close(); }, 2000); // Закрываем WebApp через 2 сек
        }, animationDuration + 200); // +200ms на завершение
    }
    if (openActualCaseBtn) openActualCaseBtn.addEventListener('click', startCaseRouletteAnimation);


    function setupStakesScreen() {
        if (!stakesScreen || !stakesScreen.classList.contains('active-screen')) return;
        if (userBalanceStakesSpan) userBalanceStakesSpan.textContent = currentProfileData.balance || 0;
        if (stakesBetAmountInput) stakesBetAmountInput.value = '';
        if (stakesResultTextP) { stakesResultTextP.textContent = 'Введите сумму и сделайте ставку!'; stakesResultTextP.style.color = 'var(--text-color-light)';}
        if (slotEmojiSpans.length > 0) slotEmojiSpans.forEach(s => {if(s)s.textContent = '❔';});
        if (confirmStakesBetBtn) confirmStakesBetBtn.disabled = false;
        
        const minBetValue = (currentProfileData && typeof currentProfileData.minBetStakes !== 'undefined') 
                            ? currentProfileData.minBetStakes 
                            : DEFAULT_MIN_BET_STAKES;
        if (minBetStakesInfo) minBetStakesInfo.textContent = minBetValue;
        if (stakesBetAmountInput) stakesBetAmountInput.placeholder = `Сумма (мин. ${minBetValue})`;
        isGameInProgress = false;
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
                    // Финальные эмодзи (можно сделать их "выигрышными" или случайными)
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
            const betString = stakesBetAmountInput.value;
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
            if (betAmount > (currentProfileData.balance || 0)) { 
                if(stakesResultTextP) { stakesResultTextP.textContent="Недостаточно средств!"; stakesResultTextP.style.color='#E74C3C';}
                if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
                return;
            }
            isGameInProgress = true;
            if(confirmStakesBetBtn) confirmStakesBetBtn.disabled = true;
            if(stakesResultTextP) stakesResultTextP.textContent = "Делаем ставку...";
            
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            await playSlotsAnimation();
            
            // Отправляем боту ПОЛНЫЕ имена ключей, которые он ожидает
            requestDataFromBot({
                action: 'make_stake_request',
                betAmount: betAmount, // betAmount - стандартное имя
                nonce: generateNonce()
            });
            if(stakesResultTextP) stakesResultTextP.textContent = "Ставка сделана!";
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            tg.showAlert(`Ставка ${betAmount}⭐ принята. Результат в чате.`);
            setTimeout(() => { if (tg && tg.close) tg.close(); }, 1500);
        });
    }
    
    // Обработчики для промокода, рефералки, помощи, депозитов
    if (activatePromocodeBtn) {
        activatePromocodeBtn.addEventListener('click', () => {
            const codeValue = promocodeInput.value.trim();
            if (codeValue) { 
                requestDataFromBot({action:'activate_promo_webapp', promoCode: codeValue, nonce: generateNonce()}); 
                promocodeInput.value=''; 
                tg.showAlert(`Промокод "${codeValue}" отправлен. Результат в чате.`);
            } else { tg.showAlert("Введите промокод!"); }
        });
    }
    if (getReferralLinkBtn && referralInfoBlock) { getReferralLinkBtn.addEventListener('click', () => { referralInfoBlock.style.display = referralInfoBlock.style.display === 'none' ? 'block' : 'none'; });}
    if (showHelpBtn && helpInfoBlock) { showHelpBtn.addEventListener('click', () => { helpInfoBlock.style.display = helpInfoBlock.style.display === 'none' ? 'block' : 'none'; });}
    
    if (depositTgStarsWebappBtn) { 
        depositTgStarsWebappBtn.addEventListener('click', () => { 
            requestDataFromBot({action:'request_deposit_method', method:'stars', nonce: generateNonce()}); 
            tg.showAlert("Для пополнения через Stars перейдите в чат с ботом.");
        });
    }
    if (depositManualWebappBtn) { 
        depositManualWebappBtn.addEventListener('click', () => { 
            requestDataFromBot({action:'request_deposit_method', method:'manual', nonce: generateNonce()}); 
            tg.showAlert("Для пополнения через TON/Crypto перейдите в чат с ботом.");
        });
    }
    if (playStakesWebappBtn) { 
        playStakesWebappBtn.addEventListener('click', () => { 
            setupStakesScreen(); 
            navigateToScreen('stakes-game-screen');
        });
    }
    
    function requestDataFromBot(dataPayload) {
        if (!tg || !currentUserId) { showErrorInApp("Ошибка отправки: нет ID или Telegram API."); return; }
        // В dataPayload уже есть action и другие данные. Добавляем userId.
        const dataToSend = JSON.stringify({userId: currentUserId, ...dataPayload});
        
        const logFriendlyData = dataToSend.length > 250 ? dataToSend.substring(0,250) + "..." : dataToSend;
        console.log("Sending to bot:", logFriendlyData);
        
        try { tg.sendData(dataToSend); } 
        catch (e) { console.error("tg.sendData error:", e); showErrorInApp("Ошибка связи с сервером.");}
    }

    // Инициализация приложения
    try { 
        initializeApp(); 
    } catch (e) { 
        console.error("Fatal initialization error:", e);
        showErrorInApp("Критическая ошибка запуска приложения. Пожалуйста, перезапустите.");
        hideInitialLoading();
    }
});
