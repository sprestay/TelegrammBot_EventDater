const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');

const eventMenu = () => {
        return ([
                [Markup.button('🎬 Кино'), Markup.button('🎉 События')],
                [Markup.button('🍷 Рестораны'), Markup.button('👫 Прогулки')],
                [Markup.button('🏫 Главное меню'), Markup.button('❤ Избранное')]
            ])
};

const mainMenu = () => {
    return ([
        [Markup.button('🔍 Поиск людей'), Markup.button('💕 Пары')],
        [Markup.button('👤 Профиль'), Markup.button('🎪 Поиск ивентов')]
    ])
};

const tinderMenu = Extra.markup(Markup.inlineKeyboard([
    Markup.callbackButton('👍', 'like'),
    Markup.callbackButton('👎', 'dislike'),
]));

const pairMenu = (flag) => {
    if (flag == 'start')
        return Extra.markup(Markup.inlineKeyboard([
            [Markup.callbackButton('💬Чат 💬', 'chat')],
            [Markup.callbackButton('➡️ Вперед ➡️', 'next')]
        ]));
    else if (flag == 'end')
        return Extra.markup(Markup.inlineKeyboard([
            [Markup.callbackButton('💬Чат 💬', 'chat')],
            [Markup.callbackButton('⬅️ Назад ⬅️', 'back')]
        ]));
    else 
        return Extra.markup(Markup.inlineKeyboard([
            [Markup.callbackButton('💬Чат 💬', 'chat')],
            [Markup.callbackButton('⬅️ Назад ⬅️', 'back'), Markup.callbackButton('➡️ Вперед ➡️', 'next')]
        ]));
}

module.exports = { eventMenu, mainMenu, tinderMenu, pairMenu };