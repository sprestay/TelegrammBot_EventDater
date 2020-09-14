const api_token = '1256406675:AAGxKpXKK0JQ2L3e7O0LzAffFAsH1dpAs_4';
const { Telegraf } = require('telegraf');
const {MenuTemplate, MenuMiddleware} = require('telegraf-inline-menu');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const registration_module = require('./registration/registration');
const searchers = require('./search/event_search');


const stage = new Stage();
const bot = new Telegraf(api_token);
registration_module.registration(stage);

bot.use(session());
bot.use(stage.middleware());

const createMessageText = event => {
  return `
      <strong>${event.title}</strong>
      <a href="${event.images[0].source.link}">&#8205;</a>`;
};

bot.start((ctx) => {
  if (ctx.session.user)
    ctx.reply("Привет, " + ctx.session.user.name + "!\n" + ctx.session.user.gender == 'male' ? 'Готов искать пару?)' : "Ты отлично выглядишь! Куда сегодня пойдем?)")
  else {
    ctx.reply('Привет, давай регистрироваться');
    ctx.scene.enter('registration');
  }
});

bot.hears('query', async (ctx) => {//ctx.inlineQuery.query
  const searchResults = await searchers.event_searcher(by='', query='a', filter={city: 'msk', free: false});
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

bot.on('inline_query', (ctx) => ctx.reply("Not supported"))

bot.hears('test', (ctx) => ctx.reply('to-to'))

bot.command('clear', (ctx) => ctx.session.user = null)
bot.launch()