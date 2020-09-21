const Scene = require('telegraf/scenes/base');
// const session = require('telegraf/session');
const Markup = require('telegraf/markup');
// const Extra = require('telegraf/extra');

const inlineMessageRatingKeyboard = Markup.inlineKeyboard([
    Markup.callbackButton('Мужской', 'male'),
    Markup.callbackButton('Женский', 'female'),
]).extra()

function registerScenes(stage) {
// Про имя
    const reg_askForName = new Scene('reg_askForName');
        stage.register(reg_askForName);

    reg_askForName.on('text', async (ctx) => {
        if (ctx.message.text && ctx.message.text.length > 1 && new RegExp('[A-я]+', 'gi').test(ctx.message.text)) {
            ctx.session.user = {
                name: null,
                gender: null,
                age: null,
                photo: null,
            }
            ctx.session.user.name = ctx.message.text;
            ctx.reply("Приятно познакомиться, " + ctx.session.user.name);
            await ctx.scene.leave('reg_askForName');
            ctx.scene.enter('reg_askForGender');
            ctx.telegram.sendMessage(ctx.from.id, "Твой пол:",  inlineMessageRatingKeyboard);
        } else {
            ctx.reply("Эмм... Похоже в имени ошибка. Попробуй снова")
        }
    });
// Про пол
    const reg_askForGender = new Scene('reg_askForGender');
        stage.register(reg_askForGender);

    reg_askForGender.action('male', async (ctx) => {
        ctx.session.user.gender = 'male';
        await ctx.scene.leave('reg_askForGender');
        ctx.scene.enter('reg_askForAge');
        ctx.reply("Сколько тебе лет?");
    });

    reg_askForGender.action('female', async (ctx) => {
        ctx.session.user.gender = 'female';
        await ctx.scene.leave('reg_askForGender');
        ctx.scene.enter('reg_askForAge');
        ctx.reply("Сколько тебе лет?");
    });

    reg_askForGender.on('text', async (ctx) => {
        if (ctx.message.text.trim().toLowerCase() in ['female', 'male', 'м', 'ж', 'муж', 'жен', "женск", "мужской", "женский"]) {
            if (ctx.message.text.trim().toLowerCase() in ['male', 'м', "муж", "мужской"])
                ctx.session.user.gender = 'male';
            else ctx.session.user.gender = 'female';
            await ctx.scene.leave('reg_askForGender');
            ctx.scene.enter('reg_askForAge');
            ctx.reply("Сколько тебе лет?");
        } else {
            ctx.reply("Не понял тебя.\nЛучше просто нажми на кнопку)")
        }
    });
// Про возраст
    const reg_askForAge = new Scene('reg_askForAge');
        stage.register(reg_askForAge);

    reg_askForAge.on('text', async (ctx) => {
        let age = parseInt(ctx.message.text, 10);
        if (Number.isInteger(age) && age >= 18 && age <= 70) {
            ctx.reply(age.toString() + ', так и запишем');
            ctx.session.user.age = age;
            await ctx.scene.leave('reg_askForAge');
            ctx.scene.enter('reg_askForPhoto');
            ctx.reply('Последний шаг!\nСкинь фотку)');
        } else if (!Number.isInteger(age))
            ctx.reply("Что-то ты не то ввел" + сtx.session.user.gender == 'male' ? '' : 'a');
        else {
            ctx.reply("Общаюсь только с теми, кому от 18 до 70 лет.\nПрости, такие правила)");
            ctx.session.user = null;
            await ctx.scene.leave('reg_askForGender');
        }
    });

//Про фото
    const reg_askForPhoto = new Scene('reg_askForPhoto');
        stage.register(reg_askForPhoto);

        
    return {
        reg_askForName: reg_askForName,
        reg_askForGender: reg_askForGender,
        reg_askForAge: reg_askForAge,
        reg_askForPhoto: reg_askForPhoto,
    }
}


module.exports = {registerScenes};

