require('dotenv').config()

const { Client, Events, IntentsBitField, REST, Routes, Collection } = require('discord.js');
const TOKEN = process.env.BOT_TOKEN;
const fs = require('fs');
const path = require('path');
const _ = require("lodash");

const db = require('./db/models');
const { User } =  require('./db/models');

let miscData = require('./data/misc.json');

const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers);

const client = new Client({ intents: myIntents });

const COOLDOWN_TIME = 60000 * 60 * 24; // 1 day
const CHAT_REVIVE_ROLE_ID = '1227466914062925824';
const GUILD_ID = '555929808698081304';
const CHAT_REVIVE_NOTIFICATION_CHANNEL_ID = '645164580292657152';
COIN_BLACKLISTED_CHANNELS = ['670345302007611422'];

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    const role = guild.roles.cache.get(CHAT_REVIVE_ROLE_ID);

    if (process.env.DEVELOP != '1') {
        if (role && canPingChatRevive()) {
            role.setMentionable(true)
                .then(() => {
                    console.log('Role is now mentionable');
                    guild.channels.cache.get(CHAT_REVIVE_NOTIFICATION_CHANNEL_ID).send("I just came online, and it looks like the chat revive cooldown has been exceeded. Next chat revive is ready to be used.");
                })
                .catch(console.error);
        }
    }
});

client.on(Events.MessageCreate, message => {
    const mentionedRole = message.mentions.roles.find(role => role.id === CHAT_REVIVE_ROLE_ID);

    if (!_.includes(COIN_BLACKLISTED_CHANNELS, message.channel.id)) {
        tryCreditUser(message);
    }

    if (process.env.DEVELOP != '1') {
        if (mentionedRole) {
            const guild = client.guilds.cache.get(GUILD_ID);
            const role = guild.roles.cache.get(CHAT_REVIVE_ROLE_ID);
            if (role && role.mentionable) {
                role.setMentionable(false)
                    .then(() => {
                        console.log('Role is no longer mentionable');
                        guild.channels.cache.get(CHAT_REVIVE_NOTIFICATION_CHANNEL_ID).send("Chat revive has been used! The 24 hour cooldown period before it can be used again has begun.");
                    })
                    .catch(console.error);
    
                miscData.chat_revive.last_pinged = Date.now();
                saveData();
    
                setTimeout(() => {
                    role.setMentionable(true)
                        .then(() => {
                            console.log('Role is now mentionable');
                            guild.channels.cache.get(CHAT_REVIVE_NOTIFICATION_CHANNEL_ID).send("Chat revive cooldown has expired. Next chat revive is ready to be used! >:)");
                        })
                        .catch(console.error);
                }, COOLDOWN_TIME)
            }
        }
    }

    if (message.author.bot) return;
    
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

function canPingChatRevive() {
    const currentTime = Date.now();
    const lastPinged = miscData.chat_revive.last_pinged;

    if (currentTime - lastPinged >= COOLDOWN_TIME) return true;
}

function saveData() {
    fs.writeFile('./data/misc.json', JSON.stringify(miscData, null, 4), err => {
        if (err) console.error(err);
    });
}

function tryCreditUser(message) {

    User.findAll({where: {userID: message.author.id}}).then(res => {
        if (res.length > 0) {
            creditUser(res[0], message);
        } else {
            User.create({
                userID: message.author.id,
                lastCreditedMessageTimestamp: message.createdTimestamp
            }).then(user => {
                creditUser(user, message);
            }).catch((err) => {
                console.log("error creating new user.", err);
            })
        }
        
    });
    
}

function creditUser(user, message) {
    if (!canBeCredited(user)) return;
    user.coins += determineCoins();
    user.lastCreditedMessageTimestamp = message.createdTimestamp;
    user.save();
}

function determineCoins() {
    const COIN_MIN = 1;
    const COIN_MAX = 5;
    const coinsToGive = _.random(COIN_MIN, COIN_MAX);
    return coinsToGive;
}

function canBeCredited(user) {
    const COIN_COOLDOWN = 20000;
    lastCreditedMessageTimestamp = user.lastCreditedMessageTimestamp;
    return (Date.now() - lastCreditedMessageTimestamp) >= COIN_COOLDOWN;
}

db.sequelize.sync().then(() => {
    client.login(TOKEN);
});
