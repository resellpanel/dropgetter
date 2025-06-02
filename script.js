// script.js (УЛЬТРА-УПРОЩЕННАЯ ВЕРСИЯ ДЛЯ ДИАГНОСТИКИ)
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    const initialLoadingScreen = document.getElementById('initial-loading-screen');
    const errorDisplayDiv = document.getElementById('error-display'); // Убедитесь, что этот div есть в HTML
    const gamesScreenStatus = document.getElementById('games-screen-status'); // Добавьте <p id="games-screen-status"></p> на экран игр

    function showErrorInApp(message, isCritical = false) {
        console.error("WebApp Error:", message);
        if (errorDisplayDiv) {
            errorDisplayDiv.innerHTML = `<p style="color: red;">Ошибка: ${message}</p>`;
            errorDisplayDiv.style.display = 'block';
        } else {
            // Если даже errorDisplayDiv нет, это совсем плохо
            alert(`Критическая ошибка JS: ${message}`);
        }
        if (tg && tg.showAlert) { // tg.showAlert может не работать до tg.ready()
            setTimeout(() => tg.showAlert(message), 100); // Небольшая задержка
        }
        if (isCritical) hideInitialLoading();
    }

    function hideInitialLoading() {
        if (initialLoadingScreen) initialLoadingScreen.style.display = 'none';
    }

    function initializeAppDiagnostic() {
        if (!tg) {
            showErrorInApp("Telegram WebApp API не доступно. Откройте приложение внутри Telegram.", true);
            return;
        }

        try {
            tg.ready(); // Сообщаем, что готовы
            tg.expand();  // Раскрываем на весь экран

            if (gamesScreenStatus) gamesScreenStatus.textContent = "JS: Инициализация...";

            const params = new URLSearchParams(window.location.search);
            const userIdParam = params.get('userId');
            const profileDataStrParam = params.get('profileData');
            const gameCasesStrParam = params.get('gameCases');

            if (gamesScreenStatus) gamesScreenStatus.textContent += `\nParams: userId=${userIdParam ? 'OK' : 'FAIL'}, profileData=${profileDataStrParam ? 'OK' : 'FAIL'}, gameCases=${gameCasesStrParam ? 'OK' : 'FAIL'}`;


            if (!userIdParam) {
                showErrorInApp("Критическая ошибка: ID пользователя (userId) не передан в URL.", true);
                return;
            }
            if (gamesScreenStatus) gamesScreenStatus.textContent += `\nUserID: ${userIdParam}`;


            let parsedProfileData = null;
            if (profileDataStrParam) {
                try {
                    parsedProfileData = JSON.parse(decodeURIComponent(profileDataStrParam));
                    if (gamesScreenStatus) gamesScreenStatus.textContent += `\nПрофиль: ${parsedProfileData.firstName || 'N/A'}, Баланс: ${parsedProfileData.balance || 0}`;
                } catch (e) {
                    showErrorInApp(`Ошибка парсинга profileData: ${e.message}. Данные: ${profileDataStrParam.substring(0, 100)}...`, true);
                    if (gamesScreenStatus) gamesScreenStatus.textContent += `\nОшибка парсинга profileData!`;
                    return;
                }
            } else {
                showErrorInApp("Данные профиля (profileData) не переданы в URL.", true);
                if (gamesScreenStatus) gamesScreenStatus.textContent += `\nДанные профиля отсутствуют!`;
                return;
            }

            let parsedGameCases = null;
            if (gameCasesStrParam) {
                try {
                    parsedGameCases = JSON.parse(decodeURIComponent(gameCasesStrParam));
                    if (gamesScreenStatus) gamesScreenStatus.textContent += `\nКейсы: Загружено ${parsedGameCases ? parsedGameCases.length : 0} шт.`;
                    if (parsedGameCases && parsedGameCases.length > 0) {
                        const firstCase = parsedGameCases[0];
                        if (gamesScreenStatus) gamesScreenStatus.textContent += `\nПервый кейс (ключ 'k'): ${firstCase.k || 'N/A'}, (ключ 'n'): ${firstCase.n || 'N/A'}`;
                    }
                } catch (e) {
                    showErrorInApp(`Ошибка парсинга gameCases: ${e.message}. Данные: ${gameCasesStrParam.substring(0, 100)}...`, true);
                    if (gamesScreenStatus) gamesScreenStatus.textContent += `\nОшибка парсинга gameCases!`;
                    return;
                }
            } else {
                showErrorInApp("Данные кейсов (gameCases) не переданы в URL.", true);
                if (gamesScreenStatus) gamesScreenStatus.textContent += `\nДанные кейсов отсутствуют!`;
                // Для теста можно не считать это критической ошибкой, если профиль загрузился
                // return;
            }

            hideInitialLoading();
            // Показываем главный экран, если он есть
            const gamesScreenEl = document.getElementById('games-screen');
            if (gamesScreenEl) {
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
                gamesScreenEl.classList.add('active-screen');
            } else {
                showErrorInApp("Главный экран (games-screen) не найден в DOM.", true);
            }
            if (gamesScreenStatus) gamesScreenStatus.textContent += `\nJS: Инициализация завершена успешно!`;


        } catch (e) {
            showErrorInApp(`Критическая ошибка в initializeAppDiagnostic: ${e.message} (Стек: ${e.stack ? e.stack.substring(0,100) : 'N/A'})`, true);
            if (gamesScreenStatus) gamesScreenStatus.textContent += `\nКритическая ошибка JS! ${e.message}`;
        }
    }

    initializeAppDiagnostic();
});
