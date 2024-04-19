const { SlashCommandBuilder } = require('discord.js');

const { User } =  require('../../db/models');

require('dotenv').config()

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Gets the top five snode coin holders.'),

    async execute(interaction) {
        const top5 = await getTop5SnodeCoinHolders();

        let leaderboardString = await getLeaderboardString(top5, interaction.client);

        if (process.env.DEVELOP == '1') leaderboardString += "\n\n*this is the development database, which is different from the real Snode database*";

        await interaction.reply(leaderboardString);
    }
}


async function getTop5SnodeCoinHolders() {
    const top5 = await User.findAll({order: [
        ['coins', 'DESC']
    ],
    limit: 5});
    return top5;
}

async function getLeaderboardString(top5, client) {
    const entries = [];
    for (let user of top5) {
        discordUser = await client.users.fetch(user.userID);
        entries.push({
            username: discordUser.username,
            coins: user.coins
        });
    }

    let string = '';
    for (let [index, value] of entries.entries()) {
        string += `${index + 1}. ${value.username} - ${value.coins}\n`;
    }

    return string;
}