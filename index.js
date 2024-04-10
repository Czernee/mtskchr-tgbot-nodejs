const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const cors = require('cors')
require('dotenv/config.js')

const webAppUrl = process.env.WEB_APP_URL
const greeting = `🎉 Добро пожаловать в лучший магазин МТС в Карачаево-Черкесской республике! 🎉
                  \nТолько здесь вы найдете товары по самым выгодным ценам! 💰
                  \nМы рады приветствовать вас в нашем магазине и готовы предложить вам широкий ассортимент товаров и услуг по самым выгодным ценам. У нас вы найдете все, что нужно для связи, развлечений и работы.`

const bot = new TelegramBot(process.env.TOKEN, {polling: true});
const app = express();

app.use(express.json());
app.use(cors())

function showCart(data) {
  return data?.products?.map((product) => {
    return `\n🔹${product.title} - ${product.price}₽`;
  }).join('');
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text == '/start') {
    await bot.sendMessage(chatId, greeting, {
        reply_markup: {
            keyboard: [
                [{text: "Сделать заказ", web_app: {url: webAppUrl}}]
            ]
        }
    }) 
  }

  if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg?.web_app_data?.data)
      let date = new Date()

      await bot.sendMessage(chatId, 
      `MTS.KCHR - Ваш заказ
      \n${date.toLocaleDateString() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()} - Вы оформили заказ
      ${showCart(data)}`
    )
    } catch (e) {
      await bot.sendMessage(chatId, 'Не удалось получить данные.')
    }
  }
});

/*bot.on('message', async(msg1) => {
  const chatId = msg1.chat.id;
  const text = msg1.text;

  await bot.sendMessage(chatId, 'Заполните форму для оформления заказа', {
    reply_markup: {
        keyboard: [
            [{text: "Заполнить форму", web_app: {url: webAppUrl + '/form'}}]
        ]
    }
  }) 

  if (msg1?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg1?.web_app_data?.data)

      await bot.sendMessage(chatId, 'Спасибо за обратную связь!')
      await bot.sendMessage(chatId, 'Ваша страна: ' + data?.country)
      await bot.sendMessage(chatId, 'Ваш город: ' + data?.city)
      await bot.sendMessage(chatId, "Ваш пункт выдачи: " + data?.subject)
    } catch (e) {
      await bot.sendMessage(chatId, 'Не удалось получить данные.')
    }
}
})*/

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
      title: 'Не удалось приобрести товар',
      input_message_content: {message_text: 'Не удалось приобрести товар'}
    })
    return res.status(500).json({});
  }
})

const PORT = 8000;

app.listen(PORT, () => console.log('server has been started on PORT ' + PORT))