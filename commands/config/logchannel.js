const { ChannelType, SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Channels = sequelize.define('channels', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
	channelID: Sequelize.TEXT,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('logchannel')
		.setDescription('sets the channel to which this bot logs events')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to log bot events to')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText)),
		execute(interaction){
			const channel = interaction.options.getChannel('channel');
			const id = channel.id;

			const affectedRows = Channels.update({channelID: id.toString()}, {where: {name: "log"} });
			Channels.sync();

			affectedRows.then(rows => {
				if(rows[0] > 0){
					return interaction.reply({content: `The log channel was changed to ${channel.name}`, ephemeral: false});
				}
				else{
					try{
						const logchannel = Channels.create({
							name: "log",
							channelID: id.toString(),
						});
						Channels.sync();

						return interaction.reply({content: `The log channel wasn't set in the database, but it is now set to ${channel.name}`, ephemeral: false});
					}
					catch(error){
						return interaction.reply({content: `The log channel wasn't set in the database, and something went wrong trying to create an entry for it. Here's the error: ${error}`, ephemeral: false});
					}
				}
			})
		},
};