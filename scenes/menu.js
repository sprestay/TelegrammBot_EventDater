const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');

// const eventMenu = flag => {
// if (flag)
//     return (
//         Markup.keyboard([
//             ['🎬 Кино','🎉 События'],
//             ['🍷 Рестораны', '👫 Прогулки'],
//             ['🏫 Главное меню', '❤ Избранное']
//         ]).resize().extra()
//     )
// else 
//     return (
//         Markup.keyboard([
//             ['🎬 Кино','🎉 События'],
//             ['🍷 Рестораны', '👫 Прогулки'],
//         ]).resize().extra()
//     )
// }

const eventMenu = () => {
        return ([
                [Markup.button('🎬 Кино'), Markup.button('🎉 События')],
                [Markup.button('🍷 Рестораны'), Markup.button('👫 Прогулки')],
                [Markup.button('🏫 Главное меню'), Markup.button('❤ Избранное')]
            ])
};

const mainMenu = () => {
    return ([
        [Markup.button('🔍 Поиск людей'), Markup.button('🎪 Поиск ивентов')],
        [Markup.button('👤 Профиль'), Markup.button('💕 Пары')]
    ])
}

module.exports = { eventMenu, mainMenu };