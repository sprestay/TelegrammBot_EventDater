const User = require('../../models/User');
const menuModule = require('../menu');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');
const searchers = require('../../search/people_search');


let users = []; // Сюда запишем все, что вернется из базы
let index = 0; // Тот профиль, который показываем сейчас
let previous = null;

const render_profile = async (ctx, person) => {
    if (previous)
        ctx.deleteMessage(previous);
    // Подбираем соовпадающие события
    let cinema = person.cinema.filter(item => ctx.session.user.cinema.indexOf(item) != -1);
    let place = person.place.filter(item => ctx.session.user.place.indexOf(item) != -1);
    let event = person.event.filter(item => ctx.session.user.event.indexOf(item) != -1);
    // Получаем названия событий
    cinema = cinema.length ? await searchers.get_description('cinema', cinema) : false;
    place = place.length ? await searchers.get_description('place', place) : false;
    event = event.length ? await searchers.get_description('event', event) : false;

    let cap = Extra.markup(Markup.inlineKeyboard([
        Markup.callbackButton('👍', 'like'),
        Markup.callbackButton('👎', 'dislike'),
    ]));

    cap.caption = `
    <b>${person.name.toUpperCase()}</b>,  <i>${person.age}</i>\n
    ${person.about.length > 1 ? person.about : ''}
    \n
    Как и ты, ${person.name} ${cinema ? 'хочет посмотреть:\n' + cinema + '\n' : '' } ${place ? 'хочет сходить:\n' + place + '\n': ''} ${event ? 'хочет посетить:\n' + event + '\n': ''}
    `;

    cap.parse_mode = 'HTML';
    ctx.replyWithPhoto(person.photo, cap).then(res => previous = res.message_id);
}

async function tinder(ctx) {
    if (users.length == 0) 
        users = await searchers.people_search(ctx.session.user);
    if (users.length == 0) {
        ctx.replyWithHTML("Прости, пока нету пользователей =(\n<b>Попробуй позднее</b>");
        return;
    }
    if (index < users.length) {
        render_profile(ctx, users[index]);
        index++;
    } else {
        ctx.deleteMessage(previous);
        ctx.replyWithHTML("Прости, пока нету пользователей =(\n<b>Попробуй позднее</b>");
        ctx.scene.leave();
    }
}

function peopleSearchScene(stage) {
    const peopleSearch = new Scene('peopleSearch');
    stage.register(peopleSearch);

    peopleSearch.action('like', ctx => {
        ctx.session.user.likes.push(users[index - 1].id);
        User.findOneAndUpdate({id: ctx.session.user.id}, {$push: {likes: users[index - 1].id}}).exec();
        tinder(ctx);
    });

    peopleSearch.action('dislike', ctx => {
        ctx.session.user.dislikes.push(users[index - 1].id);
        User.findOneAndUpdate({id: ctx.session.user.id}, {$push: {dislikes: users[index - 1].id}}).exec();
        tinder(ctx);
    });

    return peopleSearch;
}

module.exports = { tinder, peopleSearchScene };
//.answer_callback_query