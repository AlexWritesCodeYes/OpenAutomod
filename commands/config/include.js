const { ChannelType, SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Blacklist = sequelize.define('blacklist', {
	channelID: {
		type: Sequelize.STRING,
		unique: true,
	},
	category: Sequelize.TEXT,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('include')
		.setDescription('removes a channel from the automod ignore list')
		.addSubcommand(subcommand =>
			subcommand
				.setName('id')
				.setDescription('Removes a channel from the blacklist by its ID in the database')
				.addNumberOption(option => 
					option.setName('number')
						.setDescription('The numerical database entry id of the channel to re-include')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('channel')
				.setDescription('Removes a channel from the blacklist by its channel name (if it still exists)')
				.addChannelOption(option =>
					option.setName('channel')
						.setDescription('The channel to re-include')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText))),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			if(subCommand == 'id'){
				const idNum = interaction.options.getNumber('number');
				const rowCount = Blacklist.destroy({where: {id: idNum} });
				Blacklist.sync();

				rowCount.then(count => {
					if(count){
						return interaction.reply({content: `channel ${idNum} in the database was removed from the exclusion list`, ephemeral: false});
					}

					return interaction.reply({content: `channel ${idNum} was not found on the exclusion list.`, ephemeral: false});
				})
			}
			if(subCommand == 'channel'){
				const channel = interaction.options.getChannel('channel');
				const id = channel.id;

				const rowCount = Blacklist.destroy({where: {channelID: id} });
				Blacklist.sync();

				rowCount.then(count => {
					if(count){
						return interaction.reply({content: `${channel.name} was re-included.`, ephemeral: false});
					}

					return interaction.reply({content: `${channel.name} was not found on the exclusion list.`, ephemeral: false});
				})
			}
		},
};
