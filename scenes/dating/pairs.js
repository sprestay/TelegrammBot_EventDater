const User = require('../../models/User');
const menuModule = require('../menu');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');
const chatModule = require('./chat');


let users = [];
let previous = null;
let index = 0;

const render_profile = async (ctx, person) => { // вынести в отдельную функцию. Меняется только менюшка
    if (previous)
        ctx.deleteMessage(previous);
    let cap = index == 0 ? menuModule.pairMenu('start') : (index == users.length - 1 ? menuModule.pairMenu('end') : menuModule.pairMenu());

    cap.caption = `
    <b>${person.name.toUpperCase()}</b>,  <i>${person.age}</i>\n
    ${person.about.length > 1 ? person.about : ''}
    \n
    `;

    cap.parse_mode = 'HTML';
    ctx.replyWithPhoto(person.photo, cap).then(res => previous = res.message_id);
}


async function pair(ctx) {
    if (users.length == 0) 
        users = await User.find({id: { $in: ctx.session.user.pairs }});
    if (users.length == 0) {
        ctx.reply("У тебя еще нет пар =(");
        await ctx.scene.leave('pairScene');
        return;
    };
    if (index < users.length) {
        render_profile(ctx, users[index]);
    } else {
        ctx.deleteMessage(previous);
        ctx.replyWithHTML('У тебя еще нет пар =(');
        ctx.scene.leave();
    }
}

function pairScene(stage) {
    const pairScene = new Scene('pairScene');
    stage.register(pairScene);

    pairScene.action('next', ctx => {
        index++;
        render_profile(ctx, users[index]);
    });

    pairScene.action('back', ctx => {
        index--;
        render_profile(ctx, users[index]);
    });

    pairScene.action('chat', async ctx => {
        await ctx.replyWithHTML("<b>Чат с " + users[index].name + "</b>", Extra.markup(Markup.keyboard([Markup.button("⬅ Назад ⬅")])));
        ctx.session.selected_for_chat = users[index];
        chatModule.getAllMessages(ctx);
        await ctx.scene.enter('chatScene');
    });

    return pairScene;
}

module.exports = { pair, pairScene };