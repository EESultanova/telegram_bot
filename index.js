const fetch = require("node-fetch");
const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "1784808663:AAFTWvNSThyfCfqGr2fMPKvfz1W0BdbBQdE";

console.log("Бот запущен успешно");
const bot = new TelegramBot(TOKEN, {
  //клиент  отправляет запрос на серверы тг, запкскается долгий цикл (polling),
  //  который ждет каких-то обновлений. Как только они случаются,
  //   он прекращает цикл и отправляет нам ответ
  polling: {
    interval: 300, //время запроса на сервер и ответа
    autoStart: true, //если бот спит, но ему отправили команду, тогда сразу после старта бота он сможет ее обработать
    params: {
      timeout: 10, //таймаут между запросами
    },
  },
});

function prettyAnswer(obj = {}) {
  return JSON.stringify(obj, null, 4);
}

const apiReq = async () => {
  const response = await fetch(
    "https://api.chucknorris.io/jokes/random"
  ).then((resp) => resp.json());
  const result = await response.value;
  return result;
};

bot.on("message", async (msg) => {
  const { id } = msg.chat;
  msg?.text.toLowerCase() === "hello"
    ? bot.sendMessage(id, `Hello, ${msg.from.first_name}`)
    : null;
});

//chuck
bot.onText(/\/chuck/, async (msg) => {
  const { id } = msg.chat;
  bot
    .sendMessage(id, `Hello, ${msg.from.first_name}.\n${await apiReq()}`)
    .then(() => console.log("сообщение отправлено"));
});

const dogApiReq = async (breed) => {
  const response = await fetch(
    `https://dog.ceo/api/breed/${breed}/images/random`
  ).then((resp) => resp.json());
  const result = await response.message;
  return result;
};
dogApiReq("hound");

bot.onText(/\/dog (.+)/, async (msg, [source, match]) => {
  const { id } = msg.chat;
  bot.sendMessage(id, `Here what i've found: ${await dogApiReq(match)}`);
});

bot.onText(/\/dog/, async (msg) => {
  const { id } = msg.chat;
  bot.sendMessage(id, `Please, use this format: /dog <breed> `);
});

const breedsApiReq = async () => {
  const response = await fetch(
    `https://dog.ceo/api/breeds/list/all`
  ).then((resp) => resp.json());
  const result = await Object.keys(response.message);
  return result;
};

bot.onText(/\/breeds/, async (msg) => {
  const { id } = msg.chat;
  bot.sendMessage(id, `${prettyAnswer(await breedsApiReq())}`);
});

const options = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Crazy fish", callback_data: "Bad-Joke-Eel" }],
      [{ text: "Sad bear", callback_data: "Bad-Luck-Bear" }],
      [{ text: "Owl smokes", callback_data: "Art-Student-Owl" }],
    ],
  }),
};

bot.onText(/\/memes_start/, function (msg, match) {
  const { id } = msg.chat;
  bot.sendMessage(id, "Выберите шаблон для мема:", options);
});

const getMemes = async (top, bottom, meme) => {
  return `http://apimeme.com/meme?meme=${meme}&top=${top}&bottom=${bottom}`;
};

const regexCollections = {
  memeCreate: /^[^\/]+\s.+$/gi,
};

bot.on("callback_query", async (msg) => {
  const meme = msg.data;
  const { id } = msg.message.chat;
  bot.sendMessage(id, "Type the text in format: <top text> <bottom text>");
  bot.onText(regexCollections.memeCreate, async (msg) => {
    const arr = msg?.text.split(" ");
    let top
    let bottom
    if (arr.length < 3) {
      top = arr[0];
      bottom = arr[1];
    } else {
      top = `${arr[0]}%20${arr[1]}`;
      bottom = `${arr[2]}%20${arr[3]}`;
    }
    bot.sendMessage(id, `${await getMemes(top, bottom, meme)}`);
    bot.removeTextListener(regexCollections.memeCreate);
  });
});
