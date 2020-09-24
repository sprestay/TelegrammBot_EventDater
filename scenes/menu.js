const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');

const eventMenu = flag => {
if (flag)
    return (
        Markup.keyboard([
            ['🎬 Кино','🎉 События'],
            ['🍷 Рестораны', '👫 Прогулки'],
            ['🏫 Главное меню', '❤ Избранное']
        ]).resize().extra()
    )
else 
    return (
        Markup.keyboard([
            ['🎬 Кино','🎉 События'],
            ['🍷 Рестораны', '👫 Прогулки'],
        ]).resize().extra()
    )
}

module.exports = { eventMenu };