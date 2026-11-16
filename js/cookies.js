/* ==========================================================
   Уведомление о cookie
   Сайт не использует аналитику, рекламу и сторонние сервисы:
   шрифты лежат локально. В браузере сохраняется только отметка,
   что посетитель видел уведомление.
   ========================================================== */

(function () {
    const KEY = "fieldstone-cookie-notice";

    function getChoice() {
        try {
            return localStorage.getItem(KEY);
        } catch (error) {
            return null;
        }
    }

    function saveChoice(value) {
        try {
            localStorage.setItem(KEY, value);
        } catch (error) {
            /* браузер запретил хранилище — просто не запоминаем */
        }
    }

    function clearChoice() {
        try {
            localStorage.removeItem(KEY);
        } catch (error) {
            /* ничего не делаем */
        }
    }

    function showBanner() {
        if (document.querySelector(".cookie")) return;

        const banner = document.createElement("div");
        banner.className = "cookie";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-label", "Уведомление о cookie");
        banner.innerHTML =
            '<p class="cookie__text">' +
                "Сайт не следит за вами: нет аналитики и рекламы. Сохраняем только отметку, " +
                'что вы видели это сообщение. Подробнее — в <a href="cookies.html">политике cookie</a>.' +
            "</p>" +
            '<div class="cookie__actions">' +
                '<button class="cookie__btn cookie__btn--main" type="button" data-ok>Понятно</button>' +
            "</div>";

        banner.querySelector("[data-ok]").addEventListener("click", () => {
            saveChoice("seen");
            banner.remove();
            updateStatus();
        });

        document.body.appendChild(banner);
    }

    function updateStatus() {
        const status = document.querySelector("[data-cookie-status]");
        if (!status) return;
        status.textContent = getChoice() ? "вы видели уведомление" : "уведомление ещё не закрыто";
    }

    document.querySelectorAll("[data-cookie-reset]").forEach((button) => {
        button.addEventListener("click", () => {
            clearChoice();
            updateStatus();
            showBanner();
        });
    });

    if (!getChoice()) showBanner();
    updateStatus();

    /* Год в подвале */
    document.querySelectorAll("[data-year]").forEach((el) => {
        el.textContent = new Date().getFullYear();
    });
})();
