/* ==========================================================
   Fieldstone Labs — терминал на первом экране и бриф
   Бриф работает «для вида»: данные никуда не отправляются.
   ========================================================== */

/* ---------- Терминал: печатаем текст по символам ---------- */

(function () {
    const term = document.querySelector("[data-term]");
    if (!term) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cursor = '<span class="term__cursor" aria-hidden="true"></span>';

    if (reduced) {
        term.insertAdjacentHTML("beforeend", cursor);
        return;
    }

    /* Разбираем готовую разметку на кусочки: теги вставляем целиком, текст — по букве */
    const source = term.innerHTML;
    const parts = source.match(/<[^>]+>|[^<]/g) || [];
    let index = 0;
    let html = "";

    term.innerHTML = cursor;

    function step() {
        /* теги пропускаем сразу, чтобы цвет появлялся вместе с текстом */
        while (index < parts.length && parts[index].startsWith("<")) {
            html += parts[index++];
        }
        if (index >= parts.length) {
            term.innerHTML = html + cursor;
            return;
        }

        const ch = parts[index++];
        html += ch;
        term.innerHTML = html + cursor;

        /* после перевода строки — пауза подольше, как будто команда выполняется */
        const delay = ch === "\n" ? 260 : 18 + Math.random() * 30;
        setTimeout(step, delay);
    }

    setTimeout(step, 400);
})();

/* ---------- Бриф ---------- */

(function () {
    const form = document.querySelector("#brief-form");
    if (!form) return;

    const done = document.querySelector(".brief__done");
    const errorBox = form.querySelector(".form__error");
    const consentBox = form.elements.consent;

    consentBox.addEventListener("change", () => consentBox.closest(".consent").classList.remove("is-invalid"));

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = form.elements.name;
        const contact = form.elements.contact;
        let error = "";

        name.classList.toggle("is-invalid", !name.value.trim());
        contact.classList.toggle("is-invalid", contact.value.trim().length < 4);

        if (!name.value.trim()) {
            error = "Напишите, как к вам обращаться.";
        } else if (contact.value.trim().length < 4) {
            error = "Оставьте Telegram, телефон или почту, чтобы я мог ответить.";
        } else if (!consentBox.checked) {
            consentBox.closest(".consent").classList.add("is-invalid");
            error = "Поставьте галочку согласия на обработку данных.";
        }

        errorBox.textContent = error;
        errorBox.hidden = !error;
        if (error) return;

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;

        /* имитация отправки: данные никуда не уходят */
        setTimeout(() => {
            button.disabled = false;
            done.querySelector("[data-contact]").textContent = contact.value.trim();
            form.hidden = true;
            done.hidden = false;
            done.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 600);
    });

    done.querySelector("[data-reset]").addEventListener("click", () => {
        form.reset();
        form.hidden = false;
        done.hidden = true;
    });
})();

/* ---------- Ссылки-заглушки не уводят наверх страницы ---------- */

document.querySelectorAll("[data-placeholder]").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
});
