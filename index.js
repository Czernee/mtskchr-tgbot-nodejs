const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const cors = require('cors')
require('dotenv/config.js')

const token = process.env.TOKEN
const webAppUrl = process.env.WEB_APP_URL
const greeting = `🎉 Добро пожаловать в лучший магазин МТС в Карачаево-Черкесской республике! 🎉

                  Только здесь вы найдете товары по самым выгодным ценам! 💰

                  Мы рады приветствовать вас в нашем магазине и готовы предложить вам широкий ассортимент товаров и услуг по самым выгодным ценам. У нас вы найдете все, что нужно для связи, развлечений и работы.

                  Наши опытные консультанты помогут вам подобрать оптимальный тарифный план, выбрать подходящий смартфон или подключить дополнительные услуги.

                  Мы всегда рады видеть вас в нашем магазине! Приходите и убедитесь сами в наших выгодных ценах и высоком уровне обслуживания.`

const bot = new TelegramBot(token, {polling: true});
const app = express();

app.use(express.json());
app.use(cors())

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text == '/start') {
  //   await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
  //     reply_markup: {
  //         keyboard: [
  //             [{text: "Заполнить форму", web_app: {url: webAppUrl + '/form'}}]
  //         ]
  //     }
  // }) 

    await bot.sendMessage(chatId, greeting, {
        reply_markup: {
            inline_keyboard: [
                [{text: "Сделать заказ", web_app: {url: webAppUrl}}]
            ]
        }
    }) 
  }

  if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg?.web_app_data?.data)

      await bot.sendMessage(chatId, 'Спасибо за обратную связь!')
      await bot.sendMessage(chatId, 'Ваша страна: ' + data?.country)
      await bot.sendMessage(chatId, 'Ваш город: ' + data?.city)
      await bot.sendMessage(chatId, "Ваш пункт выдачи: " + data?.subject)
    } catch (e) {
      await bot.sendMessage(chatId, 'Не удалось получить данные.')
    }
  }
});

app.post('/web-data', async (req, res) => {
  const {queryId, products = [], totalPrice} = req.body;
  try {
    await bot.answerWebAppQuery(queryId, {
      type: 'article',
      id: queryId,
      title: 'Успешная покупка',
      input_message_content: {message_text: 
        `Поздравляю с покупкой, вы приобрели товар на сумму' + ${totalPrice}, ${products.map(item => item.title).join(', ')}`
      }
    })
    return res.status(200).json({});
  } catch (e) {
    await bot.answerWebAppQuery(queryId, {
      type: 'article',
      id: queryId,
      title: 'Успешная покупка',
      input_message_content: {message_text: 'Не удалось приобрести товар'}
    })
    return res.status(500).json({});
  }
})

const PORT = 8000;

app.listen(PORT, () => console.log('server has been started on PORT ' + PORT))