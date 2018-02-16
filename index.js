const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');

const adapter = new FileSync('db.json');
const db = low(adapter);

const bot = new Telegraf(process.env.BOT_TOKEN);

db.defaults({ sellers: [], customers: [], transactions: [] })
  .write();

function sellerOrCustomer() {
  return Extra.HTML().markup(m =>
    m.inlineKeyboard([
      m.callbackButton('Seller', 'newseller'),
      m.callbackButton('Customer', 'newcustomer'),
    ]));
}

bot.start(({ reply, message }) => {
  const { from } = message;

  if (!('username' in from)) {
    reply(
      `Welcome to Trufas! It seems like you don't have a username yet.
Please go to settings and choose one for you.
It's required so other users can mention you using the Trufas bot.`,
      Extra.HTML().markup(m =>
        m.inlineKeyboard([
          m.callbackButton('DONE!', 'doneusername')
        ]))
    );
  } else {
    reply(
      `Welcome to Trufas, @${from.username}! Are you a seller or customer?`,
      sellerOrCustomer()
    );
  }
});

function newSeller(reply) {
  reply('Hi seller!');
}

function newCustomer(reply) {
  reply('Hi customer!');
}

bot.on('callback_query', ({ callbackQuery, reply }) => {
  console.log(callbackQuery.data);

  if (!('chat' in callbackQuery.message)
      || !('data' in callbackQuery)) {
    return;
  }

  const { data } = callbackQuery;
  const { chat } = callbackQuery.message;

  switch (data) {
    case 'doneusername':
      if ('username' in chat) {
        reply(
          `Great, @${chat.username}! Are you a seller or a customer?`,
          sellerOrCustomer()
        );
      } else {
        reply(
          'Oops.. It seems like you haven\'t set up a username yet. Try again!',
          Extra.HTML().markup(m =>
            m.inlineKeyboard([
              m.callbackButton('DONE!', 'doneusername')
            ]))
        );
      }
      break;
    case 'newseller':
      console.log('newseller');
      newSeller(reply);
      break;
    case 'newcustomer':
      console.log('newcustomer');
      newCustomer(reply);
      break;
    default:
      break;
  }
});

bot.on('inline_query', () => {
  console.log('inline_query');
});

// Command handling
bot.command('answer', (ctx) => {
  console.log(ctx.message);
  return ctx.reply('*42*', Extra.markdown());
});

bot.startPolling();
