const { SlashCommandBuilder } = require('discord.js');

const { User } =  require('../../db/models');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give snode coins to someone.')
    .addUserOption(option => {
        return option
        .setName('user')
        .setDescription("The user to give snode coins to.")
        .setRequired(true);
    })
    .addNumberOption(option => {
        return option
        .setName('amount')
        .setDescription("The amount of snode coins to give.")
        .setRequired(true)
        .setMinValue(1);
    }),

    async execute(interaction) {
        const balance = await getSnodeCoinBalance(interaction.user);

        const target = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');

        if (balance < amount) {
            return await interaction.reply(`Your balance is **${balance}**, which is not enough to give **${target.username}** **${amount}** snode coins.`);
        }

        await decreaseSnodeCoinBalance(interaction.user, amount);
        await increaseSnodeCoinBalance(target, amount);

        await interaction.reply(`You have given **${target.username}** **${amount}** snode coins. Your new snode coin balance is **${balance - amount}**`);
    }
}


async function getSnodeCoinBalance(user) {
    balance = await User.findAll({where: {userID: user.id}}).then(res => {
        return res[0].coins;
    });
    return balance;
}

async function increaseSnodeCoinBalance(user, amount) {
    User.findAll({where: {userID: user.id}}).then(res => {
        res[0].coins += amount;
        res[0].save();
    });
}

async function decreaseSnodeCoinBalance(user, amount) {
    User.findAll({where: {userID: user.id}}).then(res => {
        res[0].coins -= amount;
        res[0].save();
    });
}