const api_token = '1256406675:AAGxKpXKK0JQ2L3e7O0LzAffFAsH1dpAs_4';
const { Telegraf } = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const mongoose = require('mongoose');
const registration_module = require('./scenes/registration/registration');
const event_module = require('./scenes/event/event_main');
const tinder_module = require('./scenes/dating/tinder');
const feedback_scene = require('./scenes/feedback/feedback');
const User = require('./models/User');
const menuModule = require('./scenes/menu');
//END OF IMPORTS
const Scene = require('telegraf/scenes/base');


//CONST BLOCK
const stage = new Stage();
const bot = new Telegraf(api_token);
const db_user = 'sprestay';
const db_password = 'xF9kibsAwCXWYbkF';
const db_name = 'event_dater_tg'
const db_url = `mongodb+srv://${db_user}:${db_password}@cluster0.oqvee.mongodb.net/${db_name}?retryWrites=true&w=majority`;


// Settings
bot.use(session());
bot.use(stage.middleware());
registration_module.registration(stage);
event_module.event_main(stage);
feedback_scene(stage);
tinder_module.peopleSearchScene(stage);
// DB connection
const connect = mongoose.connect(db_url, { useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false});
connect.then((success) => {
    console.log("Successfully connected to database");
}).catch((err) => console.log("ERROR: ", err));
//

bot.start(async (ctx) => {
  let id = ctx.update.message.from.id;
  ctx.session.user = await User.findOne({id: id}).exec();
  if (ctx.session.user)
    ctx.reply("Привет, " + ctx.session.user.name + "!\nРад тебя видеть", {
      reply_markup: {
        keyboard: menuModule.mainMenu(),
      }
    })
  else {
    ctx.reply('Привет, давай регистрироваться', Extra.markup(Markup.removeKeyboard()));
    ctx.scene.enter('registration');
  }
});

bot.command('feedback', async ctx => {
  ctx.replyWithHTML(`<b>Напиши, о чем ты хочешь сообщить.</b>\nЛюбая обртаная связь привеветствуется!)\n<i>Но помни, бот по-прежнему находится в разработке.</i>`);
  await ctx.scene.enter('FeedbackScene');
});


bot.hears('🔍 Поиск людей', async ctx => {
  ctx.session.user = {
    gender: true,
    cinema: [4112, 4319, 4517],
    place: [18778],
    event: [187857, 172178],
    id: 650882495,
    likes: [],
    dislikes: [],
  }
  tinder_module.tinder(ctx);
  await ctx.scene.enter('peopleSearch');
});

bot.hears('👤 Профиль', ctx => {
  ctx.reply("ON PROFILE COMPONENT");
});

bot.hears('💕 Пары', ctx => {
  ctx.reply("Компонент ПАРЫ");
});

bot.hears('🎪 Поиск ивентов', async ctx => {
  ctx.reply("Ну смотри, что есть", {
    reply_markup: {
      keyboard: menuModule.eventMenu()
    }
  })
  await ctx.scene.enter('eventMainMenu');
});

// ТЕСТ
bot.command('ignat', ctx => {
  ctx.telegram.sendMessage(650882495, 'Привет, Игнат');
})

const testScene = new Scene("testScene");
stage.register(testScene);

bot.hears("new_scene", ctx => ctx.scene.enter('testScene'));
testScene.hears("show", ctx=> ctx.reply("На тестовой сцене"));
bot.hears('show', ctx => ctx.reply("На главное сцене"));

User.watch().on('change', next => console.log("Изменения в базе", next));

bot.hears("users", async ctx => {
  User.find({}, function(err, users) {
    users.forEach(item => {
      ctx.replyWithHTML(`
      <b>Это ${item.name}</b>
      <a href="tg://user?id=${item.id}">клик</a>
      `)
    })
  })
})

//Подписка тест
// setInterval(function() {
//   bot.telegram.sendMessage(650882495, 'Из интервала');
// }, 10000);
//ТЕСТ

bot.command('clear', (ctx) => ctx.session.user = null)
bot.launch()


/// Пушить сообщения в бот
// await fetch('https://api.telegram.org/botTOKEN/sendMessage?text=TEST&chat_id=123456';)