const api_token = '1256406675:AAGxKpXKK0JQ2L3e7O0LzAffFAsH1dpAs_4';
const { Telegraf } = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const mongoose = require('mongoose');
const registration_module = require('./scenes/registration/registration');
const event_module = require('./scenes/event/event_main');
const User = require('./models/User');
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
// DB connection
const connect = mongoose.connect(db_url, { useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false});
connect.then((success) => {
    console.log("Successfully connected to database");
}).catch((err) => console.log("ERROR: ", err));
//

const inlineMessageRatingKeyboard = Markup.inlineKeyboard([
  Markup.callbackButton('👍', 'like'),
  Markup.callbackButton('👎', 'dislike')
]).extra()


bot.hears("find_me", ctx => console.log(ctx.message.from.id));
bot.hears("get", ctx => ctx.telegram.getUserProfilePhotos(ctx.message.from.id)
                        .then(res => console.log(res.photos)));



bot.start((ctx) => {
  if (ctx.session.user)
    ctx.reply("Привет, " + ctx.session.user.name + "!\n" + ctx.session.user.gender ? 'Готов искать пару?)' : "Ты отлично выглядишь! Куда сегодня пойдем?)")
  else {
    ctx.reply('Привет, давай регистрироваться', Extra.markup(Markup.removeKeyboard()));
    ctx.scene.enter('registration');
  }
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