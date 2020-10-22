const Scene = require('telegraf/scenes/base');
const Feedback = require('../../models/Feedback');
const Markup = require('telegraf/markup');

function feedback_scene(stage) {
    const FeedbackScene = new Scene('FeedbackScene');
    stage.register(FeedbackScene);

    FeedbackScene.on('text', async ctx => {
        await Feedback.create({
            from: ctx.message.from.id,
            feedback: ctx.message.text,
        });
        ctx.telegram.sendMessage(650882495, '<b>Новый фидбек - </b>' + ctx.message.text + ' пользователь - ' + ctx.message.from.id.toString());
        ctx.reply("Ваше сообщение записано.\nБольшое спасибо!");
        await ctx.scene.leave();
    })
}

module.exports = feedback_scene;