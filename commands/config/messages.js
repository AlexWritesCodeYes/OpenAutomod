const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Messages = sequelize.define('messagetexts', {
	category: {
		type: Sequelize.STRING,
		unique: true,
	},
	text: Sequelize.TEXT,
});

//currently this only sets the welcome messages, but in the future this will be used for other categories of message management
module.exports = {
	data: new SlashCommandBuilder()
		.setName('messages')
		.setDescription('Sets or gets the text of various messages')
		.addSubcommand(subcommand =>
			subcommand
				.setName('welcome')
				.setDescription('sets the text of the message to be posted in welcome channels')
				.addStringOption(option =>
					option.setName('text')
						.setDescription('The message to be posted in welcome channels')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('all')
				.setDescription('returns a list of all currently saved messages and their categories')),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			if(subCommand == 'welcome'){
				let msgText = interaction.options.getString('text');
				const affectedRows = Messages.update({text: msgText}, {where: {category: "welcome"} });
				Messages.sync();

				let logMsg = "The welcome message was ";
				affectedRows.then(rows => {
					if(rows[0] > 0){
						logMsg = logMsg + "updated to:\n" + msgText;
						return interaction.reply({content: logMsg, ephemeral: false});
					}
					else{
						try{
							Messages.create({
								category: "welcome",
								text: msgText,
							});
							Messages.sync();
							logMsg = logMsg + "set to:\n" + msgText;
						}
						catch(error){
							logMsg = "Something went wrong with configuring the welcome message. Here's the error: " + error;
						}
						finally{
							return interaction.reply({content: logMsg, ephemeral: false});
						}
					}
				})
			}
			else if(subCommand == 'all'){
				var logMsg = "====Messages====\n";
				Messages.findAll().then(messages => {
					messages.forEach(message => {
						logMsg = logMsg + "category: " + message.category + " | text: " + message.text + "\n";
					})
				})
				logMsg = logMsg + "====================";
				return interaction.reply({content: logMsg, ephemeral: false});
			}
		},
};