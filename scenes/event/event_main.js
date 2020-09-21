const WizardScene = require("telegraf/scenes/wizard");
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');
const searchers = require('../../search/event_search');

// Сделать первый символ строки заглавным
const make_first_char_capital = str => {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

// функции для рендера ивента
// slice на description от того, что KudaGo возвращает ответ с тэгами <p></p>
const display_event = event => {
    return `
    <strong>${make_first_char_capital(event.title)}</strong>
    <em>${event.description.slice(3,).slice(0, -4)}</em>
    -----------------------------------
    Тэги:
    ${event.tags.map(item => `<b><i>${make_first_char_capital(item)}</i></b>`).join(', ')}
    -----------------------------------
    `
}

// Базовая отрисовка inlineKeyboard.
const base_favourite_button = id => Extra.markup(Markup.inlineKeyboard([
    Markup.callbackButton('♡', 'add_' + id.toString())
]));

//Кнопка удаления из избранного
const delete_to_favourite_button = id => [[Markup.callbackButton('❤', 'del_' + id.toString())]];

//Кнопка добавления в избранное
const add_to_favourite_button = id => [[Markup.callbackButton('♡', 'add_' + id.toString())]];


function event_main(stage) {
// Поисковик (главное меню)
    const eventMainMenu = new Scene('eventMainMenu');
    stage.register(eventMainMenu);

    let cinema_page = 1;
    let events_page = 1;
    let restaurants = 1;
    let walk_page = 1;
    let msgs = [];

    eventMainMenu.start((ctx) => {
        ctx.reply('Раздел "Мероприятия"', Markup.keyboard([
            ['🎬 Кино','🎉 События'],
            ['🍷 Рестораны', '👫 Прогулки'],
        ]).resize().extra()
        )
    });

    // Кино
    eventMainMenu.hears('🎬 Кино', (ctx) => {
        // ctx.replyWithPhoto({url: "https://clck.ru/QwUFM"}, extra)
        // ctx.reply("123");
    });
// Попробуй добавить возможность входа по условию. Если получиться - делай декоратор

    // Ивенты
    eventMainMenu.hears('🎉 События', async ctx => {
        const data = await searchers.event_searcher(city='msk', page=events_page)
            .then(res => res.results
            .filter(item => item.tags.indexOf('детям') == -1)
            .map(item => {
                let fav = base_favourite_button(item.id.toString() + '_event');
                fav.caption = display_event(item);
                fav.parse_mode = 'HTML';
                return ctx.replyWithPhoto({
                    url: item.images[0].image
                },fav).then(res => msgs.push(res.message_id));
            })
        );

        Promise.all(data).then(() => {
            ctx.reply('В начало!', Extra.inReplyTo(msgs[0])
                                        .markup(Markup.inlineKeyboard([Markup.callbackButton('Следующая страница ➡', 'next')])));
        });
    });

    // Добавление в избранное
    eventMainMenu.action(new RegExp('^add_[0-9]+_(event|cinema|place)$'), ctx => {
        let id = ctx.match[0].split('_')[1]; // чистый id
        let type = ctx.match[0].split('_')[2]; // тип (ивент\кино\место)
        // Инициализируем хранилище
        if (!ctx.session.events)
            ctx.session.events = {
                event: [],
                cinema: [],
                place: [],
            }

        switch(type) {
            case ('event'):
                ctx.session.events.event.push(Number(id));
                break;
            case ('cinema'):
                ctx.session.events.cinema.push(Number(id));
                break;
            case ('place'):
                ctx.session.events.place.push(Number(id));
                break;
            default:
                return;
        }

        ctx.editMessageReplyMarkup({
            inline_keyboard: delete_to_favourite_button(id + '_' + type)
        });
    });

    // Удаление из избранного
    eventMainMenu.action(new RegExp('^del_[0-9]+_(event|cinema|place)$'), ctx => {
        let id = ctx.match[0].split('_')[1]; // чистый id
        let type = ctx.match[0].split('_')[2]; // тип (ивент\кино\место)
        // Если хранилища нет - валим
        if (!ctx.session.events)
            return;
        
        switch(type) {
            case ('event'):
                ctx.session.events.event = ctx.session.events.event.filter((item) => item != Number(id));
                break;
            case ('cinema'):
                ctx.session.events.cinema = ctx.session.events.cinema.filter((item) => item != Number(id));
                break;
            case ('place'):
                ctx.session.events.place = ctx.session.events.place.filter((item) => item != Number(id));
                break;
            default:
                return;
        }

        ctx.editMessageReplyMarkup({
            inline_keyboard: add_to_favourite_button(id + '_' + type)
        });
    })





    return {
        eventMainMenu: eventMainMenu,
    }
}
/*
Категории мест:
    Классика - theatre,concert-hall,cinema,comedy-club
    Загородом - suburb,stable,recreation
    По-пьяне - strip-club,clubs
    Погулять - sights,prirodnyj-zapovednik,photo-places,park,palace,homesteads,fountain,dogs,attractions,animal-shelters
    Поесть - restaurants,bar,anticafe,brewery
    Культура - museums,observatory,library,culture
    Движуха - dance-studio,questroom,amusement

Категории событий:
    Образовательные - business-events,education,tour
    Классика - cinema,concert,theater
    Развлечения - entertainment,quest,recreation
    Выставки - exhibition,festival,yarmarki-razvlecheniya-yarmarki
    Вечеринки - party,holiday
    Благотворительность - social-activity
*/

// bot.command('foo', (ctx) => {
    // const extra = Extra.markup(Markup.inlineKeyboard([
    //   Markup.urlButton('❤️', 'http://telegraf.js.org')
    // ]))
    // extra.caption = 'Caption text here'
//     return ctx.replyWithPhoto('http://lorempixel.com/400/200/cats/', extra)
//   })

// ctx.replyWithPhoto({ url: <pic-url> }, { caption: "cat photo" })
module.exports = {event_main}