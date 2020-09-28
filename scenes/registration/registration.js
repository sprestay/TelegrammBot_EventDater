const WizardScene = require("telegraf/scenes/wizard");
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const axios = require('axios');
const AWS = require('aws-sdk');
const stream = require('stream');
const User = require('../../models/User');
const menuModule = require('../menu');


const s3 = new AWS.S3({params: {Bucket: 'event-dater-tg'}});

const GenderKeyboard = 
  Extra.markup(Markup.inlineKeyboard([
    Markup.callbackButton('🚹 Мужской', 'male'),
    Markup.callbackButton('🚺 Женский', 'female')
  ]));

// Функция для загрузки на AWS S3
const uploadFromStream = (s3, key) => {
    var pass = new stream.PassThrough();
  
    var params = {Key: key.toString(), Body: pass};
    s3.upload(params, function(err, data) {
      console.log(err, data);
    });
    return pass;
  }


function registration(stage) {
  const register = new WizardScene(
    "registration",
    
    async (ctx) => {
      ctx.reply("Как тебя зовут?");
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text && ctx.message.text.length > 1 && new RegExp('[A-я]+', 'gi').test(ctx.message.text)) {
        ctx.session.user = {
            id: ctx.message.from.id,
            name: null,
            gender: null,
            age: null,
            about: null,
        }
        ctx.session.user.name = ctx.message.text;
        await ctx.reply("Приятно познакомиться, " + ctx.session.user.name);
        await ctx.reply("Твой пол:",  GenderKeyboard);
        return ctx.wizard.next();
    } else {
        ctx.reply("Эмм... Похоже в имени ошибка. Попробуй снова")
    }
  },
  // Пол

  (ctx) => {
    let callback = ctx.update.callback_query ? ctx.update.callback_query.data : ctx.message.text.trim().toLowerCase();

    if (['female', 'male', 'м', 'ж', 'муж', 'жен', "женск", "мужской", "женский"].indexOf(callback) != -1) {
      if (['male', 'м', "муж", "мужской"].indexOf(callback) != -1)
          ctx.session.user.gender = 1;
      else ctx.session.user.gender = 0;
      ctx.reply("Сколько тебе лет?");
      return ctx.wizard.next();
    } else {
        ctx.reply("Не понял тебя.\nЛучше просто нажми на кнопку)")
    }
  },
  // Возраст
    
    async (ctx) => {
      let age = parseInt(ctx.message.text, 10);
      if (Number.isInteger(age) && age >= 18 && age <= 70) {
          await ctx.reply(age.toString() + '..., так и запишем');
          ctx.session.user.age = age;

          //Проверка, есть ли фото профиля?
          let photo = await ctx.telegram.getUserProfilePhotos(ctx.message.from.id).then(res => res.photos[0]);
          if (photo)
            await ctx.reply('Давай загрузим фото', Extra.markup(Markup.inlineKeyboard([Markup.callbackButton("🎥 Использовать фото профиля", 'profile')])));
          else
            await ctx.reply('Давай загрузим фото');

          return ctx.wizard.next();
      } else if (!Number.isInteger(age))
          ctx.reply("Что-то ты не то ввел" + сtx.session.user.gender ? '' : 'a');
      else {
          ctx.reply("Общаюсь только с теми, кому от 18 до 70 лет.\nПрости, такие правила)");
          ctx.session.user = null;
          await ctx.scene.leave('registration');
      }
    },
    
    // Фото

    async (ctx) => { // Все меню должны удаляться. Нажатие на сторое меню роняет сервер
      let url = null;
      if (ctx.update.callback_query && ctx.update.callback_query.data == 'profile') {
          await ctx.telegram.getUserProfilePhotos(ctx.update.callback_query.from.id) // Как это отработает, если пользователь без фото?
            .then(res => res.photos[0][0].file_id)
            .then(id => {
              ctx.session.user.photo = id; // Сохраняем id на сервере telegram, s3 не нужен
              return ctx.telegram.getFileLink(id).then(src => url = src)
            });
      } else if (ctx.message.photo) {
          ctx.session.user.photo = ctx.message.photo[0].file_id; // Сохраняем id photo на сервере телеграмма
          await ctx.telegram.getFileLink(ctx.message.photo[0].file_id)
            .then(src => url = src);
      } else {
          ctx.reply("Неверный тип файла.");
          return;
      }
      // Сделать индикатор загрузки

      axios({url, responseType: 'stream'}).then(response => {
        return new Promise((res, rej) => {
          response.data.pipe(uploadFromStream(s3, ctx.session.user.id))
          .on('finish', () => {console.log("Successfully saved")})
          .on('error', error => console.log("ERROR WHILE SAVING", error));
        });
      });
    // Дописать условий и проверок
    ctx.reply("Фото получили.\nРасскажи немного о себе", Extra.markup(Markup.keyboard([Markup.button('🙅 Пропустить 🙅')])))
    return ctx.wizard.next();
  },

  // О себе
  async (ctx) => {
    if (ctx.message.text == '🙅 Пропустить 🙅') // Ужасное отображение на маленьких экранах - протестируй
      ctx.session.user.about = '';
    else ctx.session.user.about = ctx.message.text;
    await User.create(ctx.session.user); // Сохранили в базу
    ctx.reply("Отлично!\nДавай подберем для тебя интересные мероприятия!\nВыбери категорию из меню",
             {
               reply_markup: { 
                 keyboard: menuModule.eventMenu()
                } 
              });

    await ctx.scene.leave('registration');
    ctx.scene.enter('eventMainMenu');
  }
);
  stage.register(register);

  return register;
}

module.exports = {registration}