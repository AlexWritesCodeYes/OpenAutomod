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
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to re-include')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText)),
		execute(interaction){
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
		},
};