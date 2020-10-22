const User = require('../../models/User');
const Message = require('../../models/Message');
const menuModule = require('../menu');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');

async function getAllMessages(ctx) {
    let your_msgs = await Message.find({from: ctx.session.user.id, to: ctx.session.selected_for_chat});
    let not_your_msgs = await Message.find({from: ctx.session.selected_for_chat, to: ctx.session.user.id});
    
}

function chatScene(stage) {
    const chatScene = new Scene('chatScene');
    stage.register(chatScene);

    return chatScene;
}

module.exports = { chatScene };