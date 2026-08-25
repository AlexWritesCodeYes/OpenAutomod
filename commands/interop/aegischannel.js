const { SlashCommandBuilder, MessageFlags } = require('discord.js');
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
	.setName('aegischannel')
	.setDescription('get or set the channel for monitoring the aegis bot')
		.addSubcommand(subcommand => 
			subcommand
				.setName('get')
				.setDescription('gets the current aegis channel'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('set')
				.setDescription('sets the aegis channel')
				.addChannelOption(option => 
					option.setName('channel')
						.setDescription('the aegis channel')
						.setRequired(true))),
	execute(interaction){
		const subCommand = interaction.options.getSubcommand();
		if(subCommand == 'get'){
			var message = "The aegis channel is: ";	
			var channelTxt = "not set! use the 'set' subcommand to set it.";

			try{
				Channels.findOne({where: {name: "aegis"} }).then(aegischannel => {
					if(aegischannel){
						channelTxt = "<#" + aegischannel.channelID + ">";
					}
					message = message + channelTxt;
					return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
				})
			}
			catch(error){
				message = `Something went wrong with getting the aegis channel! Here's the error: ${error}`;
				return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
			}
		}
		else if(subCommand == 'set'){
			var message = "The aegis channel has been ";
			const channel = interaction.options.getChannel('channel');
			const channelID = channel.id.toString();

			const affectedRows = Channels.update({channelID: channelID}, {where: {name: "aegis"} });
			Channels.sync();

			affectedRows.then(rows => {
				if(rows[0] > 0){
					message = message + "updated to: <#" + channelID + ">";
					return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
				}
				else{
					try{
						Channels.create({
							name: "aegis",
							channelID: channelID,
						});
						Channels.sync();

						message = message + "set to: <#" + channelID + ">";
						return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
					}
					catch(error){
						return interaction.reply({content: `The aegis channel wasn't set in the database, and something went wrong trying to create an entry for it. Here's the error: ${error}`, ephemeral: true});
					}
				}
			})
		}
	},
};