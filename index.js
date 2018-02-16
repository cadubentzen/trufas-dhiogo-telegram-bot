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

function sellerCommands() {
  return `
**/listcustomers** - List your customers and their balances
**/addcustomer** _@username_ - Add new customer to your list.
**/rmcustomer** _@username_ - Remove customer from your list.
**/additem** _name price_ - Add item to our menu. e.g. /additem Beijinho 1.5
**/rmitem** - Remove item from your list.
**/paid** _username value_ - Register payment from one of your users.
**/help** - Get this list of commands
`;
}

function newSeller({ id, username }, replyWithMarkdown) {
  const seller = db.get('sellers')
    .find({ id, username })
    .value();

  if (seller == null) {
    db.get('sellers')
      .push({ id, username })
      .write();
  }

  replyWithMarkdown(`
${seller == null ? 'Amazing' : 'Welcome back'}, @${username}!
${seller == null ? 'You\'re now a seller. ' : ''}Here is the list of commands available:
${sellerCommands()}
  `);
}

function newCustomer(reply) {
  reply('Hi customer!');
}

bot.on('callback_query', ({ callbackQuery, reply, replyWithMarkdown }) => {
  console.log(callbackQuery.data);

  if (!('from' in callbackQuery)
      || !('data' in callbackQuery)) {
    return;
  }

  const { data, from } = callbackQuery;

  switch (data) {
    case 'doneusername':
      if ('username' in from) {
        reply(
          `Great, @${from.username}! Are you a seller or a customer?`,
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
      console.log(callbackQuery);
      newSeller(from, replyWithMarkdown);
      break;
    case 'newcustomer':
      console.log('newcustomer');
      newCustomer(reply);
      break;
    default:
      break;
  }
});

// Command handling
bot.command('answer', (ctx) => {
  console.log(ctx.message);
  return ctx.reply('*42*', Extra.markdown());
});

bot.startPolling();
