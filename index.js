require('dotenv').config()

const { Client, Events, IntentsBitField, REST, Routes } = require('discord.js');
const TOKEN = process.env.BOT_TOKEN;
const fs = require('fs');

let miscData = require('./data/misc.json');

const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.Guilds);

const client = new Client({ intents: myIntents });

const COOLDOWN_TIME = 60000 * 60 * 24; // 1 day
//const COOLDOWN_TIME = 10000;
const CHAT_REVIVE_ROLE_ID = '1227466914062925824';
const GUILD_ID = '555929808698081304';
const CHAT_REVIVE_NOTIFICATION_CHANNEL_ID = '645164580292657152';

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    const role = guild.roles.cache.get(CHAT_REVIVE_ROLE_ID);

    if (role && canPingChatRevive()) {
        role.setMentionable(true)
            .then(() => {
                console.log('Role is now mentionable');
                guild.channels.cache.get(CHAT_REVIVE_NOTIFICATION_CHANNEL_ID).send("I just came online, and it looks like the chat revive cooldown has been exceeded. Next chat revive is ready to be used.");
            })
            .catch(console.error);
    }
});

client.on(Events.MessageCreate, message => {
    const mentionedRole = message.mentions.roles.find(role => role.id === CHAT_REVIVE_ROLE_ID);

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

    if (message.author.bot) return;
    
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

client.login(TOKEN);
