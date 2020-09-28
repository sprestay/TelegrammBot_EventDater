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
}

module.exports = { eventMenu, mainMenu };