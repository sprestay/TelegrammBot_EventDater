const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');
const searchers = require('../../search/event_search');
const User = require('../../models/User');
const menuModule = require('../menu');

// Сделать первый символ строки заглавным
const make_first_char_capital = str => {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

let cinema_page = 1;
let events_page = 1;
let restaurants = 1;
let walk_page = 1;
let msgs = [];
let error_info = []; // В этот массив записываем id сообщений об ошибках, чтобы по 100 раз не писать одно и то же


// функции для рендера ивента
// slice на description от того, что KudaGo возвращает ответ с тэгами <p></p>
const display_event = (event, type) => {
    if (type != 'cinema')
        return `
        <strong>${make_first_char_capital(event.title)}</strong>
        <em>${event.description.replace(new RegExp('(<p>|<\/p>)', 'g'), '')}</em>
        -----------------------------------
        Тэги:
        ${event.tags.map(item => `<b><i>${make_first_char_capital(item)}</i></b>`).join(', ')}
        -----------------------------------
        `
    else if (type == 'cinema')
        return `
        <strong>${event.title}</strong>
        <em>${event.year}</em>
        Режиссер: ${event.director}
        -----------------------------------
        Жанры:
        ${event.genres.map(item => `<b><i>${make_first_char_capital(item.name)}</i></b>`).join(', ')}
        -----------------------------------
        Подробнее: <a href="${event.imdb_url}">${event.title}</a>
        `
}

// Базовая отрисовка inlineKeyboard.
const base_favourite_button = (id, is_favourite) => Extra.markup(Markup.inlineKeyboard([
    is_favourite ? Markup.callbackButton('❤', 'del_' + id.toString()) : Markup.callbackButton('♡', 'add_' + id.toString())
]));

//Кнопка удаления из избранного
const delete_to_favourite_button = id => [[Markup.callbackButton('❤', 'del_' + id.toString())]];

//Кнопка добавления в избранное
const add_to_favourite_button = id => [[Markup.callbackButton('♡', 'add_' + id.toString())]];

// Поиск ивента
const search_for_events = (ctx) => {
    return (
        searchers.event_searcher(city='msk', page=events_page)
        .then(res => res.results
        .filter(item => item.tags.indexOf('детям') == -1)
        .map(item => {
            //Проверим, есть ли у нас этот ивент, или нет
            let is_favourite = false;
            if (ctx.session.events)
                is_favourite = ctx.session.events.event.indexOf(item.id) == -1 ? false : true;
            //Передадим флаг проверки в функцию, для отрисовки меню
            let fav = base_favourite_button(item.id.toString() + '_event', is_favourite);
            fav.caption = display_event(item, 'event');
            fav.parse_mode = 'HTML';
            return ctx.replyWithPhoto({
                url: item.images[0].image
            },fav).then(res => msgs.push(res.message_id));
        }))
    )
}

// Поиск фильма
const search_for_movies = (ctx) => {
    return (
        searchers.cinema_searcher(city='msk', page=cinema_page)
        .then(res => res.results
        .map(item => {
            let is_favourite = false;
            if (ctx.session.events)
                is_favourite = ctx.session.events.cinema.indexOf(item.id) == -1 ? false : true;
            let fav = base_favourite_button(item.id.toString() + '_cinema', is_favourite);
            fav.caption = display_event(item, 'cinema');
            fav.parse_mode = 'HTML';
            return ctx.replyWithPhoto({
                url: item.images[0].image
            }, fav).then(res => msgs.push(res.message_id));
        }))
    )
}

// Поиск прогулок
const search_for_walk = (ctx) => {
    return (
        searchers.walk_searcher(city='msk', page=walk_page)
        .then(res => res.results
        .map(item => {
            let is_favourite = false;
            if (ctx.session.events)
                is_favourite = ctx.session.events.place.indexOf(item.id) == -1 ? false : true;
            let fav = base_favourite_button(item.id.toString() + '_placew', is_favourite);
            fav.caption = display_event(item, 'placew');
            fav.parse_mode = 'HTML';
            return ctx.replyWithPhoto({
                url: item.images[0].image
            }, fav).then(res => msgs.push(res.message_id));
        }))
    )
}

const search_for_restaurants = (ctx) => {
    return (
        searchers.restaurants_search(city='msk', page=restaurants)
        .then(res => res.results
        .map(item => {
            let is_favourite = false;
            if (ctx.session.events)
                is_favourite = ctx.session.events.place.indexOf(item.id) == -1 ? false : true;
            let fav = base_favourite_button(item.id.toString() + '_placer', is_favourite);
            fav.caption = display_event(item, 'placer');
            fav.parse_mode = 'HTML';
            return ctx.replyWithPhoto({
                url: item.images[0].image
            }, fav).then(res => msgs.push(res.message_id));
        }))
    )
}

// Сменить страницу
const change_page = async (ctx, query_func, next, type) => {
    // Удаляем предыдущие сообщения
    for (let msg of msgs)
        ctx.deleteMessage(msg);
    // Увеличиваем счетчик страниц
    switch(type) {
        case('event'):
            next ? events_page++ : events_page--;
            break;
        case('cinema'):
            next ? cinema_page++ : events_page--;
            break;
        case('placer'):
            next ? restaurants++ : restaurants--;
            break;
        case('placew'):
            next ? walk_page++ : walk_page--;
            break;
        default:
            return;
    }
    msgs = [];
    // Новый запрос - новая отрисовка
    let data = await query_func(ctx);
    navigation_buttons(data, ctx, type);
}

//Навигационные кнопки
const navigation_buttons = (data, ctx, type) => {

    let counter = -1;

    switch (type) {
        case ('event'):
            counter = events_page;
            break;
        case ('cinema'):
            counter = cinema_page;
            break;
        case ('placew'):
            counter = walk_page;
            break;
        case ('placer'):
            counter = restaurants;
            break;
    }

    Promise.all(data).then(() => {
        ctx.reply('В начало!', counter > 1 ?
                                    Extra.inReplyTo(msgs[0])
                                    .markup(Markup.inlineKeyboard([
                                        Markup.callbackButton('⬅ Предыдущая страница', 'back_' + type),
                                        Markup.callbackButton('Следующая страница ➡', 'next_' + type),
                                    ])) 
                                    :
                                    Extra.inReplyTo(msgs[0])
                                    .markup(Markup.inlineKeyboard([
                                        Markup.callbackButton('Следующая страница ➡', 'next_' + type)
                                    ]))
                                    ).then(res => msgs.push(res.message_id));
    });
}

// Фукнция на экспорт
// Обработчики событий на сцене
function event_main(stage) {
// Поисковик (главное меню)
    const eventMainMenu = new Scene('eventMainMenu');
    stage.register(eventMainMenu);

    // Кино
    eventMainMenu.hears('🎬 Кино', async ctx => {
        for (let msg of msgs)
            ctx.deleteMessage(msg);
        msgs = [];
        let data = await search_for_movies(ctx);
        navigation_buttons(data, ctx, 'cinema');
    });

    // Ивенты
    eventMainMenu.hears('🎉 События', async ctx => {
        for (let msg of msgs)
            ctx.deleteMessage(msg);
        msgs = [];
        let data = await search_for_events(ctx);
        navigation_buttons(data, ctx, 'event');
    });

    // Прогулки
    eventMainMenu.hears('👫 Прогулки', async ctx => {
        for (let msg of msgs)
            ctx.deleteMessage(msg);
        msgs = [];
        let data = await search_for_walk(ctx);
        navigation_buttons(data, ctx, 'placew');
    });

    // Рестораны
    eventMainMenu.hears('🍷 Рестораны', async ctx => {
        for (let msg of msgs)
            ctx.deleteMessage(msg);
        msgs = [];
        let data = await search_for_restaurants(ctx);
        navigation_buttons(data, ctx, 'placer');
    });

    //Главное меню
    eventMainMenu.hears('🏫 Главное меню', async ctx => {
        let e = ctx.session.events;
        if (e && (e.event.length + e.cinema.length + e.place.length)) {
            ctx.reply('"Главное меню"', {
                reply_markup: {
                    keyboard: menuModule.mainMenu(),
                    resize_keyboard: true,
                }
            })
            await ctx.scene.leave('eventMainMenu');
        } else {
            for (let error of error_info) // Удаляем прошлые сообщения об ошибках
                ctx.deleteMessage(error);
            ctx.reply('Нужно выбрать хотя бы 1 событие, чтобы мы могли найти тебе пару').then(res => error_info.push(res.message_id));
        }
    });

    //Профиль
    eventMainMenu.hears('❤ Избранное', ctx => {

    });

    //Навигация по страницам
    eventMainMenu.action(new RegExp('^next_(event|cinema|placew|placer)$'), ctx => {
        let type = ctx.match[0].split('_')[1];
        switch(type) {
            case ('event'):
                change_page(ctx, search_for_events, true, type);
                break;
            case ('cinema'):
                change_page(ctx, search_for_movies, true, type);
                break;
            case ('placew'):
                change_page(ctx, search_for_walk, true, type);
                break;
            case ('placer'):
                change_page(ctx, search_for_restaurants, true, type);
                break;
            default:
                return;
        }
    });

    eventMainMenu.action(new RegExp('^back_(event|cinema|placew|placer)$'), async ctx => {
        let type = ctx.match[0].split('_')[1];
        switch(type) {
            case ('event'):
                change_page(ctx, search_for_events, false, type);
                break;
            case ('cinema'):
                change_page(ctx, search_for_movies, false, type);
                break;
            case ('placew'):
                change_page(ctx, search_for_walk, false, type);
                break;
            case ('placer'):
                change_page(ctx, search_for_restaurants, false, type);
                break;
            default:
                return;
        }
    });

    // Добавление в избранное
    eventMainMenu.action(new RegExp('^add_[0-9]+_(event|cinema|placew|placer)$'), async ctx => {
        let id = ctx.match[0].split('_')[1]; // чистый id
        let type = ctx.match[0].split('_')[2]; // тип (ивент\кино\место)
        // Инициализируем хранилище
        if (!ctx.session.events) {
            ctx.session.events = {
                event: [],
                cinema: [],
                place: [],
            }
        }

        switch(type) {
            case ('event'):
                ctx.session.events.event.push(Number(id));
                User.findOneAndUpdate({id: ctx.session.user.id}, {event: ctx.session.events.event}).exec();
                break;
            case ('cinema'):
                ctx.session.events.cinema.push(Number(id));
                User.findOneAndUpdate({id: ctx.session.user.id}, {cinema: ctx.session.events.cinema}).exec();
                break;
            case ('placer'):
            case ('placew'):
                ctx.session.events.place.push(Number(id));
                User.findOneAndUpdate({id: ctx.session.user.id}, {place: ctx.session.events.place}).exec();
                break;
            default:
                return;
        }
        
        ctx.editMessageReplyMarkup({
            inline_keyboard: delete_to_favourite_button(id + '_' + type),
        });
    });

    // Удаление из избранного
    eventMainMenu.action(new RegExp('^del_[0-9]+_(event|cinema|placew|placer)$'), ctx => {
        let id = ctx.match[0].split('_')[1]; // чистый id
        let type = ctx.match[0].split('_')[2]; // тип (ивент\кино\место)
        // Если хранилища нет - валим
        if (!ctx.session.events)
            return;
        
        switch(type) {
            case ('event'):
                ctx.session.events.event = ctx.session.events.event.filter((item) => item != Number(id));
                User.findOneAndUpdate({id: ctx.session.user.id}, {event: ctx.session.events.event}).exec();
                break;
            case ('cinema'):
                ctx.session.events.cinema = ctx.session.events.cinema.filter((item) => item != Number(id));
                User.findOneAndUpdate({id: ctx.session.user.id}, {cinema: ctx.session.events.cinema}).exec();
                break;
            case ('placer'):
            case ('placew'):
                ctx.session.events.place = ctx.session.events.place.filter((item) => item != Number(id));
                User.findOneAndUpdate({id: ctx.session.user.id}, {event: ctx.session.events.event}).exec();
                break;
            default:
                return;
        }

        ctx.editMessageReplyMarkup({
            inline_keyboard: add_to_favourite_button(id + '_' + type)
        });
    });

    return {
        eventMainMenu: eventMainMenu,
    }
}

module.exports = {event_main}