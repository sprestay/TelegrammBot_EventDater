const api_token = '1256406675:AAGxKpXKK0JQ2L3e7O0LzAffFAsH1dpAs_4';
const { Telegraf } = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const registration_module = require('./scenes/registration/registration');
const event_module = require('./scenes/event/event_main');
const searchers = require('./search/event_search');
//END OF IMPORTS


//CONST BLOCK
const stage = new Stage();
const bot = new Telegraf(api_token);

//Bot use
bot.use(session());
bot.use(stage.middleware());
registration_module.registration(stage);
event_module.event_main(stage);
//

const inlineMessageRatingKeyboard = Markup.inlineKeyboard([
  Markup.callbackButton('👍', 'like'),
  Markup.callbackButton('👎', 'dislike')
]).extra()

// telegram.on('message', (ctx) => ctx.telegram.sendMessage(
//   ctx.from.id,
//   'Like?',
//   inlineMessageRatingKeyboard)
// )




bot.start((ctx) => {
  // if (ctx.session.user)
  //   ctx.reply("Привет, " + ctx.session.user.name + "!\n" + ctx.session.user.gender == 'male' ? 'Готов искать пару?)' : "Ты отлично выглядишь! Куда сегодня пойдем?)")
  // else {
  //   ctx.reply('Привет, давай регистрироваться');
  //   ctx.scene.enter('registration');
  // }
  ctx.reply('Hello!', inlineMessageRatingKeyboard);
  console.log(ctx.update.message.from.id);
});

bot.hears('query', async (ctx) => {//ctx.inlineQuery.query
  const searchResults = await searchers.event_searcher(city='msk', page=1);
  const results = searchResults && searchResults.length
  ? searchResults.map((event, id) => ({
    id,
    type: "article",
    title: event.title,
    // description: event.author,
    thumb_url: event.images[0].image,
    input_message_content: {
      message_text: createMessageText(event),
      parse_mode: "HTML"
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Show on site",
            url: event.images[0].source.link,
          }
        ]
      ]
    }
  }))
  : [];
// ctx.answerInlineQuery(results);
ctx.reply(results);
});

bot.action('like', (ctx) => {
  ctx.reply("here");
  ctx.scene.enter('eventMainMenu');
})
bot.on('inline_query', (ctx) => ctx.reply("Not supported"))

bot.hears('test', async ctx => menuMiddleware.replyToContext(ctx));
bot.hears('session', (ctx) => console.log(ctx.session))

bot.command('clear', (ctx) => ctx.session.user = null)
bot.launch()