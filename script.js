// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    const appBalanceSpan = document.getElementById('app-balance');
    const screens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-button');
    const initialLoadingScreen = document.getElementById('initial-loading-screen');
    const gamesScreen = document.getElementById('games-screen');
    const caseOpeningScreen = document.getElementById('case-opening-screen');
    const profileScreen = document.getElementById('profile-screen');
    const depositScreen = document.getElementById('deposit-screen');
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
    const DEFAULT_MIN_BET_STAKES = 10;

    function generateNonce() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now();
    }

    function initializeApp() {
        if (!tg) { showErrorInApp("Telegram API не найдено."); hideInitialLoading(); return; }
        tg.ready(); tg.expand(); applyTheme();
        tg.BackButton.onClick(() => {
            const currentScreen = document.querySelector('.screen.active-screen');
            if (currentScreen && (currentScreen.id === 'case-opening-screen' || currentScreen.id === 'stakes-game-screen')) {
                navigateToScreen('games-screen');
            } else if (currentScreen && currentScreen.id !== 'games-screen') {
                navigateToScreen('games-screen');
            } else {
                // Если на главном экране игр, можно закрыть WebApp
                // if (tg.isClosingConfirmationEnabled) tg.disableClosingConfirmation();
                // tg.close(); 
            }
        });

        const params = new URLSearchParams(window.location.search);
        currentUserId = params.get('userId');
        const profileDataStr = params.get('profileData');
        const gameCasesStr = params.get('gameCases');
        const entrypoint = params.get('entrypoint') || 'main_hub';

        if (!currentUserId) { showErrorInApp("Критическая ошибка: ID пользователя не передан."); hideInitialLoading(); return; }

        if (profileDataStr) {
            try {
                currentProfileData = JSON.parse(decodeURIComponent(profileDataStr));
                updateAppBalance(currentProfileData.balance);
                renderProfileData(currentProfileData);
                if(minBetStakesInfo && currentProfileData.minBetStakes !== undefined) minBetStakesInfo.textContent = currentProfileData.minBetStakes;
                else if(minBetStakesInfo) minBetStakesInfo.textContent = DEFAULT_MIN_BET_STAKES;
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
                                (params.get('caseName') ? { 
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
            const r = document.documentElement.style; const theme = tg.themeParams;
            if (theme.bg_color) r.setProperty('--main-bg', theme.bg_color);
            if (theme.text_color) r.setProperty('--text-color-light', theme.text_color);
            if (theme.button_color) r.setProperty('--primary-yellow', theme.button_color);
            if (theme.button_text_color) r.setProperty('--text-color-dark', theme.button_text_color);
            if (theme.secondary_bg_color) {
                r.setProperty('--container-bg', theme.secondary_bg_color);
                r.setProperty('--input-bg', theme.secondary_bg_color);
            }
            if (theme.button_color) {
                let rH=theme.button_color.substring(1,3),gH=theme.button_color.substring(3,5),bH=theme.button_color.substring(5,7);
                if(rH&&gH&&bH){r.setProperty('--border-color',`rgba(${parseInt(rH,16)},${parseInt(gH,16)},${parseInt(bH,16)},0.4)`);r.setProperty('--accent-yellow-glow',`rgba(${parseInt(rH,16)},${parseInt(gH,16)},${parseInt(bH,16)},0.6)`);}
            }
            try { tg.setHeaderColor(theme.secondary_bg_color || theme.bg_color || '#1c1c1e'); } catch(e){}
        }
    }
    
    function updateAppBalance(newBalance) {
        if (typeof newBalance !== 'number' || isNaN(newBalance)) newBalance = 0;
        currentProfileData.balance = newBalance;
        [appBalanceSpan, profileBalanceB, userBalanceOpenSpan, userBalanceStakesSpan].forEach(el => { if (el) el.textContent = newBalance; });
    }

    function hideInitialLoading() { if (initialLoadingScreen) initialLoadingScreen.style.display = 'none'; }
    function showErrorInApp(message) { console.error("WebApp Error:", message); tg.showAlert(message); }
    
    function navigateToScreen(screenId) {
        screens.forEach(s => s.classList.remove('active-screen'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active-screen');
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.targetscreen === screenId));
        if (screenId === 'case-opening-screen' || screenId === 'stakes-game-screen') { tg.BackButton.show(); navButtons.forEach(b => b.classList.remove('active')); }
        else { tg.BackButton.hide(); const activeNav = Array.from(navButtons).find(b=>b.dataset.targetscreen===screenId); if(activeNav) activeNav.classList.add('active');}
    }

    navButtons.forEach(b => b.addEventListener('click', () => navigateToScreen(b.dataset.targetscreen)));
    if (backToGamesBtnFromCase) backToGamesBtnFromCase.addEventListener('click', () => navigateToScreen('games-screen'));
    if (backToGamesBtnFromStakes) backToGamesBtnFromStakes.addEventListener('click', () => navigateToScreen('games-screen'));
    
    function renderProfileData(profile) {
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

    function renderCasesList(cases) {
        if (!casesListContainer) return; casesListContainer.innerHTML = '';
        if (!cases || cases.length === 0) { casesListContainer.innerHTML = '<p>Доступных кейсов нет.</p>'; return; }
        cases.forEach(cD => {
            const d = document.createElement('div'); d.className = 'case-item-webapp';
            d.innerHTML = `<span>${cD.emoji} ${cD.name}</span><span class="cost">${cD.cost} ⭐</span>`;
            if (cD.description) { const p=document.createElement('p');p.className='case-item-description-webapp';p.textContent=cD.description;d.appendChild(p);}
            d.addEventListener('click', () => { currentCaseDataForOpening=cD; setupCaseOpeningScreen(); navigateToScreen('case-opening-screen'); });
            casesListContainer.appendChild(d);
        });
    }
    
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
        const canAfford = (currentProfileData.balance || 0) >= cost;
        if (openActualCaseBtn) openActualCaseBtn.disabled = !canAfford;
        if (notEnoughFundsOpenP) notEnoughFundsOpenP.style.display = canAfford ? 'none' : 'block';
    }
    
    function populateRouletteTrack(trackEl, prizesAnim = [], reps = 7) {
        trackEl.innerHTML = '';
        if (!prizesAnim || prizesAnim.length === 0) prizesAnim = [{'emoji':'❓'}];
        let fullEmojis = prizesAnim.map(p=>(p.emoji||'❓')); // Берем только эмодзи для простоты
        let repeatedEmojis = [];
        for(let i=0; i<reps; i++) repeatedEmojis.push(...fullEmojis);

        const leadTrailCount = Math.max(7, Math.floor(fullEmojis.length * 0.8));
        const finalTrack = [...repeatedEmojis.slice(-leadTrailCount), ...repeatedEmojis, ...repeatedEmojis.slice(0, leadTrailCount)];
        finalTrack.forEach(e => { const d=document.createElement('div');d.className='roulette-item';d.textContent=e;trackEl.appendChild(d);});
        return finalTrack;
    }

    async function startCaseRouletteAnimation() {
        if (isGameInProgress || !rouletteTrackCaseDiv || !currentCaseDataForOpening) return;
        isGameInProgress = true; if (openActualCaseBtn) openActualCaseBtn.disabled = true;
        const prizesAnim = currentCaseDataForOpening.prizesForAnimation;
        if (!prizesAnim || prizesAnim.length === 0) { showErrorInApp("Нет призов для анимации!");isGameInProgress=false;if(openActualCaseBtn)openActualCaseBtn.disabled=false;return; }
        const trackEmojis = populateRouletteTrack(rouletteTrackCaseDiv, prizesAnim);
        if (openingStatusTextCaseP) openingStatusTextCaseP.textContent = "Открываем...";
        if (visualPrizeTextCaseP) visualPrizeTextCaseP.style.display = 'none';
        const itemW=80; const viewportW=rouletteTrackCaseDiv.parentElement.clientWidth;
        const initialOffsetIdx = Math.floor(prizesAnim.length*0.8)+Math.floor(Math.random()*3);
        const initialTX = -(initialOffsetIdx*itemW-(viewportW/2)+(itemW/2));
        rouletteTrackCaseDiv.style.transition='none';rouletteTrackCaseDiv.style.transform=`translateX(${initialTX}px)`;
        const visualWinEmoji = (prizesAnim[Math.floor(Math.random()*prizesAnim.length)] || {emoji:'❓'}).emoji;
        let targetStopIdx = -1;
        const minStop = prizesAnim.length*2; const maxStop = trackEmojis.length-prizesAnim.length*2;
        for (let i=maxStop; i>=minStop; i--) { if(trackEmojis[i]===visualWinEmoji){targetStopIdx=i;break;}}
        if(targetStopIdx===-1)targetStopIdx=Math.floor(minStop+Math.random()*(maxStop-minStop));
        if(targetStopIdx>=trackEmojis.length)targetStopIdx=trackEmojis.length-Math.floor(prizesAnim.length/2)-2;
        if(targetStopIdx<0)targetStopIdx=Math.floor(prizesAnim.length/2)+2;

        const finalTX = -(targetStopIdx*itemW-(viewportW/2)+(itemW/2));
        await new Promise(r=>setTimeout(r,100)); const animDur=4800+Math.random()*1200;
        rouletteTrackCaseDiv.style.transition=`transform ${animDur}ms cubic-bezier(0.23,1,0.32,1)`;
        rouletteTrackCaseDiv.style.transform=`translateX(${finalTX}px)`;
        setTimeout(() => {
            if(openingStatusTextCaseP)openingStatusTextCaseP.textContent="Готово!";
            if(visualPrizeTextCaseP){visualPrizeTextCaseP.textContent=`(визуал: ${visualWinEmoji})`;visualPrizeTextCaseP.style.display='block';}
            requestDataFromBot({action:'open_case_request',caseKey:currentCaseDataForOpening.key, nonce: generateNonce()});
            tg.HapticFeedback.impactOccurred('medium');
            tg.showAlert("Результат открытия кейса отправлен в чат.");
            setTimeout(() => { if (tg && tg.close) tg.close(); }, 2000);
        }, animDur + 200);
    }
    if (openActualCaseBtn) openActualCaseBtn.addEventListener('click', startCaseRouletteAnimation);

    function setupStakesScreen() {
        if (!stakesScreen.classList.contains('active-screen')) return;
        if (userBalanceStakesSpan) userBalanceStakesSpan.textContent = currentProfileData.balance || 0;
        if (stakesBetAmountInput) stakesBetAmountInput.value = '';
        if (stakesResultTextP) { stakesResultTextP.textContent = 'Введите сумму и сделайте ставку!'; stakesResultTextP.style.color = 'var(--text-color-light)';}
        if (slotEmojiSpans.length > 0) slotEmojiSpans.forEach(s => {if(s)s.textContent = '❔';});
        if (confirmStakesBetBtn) confirmStakesBetBtn.disabled = false;
        const minBetVal = (currentProfileData && currentProfileData.minBetStakes !==undefined) ? currentProfileData.minBetStakes : DEFAULT_MIN_BET_STAKES;
        if (minBetStakesInfo) minBetStakesInfo.textContent = minBetVal;
        if (stakesBetAmountInput) stakesBetAmountInput.placeholder = `Сумма (мин. ${minBetVal})`;
        isGameInProgress = false;
    }

    async function playSlotsAnimation() {
        if (slotEmojiSpans.length === 0) return;
        const emojis = ["🎰","🍒","🍓","🍊","🍋","🍉","⭐","💎","🎁","💔","🍀","🔔","BAR","❼"]; let animFrame=0;
        const maxFrames = 20 + Math.floor(Math.random()*10);
        return new Promise(resolve => {
            function animate() {
                slotEmojiSpans.forEach(s => {if(s)s.textContent=emojis[Math.floor(Math.random()*emojis.length)];});
                animFrame++; if (animFrame<maxFrames) setTimeout(animate,70+animFrame*3);
                else { slotEmojiSpans.forEach(s=>{if(s)s.textContent=emojis[Math.floor(Math.random()*emojis.length)];}); resolve(); }
            } animate();
        });
    }
    
    if (confirmStakesBetBtn) {
        confirmStakesBetBtn.addEventListener('click', async () => {
            if (isGameInProgress) return;
            const betStr = stakesBetAmountInput.value; if (!betStr) { if(stakesResultTextP){stakesResultTextP.textContent=`Введите сумму.`; stakesResultTextP.style.color='#E74C3C';} tg.HapticFeedback.notificationOccurred('error'); return;}
            const bet = parseInt(betStr,10); const minB = (currentProfileData&¤tProfileData.minBetStakes!==undefined)?currentProfileData.minBetStakes:DEFAULT_MIN_BET_STAKES;
            if (isNaN(bet)||bet<minB) { if(stakesResultTextP){stakesResultTextP.textContent=`Мин. ставка: ${minB} ⭐.`; stakesResultTextP.style.color='#E74C3C';} tg.HapticFeedback.notificationOccurred('error');return;}
            if (bet>(currentProfileData.balance||0)) { if(stakesResultTextP){stakesResultTextP.textContent="Недостаточно средств!"; stakesResultTextP.style.color='#E74C3C';} tg.HapticFeedback.notificationOccurred('error');return;}
            isGameInProgress=true; if(confirmStakesBetBtn)confirmStakesBetBtn.disabled=true; if(stakesResultTextP)stakesResultTextP.textContent="Делаем ставку...";
            tg.HapticFeedback.impactOccurred('light'); await playSlotsAnimation();
            requestDataFromBot({action:'make_stake_request',betAmount:bet, nonce: generateNonce()});
            if(stakesResultTextP)stakesResultTextP.textContent="Ставка сделана!"; tg.HapticFeedback.impactOccurred('medium');
            tg.showAlert(`Ставка ${bet}⭐ принята. Результат в чате.`);
            setTimeout(() => { if (tg && tg.close) tg.close(); }, 1500);
        });
    }
    
    if (activatePromocodeBtn) {
        activatePromocodeBtn.addEventListener('click', () => {
            const code = promocodeInput.value.trim();
            if (code) { requestDataFromBot({action:'activate_promo_webapp',promoCode:code, nonce: generateNonce()}); promocodeInput.value=''; tg.showAlert(`Промокод "${code}" отправлен. Результат в чате.`);}
            else { tg.showAlert("Введите промокод!"); }
        });
    }
    if (getReferralLinkBtn) { getReferralLinkBtn.addEventListener('click', () => { if(referralInfoBlock)referralInfoBlock.style.display=referralInfoBlock.style.display==='none'?'block':'none';});}
    if (showHelpBtn) { showHelpBtn.addEventListener('click', () => { if(helpInfoBlock)helpInfoBlock.style.display=helpInfoBlock.style.display==='none'?'block':'none';});}
    if (depositTgStarsWebappBtn) { depositTgStarsWebappBtn.addEventListener('click', () => { requestDataFromBot({action:'request_deposit_method',method:'stars', nonce: generateNonce()}); tg.showAlert("Для пополнения через Stars перейдите в чат с ботом.");});}
    if (depositManualWebappBtn) { depositManualWebappBtn.addEventListener('click', () => { requestDataFromBot({action:'request_deposit_method',method:'manual', nonce: generateNonce()}); tg.showAlert("Для пополнения через TON/Crypto перейдите в чат с ботом.");});}
    if (playStakesWebappBtn) { playStakesWebappBtn.addEventListener('click', () => { setupStakesScreen(); navigateToScreen('stakes-game-screen');});}
    
    function requestDataFromBot(data) {
        if (!tg||!currentUserId) { showErrorInApp("Ошибка отправки: нет ID или Telegram API."); return; }
        const dataToSend = JSON.stringify({userId:currentUserId,...data});
        const logData = dataToSend.length>250 ? dataToSend.substring(0,250)+"..." : dataToSend;
        console.log("Sending to bot:",logData);
        try { tg.sendData(dataToSend); } catch (e) { console.error("tg.sendData error:",e); showErrorInApp("Ошибка связи с сервером.");}
    }
    try { initializeApp(); } catch (e) { console.error("Fatal init error:",e);showErrorInApp("Критическая ошибка запуска. Перезапустите.");hideInitialLoading();}
});
