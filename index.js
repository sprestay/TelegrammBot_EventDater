const { Telegraf } = require('telegraf');
const config = require('./config'); // Поместите сюда пароли
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const mongoose = require('mongoose');
const registration_module = require('./scenes/registration/registration');
const feedback_scene = require('./scenes/feedback/feedback');
const User = require('./models/User');
//END OF IMPORTS


//CONST BLOCK
const stage = new Stage();
const bot = new Telegraf(config.api_token);
const db_url = `mongodb+srv://${config.db_user}:${config.db_password}@cluster0.oqvee.mongodb.net/${config.db_name}?retryWrites=true&w=majority`;


// Settings
bot.use(session());
bot.use(stage.middleware());
registration_module.registration(stage);
feedback_scene(stage);
// DB connection
const connect = mongoose.connect(db_url, { useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false});
connect.then((success) => {
    console.log("Successfully connected to database");
}).catch((err) => console.log("ERROR: ", err));
//

bot.start(async (ctx) => {
  let id = ctx.update.message.from.id;
  ctx.session.user = await User.findOne({id: id}).exec();
  if (false) //ctx.session.user 
    ctx.replyWithHTML(`Привет, ${ctx.session.user.name}! 👋 Рад тебя видеть)
    \nК сожалению я по-прежнему в разработке 😞, но ты будешь ${ctx.session.user.gender ? 'первым' : 'первой'}, кому я сообщу, когда все будет готово😉
    \nЕсли у тебя есть вопросы или предложения - воспользуйся 👉/feedback 👈`)
  else {
    ctx.replyWithHTML(`
    Привет 👋, друг!
    Если порой ты отказываешься от похода на интересное мероприятие 🎈, потому что не с кем 😢,
    или никак не можешь найти свою вторую половинку и разочаровался в сайтах знакомств - ты по адресу 💋!
    Я бот 🤖, созданный чтобы решить эти трудности. 💪
    Для начала, давай познакомимся.  
    `, Extra.markup(Markup.removeKeyboard()));
    ctx.scene.enter('registration');
  }
});

bot.command('feedback', async ctx => {
  ctx.replyWithHTML(`✏<b>Напиши, о чем ты хочешь сообщить.</b>✏\nЛюбая обртаная связь привеветствуется!)\n`);
  await ctx.scene.enter('FeedbackScene');
});

bot.on('text', ctx => {
  ctx.replyWithHTML(`Я все еще в разработке 😞, но ты будешь ${ctx.session.user.gender ? 'первым' : 'первой'}, кому я сообщу, когда все будет готово😉
  \nЕсли у тебя есть вопросы или предложения - воспользуйся 👉/feedback 👈`)
});


bot.launch();