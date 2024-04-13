const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const cors = require('cors')
require('dotenv/config.js')

const webAppUrl = process.env.WEB_APP_URL
const greeting = `🎉 Добро пожаловать в лучший магазин МТС в Карачаево-Черкесской республике! 🎉
                  \nТолько здесь вы найдете товары по самым выгодным ценам! 💰
                  \nМы рады приветствовать вас в нашем магазине и готовы предложить широкий ассортимент товаров и услуг по самым выгодным ценам. У нас вы найдете все, что нужно для связи, развлечений и работы.`

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, {polling: true});
const app = express();

app.use(express.json());
app.use(cors())

function showCart(data) {
  return data?.products?.map((product) => {
    return `\n🔹${product.title} - ${product.price}₽`;
  }).join('');
}

let products = []
let totalSum = 0
let customerFCS = ''
let customerPhone = ''
let customerPickUpPoint = ''

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

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
      products = data.products
      totalSum = data.totalPrice

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
      customerFCS = data?.name
      customerPhone = data?.phoneNumber
      customerPickUpPoint = data?.pickUpPoint

      console.log(data)
      await bot.sendMessage(chatId, 
        `Спасибо за обратную связь!
        \nВаше имя: ${data?.name}
        \nВаш номер телефона: ${data?.phoneNumber}
        \nВаш пункт выдачи: ${data?.pickUpPoint}`)

        const invoiceItems = products.map(product => ({
          label: product.title,
          amount: product.price * 100
        }))

        await bot.sendInvoice(chatId, 'Покупка', 'Оплата заказа', 'payload', process.env.PAYMENT_TOKEN, 
          'RUB', invoiceItems,
          {
          need_name: false,
          need_phone_number: false,
          is_flexible: false,
          need_shipping_address: false,
          })         

          await bot.sendMessage(chatId, 'Если вдруг вы сделали ошибку в форме, то можете заполнить ее заново ⬇️')
    } catch (e) {
     // заглушка :)
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

bot.on('pre_checkout_query', async (data) => {
  await bot.answerPreCheckoutQuery(data.id, true)
})

bot.on('successful_payment', async (data) => {
  chatId = data.chat.id 
  console.log(data)

  bot.deleteMessage(chatId, data.message_id-1)
  bot.sendMessage(chatId, `Благодарим за покупку! Ваш чек:
  \nТовары:${products.map(product => {
    return ' ' + product.title
  })}
  \nИтоговая сумма: ${totalSum} рублей
  \nФИО покупателя: ${customerFCS}
  \nНомер телефона покупателя: ${customerPhone}
  \nПункт выдачи: ${customerPickUpPoint}
  \nПри получении товара не забудьте показать чек продавцу!`, {
    reply_markup: {
      resize_keyboard: true,
        keyboard: [
            [{text: "Сделать заказ", web_app: {url: webAppUrl}}]
        ]
    }
  })
})

const PORT = 8000;

app.listen(PORT, () => console.log('server has been started on PORT ' + PORT))