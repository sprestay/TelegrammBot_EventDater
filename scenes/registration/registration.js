const WizardScene = require("telegraf/scenes/wizard");
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const axios = require('axios');
const AWS = require('aws-sdk');
const User = require('../../models/User');


const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27', region: 'us-east-1',});

const GenderKeyboard = 
   Extra.markup(Markup.inlineKeyboard([
      Markup.callbackButton('🚹 Мужской', 'male'),
      Markup.callbackButton('🚺 Женский', 'female')
    ]));

let message_with_inline_for_change = null;

function registration(stage) {
  const register = new WizardScene(
    "registration",
    
    async (ctx) => {
      ctx.replyWithHTML("<b>Как тебя зовут?</b>");
      return ctx.wizard.next();
    },
    async (ctx) => {
      let text = ctx.message && ctx.message.text ? ctx.message.text.trim() : null; // Не учитываем имя из нескольких слов
      if (text && text.length > 1 && new RegExp('^[А-я]+$', 'gi').test(text)) {
        ctx.session.user = {
            id: ctx.message.from.id,
            name: null,
            gender: null,
            age: null,
            about: null,
            likes: [],
            dislikes: [],
            pairs: [],
        }
        ctx.session.user.name = text[0].toUpperCase() + text.toLowerCase().slice(1,);
        await ctx.reply("Приятно познакомиться, " + ctx.session.user.name);
        await ctx.replyWithHTML("<b>Твой пол:</b>",  GenderKeyboard ).then(res => message_with_inline_for_change = res.message_id);
        return ctx.wizard.next();
      } else {
          ctx.reply("Эмм... Похоже в имени ошибка. Попробуй снова")
      }
    },
  // Пол

  (ctx) => {
    let callback = ctx.update.callback_query ? ctx.update.callback_query.data : ctx.update.message.text;
    if (callback)
      callback = callback.trim().toLowerCase();

    if (['female', 'male', 'м', 'ж', 'муж', 'жен', "женск", "мужской", "женский"].indexOf(callback) != -1) {
      if (['male', 'м', "муж", "мужской"].indexOf(callback) != -1) {
        ctx.session.user.gender = 1;
        ctx.telegram.editMessageText(ctx.session.user.id, message_with_inline_for_change, undefined, 'Пол', { reply_markup: 
          { inline_keyboard: [[Markup.callbackButton('✔ 🚹 Мужской ✔', 'male')]] }
        });
      }
      else {
        ctx.session.user.gender = 0;
        ctx.telegram.editMessageText(ctx.session.user.id, message_with_inline_for_change, undefined, 'Пол', { reply_markup: 
          { inline_keyboard: [[Markup.callbackButton('✔ 🚺 Женский ✔', 'female')]] }
        });
      }
      ctx.replyWithHTML("<b>Сколько тебе лет?</b>");
      return ctx.wizard.next();
    } else {
        ctx.reply("Не понял тебя.\nЛучше просто нажми на кнопку)")
    }
  },
  // Возраст
    
    async (ctx) => {
      let age = ctx && ctx.message && ctx.message.text ? parseInt(ctx.message.text, 10) : null;
      if (age && Number.isInteger(age) && age >= 18 && age <= 70) {
          await ctx.reply(age.toString() + '..., так и запишем');
          ctx.session.user.age = age;

          //Проверка, есть ли фото профиля?
          let photo = await ctx.telegram.getUserProfilePhotos(ctx.message.from.id).then(res => res.photos[0]);
          if (photo)
            await ctx.replyWithHTML('<b>Давай загрузим фото</b>', Extra.markup(Markup.inlineKeyboard([Markup.callbackButton("🎥 Использовать фото профиля", 'profile')])));
          else
            await ctx.replyWithHTML('<b>Давай загрузим фото</b>');

          return ctx.wizard.next();
      } else if (!age || !Number.isInteger(age)) { // если age == null, значит пользователь скинул что-то, или не Number, значит ввел фигню
          let sub_end = ctx.session.user.gender ? '' : 'a';
          ctx.reply("Что-то ты не то ввел" + sub_end);
      } else {
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
              ctx.session.user.photo = id; // Сохраняем id на сервере telegram. То, что сохраняем ДО проверок содержимого - не страшно, в базу пишем только на след.шаге
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
      await ctx.reply("Проверяем фото.... Подожди")
      // Загружаем фото. С помощью AWS проверяем что на фото человек, и нет порнухи
      axios({url, responseType: 'arraybuffer'}).then(async response => {
        // Проверка, что человек
              rekognition.detectFaces({Image: {
                  Bytes: Buffer.from(response.data),
              }}, 
              function(err, data) {
                    if (err) console.log(err, err.stack);
                    else {
                        let res = data.FaceDetails;
                        if (res.length > 0 && res[0].Confidence > 80) {
                          rekognition.detectModerationLabels({Image: { //Если на фото человек - проверяем на цензуру
                              Bytes: Buffer.from(response.data),
                          }}, function(err, data) {
                              if (err) console.log(err, err.stack);
                              else {
                                  let res = data.ModerationLabels;
                                  if (res.length == 0 || res[0].Name == 'Suggestive' || res[0].Name =='Female Swimwear Or Underwear') {
                                      ctx.replyWithHTML("Фото установлено.\n<b>Где ты живешь?</b>", Extra.markup(Markup.inlineKeyboard([[
                                        Markup.callbackButton('Москва', 'msk'),
                                        Markup.callbackButton('Питер', 'spb'),
                                        Markup.callbackButton('Другое', 'another'),
                                      ]])));
                                      return ctx.wizard.next();
                                  } else {
                                      ctx.reply('Так! Вот без порнухи, пожалуйста');
                                      return;
                                  }
                              }
                          });
                        }
                        else {
                          ctx.reply('На фото должно быть видно лицо, я ведь бот для знакомств)');
                          return;
                        }
                    }    
              });
      });
  },

  // Геолокация
  async (ctx) => {
    let msg = ctx.update.callback_query ? ctx.update.callback_query.data : ctx.update.message.text;
    if (msg && new RegExp('^[A-я]+$', 'gi').test(msg)) {
      msg = msg.trim().toLowerCase();
      if (['мск', 'москва', 'моск', 'moscow', 'msk',].indexOf(msg) != -1)
        msg = 'msk';
      if (['spb', 'спб', "питер", "санкт-петербург", "ленинград", "saint-petersburg", "piter"].indexOf(msg) != -1)
        msg = 'spb';
      ctx.session.user.location = msg;
      ctx.replyWithHTML("Последний шаг!)\n<b>Расскажи немного о себе</b>", Extra.markup(Markup.keyboard([Markup.button('🙅 Пропустить 🙅')]).resize()))
      return ctx.wizard.next();
    } else {
      ctx.reply("Некорректное название города");
      return;
    }
  },
  
  // О себе
  async (ctx) => { // убрать возможность закидывать файлы
    if (ctx.message && ctx.message.text) {
      if (ctx.message.text == '🙅 Пропустить 🙅')
        ctx.session.user.about = '';
      else
        ctx.session.user.about =  ctx.message.text ? ctx.message.text : '';
    }  else {
      ctx.reply("Не понял тебя =(");
      return;
    }
    await User.create(ctx.session.user); // Сохранили в базу
    ctx.replyWithHTML(`🎉Отлично - с регистрацией покончили!🙌
    <b>Как только меня доделают - дам знать =)</b>
    А, ну и проставлюсь, конечно же  🎅
    \n
    <b>Большое спасибо за уделенное на регистарцию время</b> `, Extra.markup(Markup.removeKeyboard()));

    await ctx.scene.leave();
  },

);
  stage.register(register);

  return register;
}

module.exports = {registration}