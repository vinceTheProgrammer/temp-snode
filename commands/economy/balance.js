const { SlashCommandBuilder } = require('discord.js');

const { User } =  require('../../db/models');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Gets your current snode coin balance.'),

    async execute(interaction) {
        const balance = await getSnodeCoinBalance(interaction.user);

        await interaction.reply(`Your current snode coin balance is **${balance}**`);
    }
}


async function getSnodeCoinBalance(user) {
    balance = await User.findAll({where: {userID: user.id}}).then(res => {
        return res[0].coins;
    });
    return balance;
}
