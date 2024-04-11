const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const cors = require('cors')
require('dotenv/config.js')

const webAppUrl = process.env.WEB_APP_URL
const greeting = `🎉 Добро пожаловать в лучший магазин МТС в Карачаево-Черкесской республике! 🎉
                  \nТолько здесь вы найдете товары по самым выгодным ценам! 💰
                  \nМы рады приветствовать вас в нашем магазине и готовы предложить вам широкий ассортимент товаров и услуг по самым выгодным ценам. У нас вы найдете все, что нужно для связи, развлечений и работы.`

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, {polling: true});
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
  let products = []
  let totalSum = 0

  if (text == '/start') {
    await bot.sendMessage(chatId, greeting, {
        reply_markup: {
          resize_keyboard: true,
            keyboard: [
                [{text: "Сделать заказ", web_app: {url: webAppUrl}}]
            ]
        }
    }) 
  }

  if (msg?.web_app_data?.button_text == "Сделать заказ") {
    try {
      const data = JSON.parse(msg?.web_app_data?.data)
      let date = new Date()
      console.log(msg.web_app_data)

      await bot.sendMessage(chatId, 
      `MTS.KCHR - Ваш заказ
      \n${date.toLocaleDateString() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()} - Вы оформили заказ
      ${showCart(data)}`, {
        reply_markup: {
          inline_keyboard: [
            [{text: "Продолжить", callback_data: 'botContinue'}], 
            [{text: "Очистить корзину", callback_data: 'cartClean'}]
          ]
        }
      }
    )
    } catch (e) {
      await bot.sendMessage(chatId, `${e.message}`)
    }
  } else {
    try {
      const data = JSON.parse(msg?.web_app_data?.data)
  
        await bot.sendMessage(chatId, 
          `Спасибо за обратную связь!
          \nВаше имя: ${data?.name}
          \nВаш номер телефона: ${data?.phoneNumber}
          \nВаш пункт выдачи: ${data?.pickUpPoint}`)

        await bot.sendInvoice(chatId, 'iphone 13 pro', "test description", 'payload', process.env.PAYMENT_TOKEN, 
          'RUB', [
            {
              label: 'iphone 13 pro',
              amount: 78000*100
            }
          ],
          {
          need_name: false,
          need_phone_number: false,
          is_flexible: true,
          need_shipping_address: false
          })         
    } catch (e) {
      await bot.sendMessage(chatId, `${e.message}`)
    }
  }
});


bot.on('callback_query', async (data) => {
  const chatId = data.message.chat.id;
  messageId = data.message.message_id;

  if (data.data == "botContinue") {
    await bot.sendMessage(chatId, 'Заполните форму для оформления заказа ⬇️', {
      reply_markup: {
        resize_keyboard: true,
          keyboard: [
              [{text: "Заполнить форму", web_app: {url: webAppUrl + '/form'}}]
          ]
      }
    }) 
  } else {
    bot.deleteMessage(chatId, messageId)
    await bot.sendMessage(chatId, 'Корзина очищена ✅') ;
  }
})

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