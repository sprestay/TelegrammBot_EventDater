const Scene = require('telegraf/scenes/base');
const Feedback = require('../../models/Feedback');

function feedback_scene(stage) {
    const FeedbackScene = new Scene('FeedbackScene');
    stage.register(FeedbackScene);

    FeedbackScene.on('text', async ctx => {
        await Feedback.create({
            from: ctx.message.from.id,
            feedback: ctx.message.text,
        });
        ctx.reply("Ваше сообщение записано.\nБольшое спасибо!");
        await ctx.scene.leave();
    })
}

module.exports = feedback_scene;