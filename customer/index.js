const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const bot = new Telegraf(process.env.TRUFAS_CUSTOMER_BOT_TOKEN);

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ sellers: [], customers: [], transactions: [] })
  .write();

function isCustomer(username) {
  const customer = db.get('customers')
    .find({ username })
    .value();

  return customer !== undefined;
}

function addCustomer(id, username) {
  db.get('customers')
    .push({ id, username, balance: 0.0 })
    .write();
}

const setSellerPrompt =
  'To set up your seller, run **/setseller** _username_, ' +
  'replacing _username_ by your seller\'s username.';

bot.start(({ from, reply, replyWithMarkdown }) => {
  // Check if user has a username
  if ('username' in from) {
    // If is already a customer, simply welcome back
    if (isCustomer(from.username)) {
      reply(`Welcome back, @${from.username}!`);
    } else { // Else, add customer and instruct to set seller.
      addCustomer(from.id, from.username);
      replyWithMarkdown(`Welcome to Trufas, @${from.username}! ${setSellerPrompt}`);
    }
  } else { // If not, prompt for the user to create
    reply(
      `Welcome to Trufas! It seems like you don't have a username yet.
Please go to settings and choose one for you.
It's required so your seller can mention you using the Trufas bot.`,
      Extra.HTML().markup(m =>
        m.inlineKeyboard([
          m.callbackButton('DONE!', 'doneusername')
        ]))
    );
  }
});

// const commandDescriptions = [
//   { cmd: 'help', desc: '' },
//   { cmd: 'setseller', desc: '' },
//   { cmd: 'buy', desc: '' },
//   { cmd: 'pay', desc: '' },
//   { cmd: 'balance', desc: '' },
// ];

bot.command('help', ({ from }) => console.log(from.id));

function isSeller(username) {
  const seller = db.get('sellers')
    .find({ username })
    .value();

  return seller !== undefined;
}

function addCustomerToSeller(customerUsername, sellerUsername) {
  // Add customer to seller's list
  const customers = db.get('sellers')
    .find({ username: sellerUsername })
    .get('customers')
    .value();

  if (customers === undefined || !customers.includes(customerUsername)) {
    db.get('sellers')
      .find({ username: sellerUsername })
      .get('customers')
      .push(customerUsername)
      .write();
  }

  // Set seller in customer
  db.get('customers')
    .find({ username: customerUsername })
    .set('seller', sellerUsername)
    .write();
}

bot.command('setseller', ({ message, from, reply }) => {
  // First parse message to extract the seller's username
  const sellerUsername = message.text.split(' ')[1];

  // For now I'll just return.
  if (sellerUsername === undefined) {
    console.log('no username passed');
    return;
  }

  if (isSeller(sellerUsername)) {
    addCustomerToSeller(from.username, sellerUsername);
    reply(`Awesome! Now you can buy from @${sellerUsername}.`);
  } else {
    reply(`It seems like @${sellerUsername} is not on Trufas yet.
Send them this link: t.me/trufas_seller_bot
When they register, try again 😁.`);
    console.log(`${sellerUsername} is not registered`);
  }
});

function getCustomerSeller(username) {
  return db.get('customers')
    .find({ username })
    .get('seller')
    .value();
}

function getSellerTrufas(username) {
  return db.get('sellers')
    .find({ username })
    .get('trufas')
    .value();
}

bot.command('buy', ({ from, reply, replyWithMarkdown }) => {
  const sellerUsername = getCustomerSeller(from.username);

  if (sellerUsername === undefined) {
    // TODO: treat not initialized
    // replyWithMarkdown()
  }

  console.log(sellerUsername);

  const sellerTrufas = getSellerTrufas(sellerUsername);

  console.log(sellerTrufas);

  reply(
    'Choose your flavour',
    Extra.HTML().markup(m =>
      m.inlineKeyboard(sellerTrufas.map(({ name, price }) =>
        m.callbackButton(
          `${name} - R$${price}`,
          `buy ${name.replace(/ /g, '')} ${-price}`
        ))))
  );
});

function registerTransaction(customer, description, value) {
  const seller = getCustomerSeller(customer);

  // Register on the transactions array
  db.get('transactions')
    .push({
      customer, seller, description, value
    })
    .write();

  // Update balance on the customer side
  db.get('customers')
    .find({ username: customer })
    .update('balance', b => b + value)
    .write();

  // Update balance on the seller side
  db.get('sellers')
    .find({ username: seller })
    .get('customers')
    .find({ username: customer })
    .update('balance', b => b + value)
    .write();
}

function getCustomerBalance(username) {
  return db.get('customers')
    .find({ username })
    .get('balance')
    .value();
}

const balanceMessage = balance =>
  `You have R$${Math.abs(balance)} of ${balance >= 0.0 ? 'credit' : 'debit'}.`;

bot.on('callback_query', (ctx) => {
  const {
    callbackQuery, answerCbQuery, reply,
    telegram
  } = ctx;
  const { data, from } = callbackQuery;
  const { chat, message_id } = callbackQuery.message;

  const args = data.split(' ');

  switch (args[0]) {
    case 'doneusername':
      telegram.deleteMessage(chat.id, message_id);
      if ('username' in from) {
        reply(`Great, @${from.username}! ${setSellerPrompt}`);
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
    case 'buy': {
      registerTransaction(
        from.username,
        `Buy Trufa de ${args[1]}`,
        parseFloat(args[2])
      );

      const balance = getCustomerBalance(from.username);

      reply(`Trufa bought successfully. ${balanceMessage(balance)}`);

      break;
    }
    default:
      console.log(data);
      break;
  }

  answerCbQuery();
});

bot.command('pay', ({
  from, message, replyWithMarkdown, reply
}) => {
  const args = message.text.split(' ');
  if (args.length === 2) {
    const value = parseFloat(args[1]);
    registerTransaction(from.username, 'Payment', value);
    const balance = getCustomerBalance(from.username);
    reply(`Payment sucessful. ${balanceMessage(balance)}`);
  } else {
    replyWithMarkdown(`How to pay: use the command /pay _value_.
Example: /pay 10.5`);
  }
});

bot.command('balance', ({ from, reply }) => {
  // TODO: Treat for errors
  const balance = getCustomerBalance(from.username);

  reply(balanceMessage(balance));
});

bot.startPolling();
