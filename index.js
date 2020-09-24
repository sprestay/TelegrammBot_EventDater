const api_token = '1256406675:AAGxKpXKK0JQ2L3e7O0LzAffFAsH1dpAs_4';
const { Telegraf } = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const mongoose = require('mongoose');
const registration_module = require('./scenes/registration/registration');
const event_module = require('./scenes/event/event_main');
//END OF IMPORTS


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
const connect = mongoose.connect(db_url, { useNewUrlParser: true , useUnifiedTopology: true});
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
    ctx.reply('Привет, давай регистрироваться');
    ctx.scene.enter('registration');
  }
  // ctx.reply('Hello!', inlineMessageRatingKeyboard);
  // console.log(ctx.update.message.from.id);
});

bot.action('like', (ctx) => {
  ctx.reply("here");
  ctx.scene.enter('eventMainMenu');
})
bot.on('inline_query', (ctx) => ctx.reply("Not supported"))

bot.hears('session', (ctx) => ctx.telegram.getUserProfilePhotos(ctx.message.from.id).then(res => console.log(res)))

bot.command('clear', (ctx) => ctx.session.user = null)
bot.launch()