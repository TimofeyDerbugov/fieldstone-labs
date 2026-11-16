/* ==========================================================
   Fieldstone Labs — приём брифа с сайта и отправка в Telegram
   Cloudflare Worker. Токен бота хранится в секретах воркера,
   в коде сайта его нет. Инструкция по запуску — в README.

   Переменные воркера (Settings → Variables and Secrets):
     BOT_TOKEN        секрет: токен бота от @BotFather
     CHAT_ID          секрет: ваш chat_id (куда слать брифы)
     ALLOWED_ORIGINS  текст: с каких сайтов принимать брифы,
                      через запятую, по умолчанию
                      https://timofeyderbugov.github.io
   ========================================================== */

const FIELDS = [
    ["type", "Что нужно", 60],
    ["business", "Бизнес", 300],
    ["current", "Сайт сейчас", 300],
    ["goal", "Задача", 1500],
    ["refs", "Нравятся", 600],
    ["budget", "Бюджет", 60],
    ["deadline", "Срок", 60],
    ["name", "Имя", 100],
    ["contact", "Контакт", 200],
];

export default {
    async fetch(request, env) {
        const allowed = (env.ALLOWED_ORIGINS || "https://timofeyderbugov.github.io")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const origin = request.headers.get("Origin") || "";

        const cors = {
            "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
            "Vary": "Origin",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: cors });
        }
        if (request.method !== "POST") {
            return reply({ ok: false, error: "method" }, 405, cors);
        }
        if (!allowed.includes(origin)) {
            return reply({ ok: false, error: "origin" }, 403, cors);
        }

        let data;
        try {
            data = await request.json();
        } catch (e) {
            return reply({ ok: false, error: "json" }, 400, cors);
        }
        if (!data || typeof data !== "object") {
            return reply({ ok: false, error: "json" }, 400, cors);
        }

        /* Поле-ловушка заполнено — это бот. Делаем вид, что всё хорошо. */
        if (data.website) {
            return reply({ ok: true }, 200, cors);
        }

        const value = (key, max) => String(data[key] ?? "").trim().slice(0, max);

        if (!value("name", 100) || value("contact", 200).length < 4 || data.consent !== true) {
            return reply({ ok: false, error: "fields" }, 400, cors);
        }

        const lines = FIELDS
            .map(([key, label, max]) => [label, value(key, max)])
            .filter(([, text]) => text)
            .map(([label, text]) => `<b>${label}:</b> ${escape(text)}`);

        const text = ["<b>Новый бриф с сайта</b>", "", ...lines, "", "Согласие на обработку данных: да"].join("\n");

        const telegram = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: env.CHAT_ID,
                text,
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }),
        });

        if (!telegram.ok) {
            return reply({ ok: false, error: "telegram" }, 502, cors);
        }
        return reply({ ok: true }, 200, cors);
    },
};

function reply(body, status, headers) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
    });
}

function escape(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
