const WizardScene = require("telegraf/scenes/wizard");
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const axios = require('axios');
const fs = require('fs');

const GenderKeyboard = 
  Markup.keyboard(['Мужской', 'Женский'], {
    columns: parseInt(2)
  }).oneTime().resize().extra();


function registration(stage) {
  const register = new WizardScene(
    "registration",
    // Имя  МОЖНО УБРАТЬ, и заменить   ctx.chat.first_name
    
    async (ctx) => {
      ctx.reply("Как тебя зовут?");
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text && ctx.message.text.length > 1 && new RegExp('[A-я]+', 'gi').test(ctx.message.text)) {
        ctx.session.user = {
            name: null,
            gender: null,
            age: null,
            photo: null,
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
    if (['female', 'male', 'м', 'ж', 'муж', 'жен', "женск", "мужской", "женский"].indexOf(ctx.message.text.trim().toLowerCase()) != -1) {
      if (['male', 'м', "муж", "мужской"].indexOf(ctx.message.text.trim().toLowerCase()) != -1)
          ctx.session.user.gender = 'male';
      else ctx.session.user.gender = 'female';
      ctx.reply("Сколько тебе лет?", Extra.markup(Markup.removeKeyboard()));
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
          await ctx.reply('Последний шаг!\nСкинь фотку)');
          return ctx.wizard.next();
      } else if (!Number.isInteger(age))
          ctx.reply("Что-то ты не то ввел" + сtx.session.user.gender == 'male' ? '' : 'a');
      else {
          ctx.reply("Общаюсь только с теми, кому от 18 до 70 лет.\nПрости, такие правила)");
          ctx.session.user = null;
      }
    },
    
    // Фото

    async (ctx) => {
    //   const id = ctx.message.photo[0].file_id;
    //   await ctx.telegram.getFileLink(id).then(url => {
    //     axios({url, responseType: 'stream'}).then(response => {
    //       return new Promise((res, rej) => {
    //         response.data.pipe(fs.createWriteStream('./' + id + '.jpg'))
    //         .on('finish', () => {
    //           console.log("Successfully saved");
    //           ctx.session.user.photo = id;
    //         })
    //         .on('error', error => console.log("ERROR WHILE SAVING", error));
    //       });
    //     });
    // });
    // Дописать условий и проверок
    await ctx.reply("Мы сделали это! Регистрация окончена");
    await ctx.reply("Теперь введи варианты, куда ты хочешь сходить,\nа я постараюсь найти подходящие события")
    await ctx.scene.leave('registration');
  });
  stage.register(register);
  register.command('clear', async ctx => {ctx.reply('Есть выполнять команду!');
                                    ctx.session.user = null;
                                    await ctx.scene.leave('registration');
                                  });
  return register;
}

module.exports = {registration}