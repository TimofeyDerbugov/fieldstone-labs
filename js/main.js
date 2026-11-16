/* ==========================================================
   Fieldstone Labs — терминал на первом экране и бриф
   Бриф уходит в Telegram через Cloudflare Worker (папка worker/,
   инструкция в README). Пока адрес не вписан или отправка не
   удалась, посетитель копирует текст брифа и пересылает в Telegram.
   ========================================================== */

/* Адрес воркера, например "https://fieldstone-brief.ВАШ-АККАУНТ.workers.dev".
   Пустая строка — отправка выключена, работает пересылка вручную. */
const BRIEF_ENDPOINT = "";

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

    const sent = document.querySelector('[data-done="sent"]');
    const manual = document.querySelector('[data-done="manual"]');
    const briefText = manual.querySelector("[data-brief-text]");
    const copyStatus = manual.querySelector("[data-copy-status]");
    const errorBox = form.querySelector(".form__error");
    const consentBox = form.elements.consent;
    const button = form.querySelector('button[type="submit"]');

    consentBox.addEventListener("change", () => consentBox.closest(".consent").classList.remove("is-invalid"));

    /* Что из формы попадает в бриф и под каким заголовком */
    const FIELDS = [
        ["type", "Что нужно"],
        ["business", "Бизнес"],
        ["current", "Сайт сейчас"],
        ["goal", "Задача"],
        ["refs", "Нравятся"],
        ["budget", "Бюджет"],
        ["deadline", "Срок"],
        ["name", "Имя"],
        ["contact", "Контакт"],
    ];

    function collect() {
        const data = {};
        FIELDS.forEach(([key]) => {
            data[key] = form.elements[key].value.trim();
        });
        data.consent = consentBox.checked;
        data.website = form.elements.website.value;
        return data;
    }

    function asText(data) {
        const lines = FIELDS
            .filter(([key]) => data[key])
            .map(([key, label]) => `${label}: ${data[key]}`);
        return ["Бриф с сайта Fieldstone Labs", "", ...lines].join("\n");
    }

    function show(block) {
        form.hidden = true;
        block.hidden = false;
        block.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(briefText.value);
            copyStatus.textContent = "Текст брифа скопирован. Откройте Telegram и вставьте его в чат со мной — отвечу в течение дня.";
        } catch (e) {
            briefText.focus();
            briefText.select();
            copyStatus.textContent = "Скопируйте текст брифа ниже и отправьте мне в Telegram — отвечу в течение дня.";
        }
    }

    async function send(data) {
        if (!BRIEF_ENDPOINT) return false;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(BRIEF_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                signal: controller.signal,
            });
            return response.ok;
        } catch (e) {
            return false;
        } finally {
            clearTimeout(timer);
        }
    }

    form.addEventListener("submit", async (event) => {
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

        const data = collect();
        button.disabled = true;
        button.textContent = "Отправляю…";

        const ok = await send(data);

        button.disabled = false;
        button.textContent = "Отправить бриф";

        if (ok) {
            sent.querySelector("[data-contact]").textContent = data.contact;
            show(sent);
        } else {
            briefText.value = asText(data);
            show(manual);
            copy();
        }
    });

    manual.querySelector("[data-copy]").addEventListener("click", copy);

    document.querySelectorAll("[data-reset]").forEach((reset) => {
        reset.addEventListener("click", () => {
            form.reset();
            form.hidden = false;
            sent.hidden = true;
            manual.hidden = true;
            form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
})();

/* ---------- Ссылки-заглушки не уводят наверх страницы ---------- */

document.querySelectorAll("[data-placeholder]").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
});
