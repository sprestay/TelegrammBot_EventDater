const User = require('../../models/User');
const Message = require('../../models/Message');
const menuModule = require('../menu');
const pair_module = require('./pairs');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');

let your_msgs = [];
let not_your_msgs = [];
let msgs = [];

async function getAllMessages(ctx) {
    // your_msgs = await Message.find({from: ctx.session.user.id, to: ctx.session.selected_for_chat.id}).then(res => res.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp()));
    // not_your_msgs = await Message.find({from: ctx.session.selected_for_chat.id, to: ctx.session.user.id}).then(res => res.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp()));  
    await Promise.all([
        Message.find({from: ctx.session.user.id, to: ctx.session.selected_for_chat.id}).then(res => your_msgs = res),
        Message.find({from: ctx.session.selected_for_chat.id, to: ctx.session.user.id}).then(res => not_your_msgs = res)
    ]);
    your_msgs.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp());
    not_your_msgs.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp());

    let i = 0, j = 0;
    while (i < your_msgs.length && j < not_your_msgs.length) {
        if (your_msgs[i]._id.getTimestamp() < not_your_msgs[j]._id.getTimestamp()) {
            ctx.replyWithHTML("<b>Ты</b>\n" + your_msgs[i].text + "\n----------<i>" + your_msgs[i]._id.getTimestamp() + "</i>").then(res => msgs.push(res.message_id));
            i++;
        } else {
            ctx.replyWithHTML("<b>" + ctx.session.selected_for_chat.name + "</b>\n" + not_your_msgs[j].text + "\n----------<i>" + not_your_msgs[j]._id.getTimestamp() + "</i>").then(res => msgs.push(res.message_id));
            j++;
        }
    };
    while (i < your_msgs.length) {
        ctx.replyWithHTML("<b>Ты</b>\n" + your_msgs[i].text + "\n----------<i>" + your_msgs[i]._id.getTimestamp() + "</i>").then(res => msgs.push(res.message_id));
        i++;
    };
    while (j < not_your_msgs.length) {
        ctx.replyWithHTML("<b>" + ctx.session.selected_for_chat.name + "</b>\n" + not_your_msgs[j].text + "\n----------<i>" + not_your_msgs[j]._id.getTimestamp() + "</i>").then(res => msgs.push(res.message_id));
        j++;
    };
}

function chatScene(stage) {
    const chatScene = new Scene('chatScene');
    stage.register(chatScene);

    chatScene.hears("⬅ Назад ⬅", async ctx => {
        for (var msg of msgs)
            ctx.deleteMessage(msg);
        await ctx.replyWithHTML("<b>Пары:</b>", {
            reply_markup: {
                keyboard: menuModule.mainMenu(),
            }
          });
        pair_module.pair(ctx);
        await ctx.scene.enter('pairScene');
    });

    chatScene.on('text', async ctx => {
        console.log(pair_module);
        if (ctx.message.text && ctx.message.text.length > 0) {
            let cur_msg = {from: ctx.session.user.id, to: ctx.session.selected_for_chat.id, text: ctx.message.text}
            await Message.create(cur_msg);
            your_msgs.push(cur_msg);
        }
    });

    return chatScene;
}

module.exports = { chatScene, getAllMessages };