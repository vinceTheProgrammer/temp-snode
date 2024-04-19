const { SlashCommandBuilder } = require('discord.js');

const { User } =  require('../../db/models');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Gets the snode coin balance of target user or your own balance if run without arguments.')
    .addUserOption(option => {
        return option
        .setName('user')
        .setDescription("The user to check the balance of.")
        .setRequired(false);
    }),

    async execute(interaction) {
        const target = interaction.options.getUser('user');

        let balance = 0;
        if (target == null) balance = await getSnodeCoinBalance(interaction.user);
        else balance = await getSnodeCoinBalance(target);

        let reply = `error`;
        if (target == null) reply = `Your current snode coin balance is **${balance}**`;
        else reply = `The balance of **${target.username}** is **${balance}**`;

        await interaction.reply(reply);
    }
}


async function getSnodeCoinBalance(user) {
    balance = await User.findAll({where: {userID: user.id}}).then(res => {
        return res[0].coins;
    });
    return balance;
}
