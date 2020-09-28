const User = require('../../models/User');
const menuModule = require('../menu');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');
const searchers = require('../../search/people_search');
// const AWS = require('aws-sdk');
// const fs = require('fs');


// const s3 = new AWS.S3({params: {Bucket: 'event-dater-tg'}});

let users = []; // Сюда запишем все, что вернется из базы
let index = 0; // Тот профиль, который показываем сейчас

const render_profile = async (ctx, user) => {
    // Подбираем соовпадающие события
    let cinema = user.cinema.filter(item => ctx.session.user.cinema.indexOf(item) != -1);
    let place = user.place.filter(item => ctx.session.user.place.indexOf(item) != -1);
    let event = user.event.filter(item => ctx.session.user.event.indexOf(item) != -1);
    // Получаем названия событий
    cinema = cinema.length ? await searchers.get_description('cinema', cinema) : false;
    place = place.length ? await searchers.get_description('place', place) : false;
    event = event.length ? await searchers.get_description('event', event) : false;

    let cap = Extra.markup(Markup.inlineKeyboard([
        Markup.callbackButton('👍', 'like'),
        Markup.callbackButton('👎', 'dislike'),
    ]));

    cap.caption = `
    <b>${user.name.toUpperCase()}</b>,  <i>${user.age}</i>\n
    ${user.about.length > 1 ? user.about : ''}
    \n
    Как и ты, ${user.name} ${cinema ? 'хочет посмотреть:\n' + cinema + '\n' : '' } ${place ? 'хочет сходить:\n' + place + '\n': ''} ${event ? 'хочет посетить:\n' + event + '\n': ''}
    `;

    cap.parse_mode = 'HTML';
    ctx.replyWithPhoto(user.photo, cap);
}

async function tinder(ctx) {
    console.log("In fucntion")
    if (users.length == 0)
        users = await searchers.people_search(ctx.session.user);
    if (users.length == 0) {
        ctx.replyWithHTML("Прости, пока нету пользователей =(\n<b>Попробуй позднее</b>");
        return;
    }
    // s3.getObject({Key: users[0].id.toString()}, function(err, data) {
    //     if (err)
    //         console.log("ERROR", err);
    //     fs.writeFileSync('test.png', data.Body)
    // });
    render_profile(ctx, users[index]);
    index++;
}

module.exports = tinder;
//.answer_callback_query