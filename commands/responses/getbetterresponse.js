const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Phrases = sequelize.define('phrases', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	phrase: {
		type: Sequelize.STRING,
		unique: true,
	},
	response: Sequelize.TEXT,
	delete: Sequelize.TINYINT,
	timeout: Sequelize.INTEGER,
	regex: Sequelize.INTEGER,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fullresponse')
		.setDescription('Get the detailed response to a phrase entry if it exists in the database')
		.addSubcommand(subcommand =>
			subcommand
				.setName('id')
				.setDescription('Get the response by its database entry id')
				.addNumberOption(option => 
					option.setName('number')
						.setDescription('The numerical id of the database entry to modify')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('phrase')
				.setDescription('Get the the response by its full phrase as it exists in the database')
				.addStringOption(option => 
					option.setName('fullphrase')
						.setDescription('The exact phrase as it appears in the database')
						.setRequired(true))),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			var response;
			if(subCommand == 'id'){
				const idNum = interaction.options.getNumber('number');
				response = Phrases.findOne({where: {id: idNum} });
			}
			else if(subCommand == 'phrase'){
				const phraseString = interaction.options.getString('fullphrase');
				response = Phrases.findOne({where: {phrase: phraseString} });
			}
			else{
				//throw an error
				return interaction.reply({content: "The requested entry was not found. Try running /listphrases to see if it's there!", ephemeral: false});
			}

			response.then(entry => {
				if(!entry){
					return interaction.reply({content: "The requested entry was not found. Try running /listphrases to see if it's there!", ephemeral: false});
				}

				let phrase = entry.phrase;
				let reply = entry.response;
				let deleteThis = entry.delete;
				let timeoutUser = entry.timeout;
				let regexVal = entry.regex;

				var message;
				if(regexVal == 1){
					message = `regex: ||${phrase}|| \nreply: ${reply} \n`;
				}
				else{
					message = `phrase: ||${phrase}|| \nreply: ${reply} \n`;
				}
				message = message + "response: ";
				
				if(deleteThis == 0){
					message = message + "do not delete the message and ";
				}
				else{
					message = message + "delete the message and ";
				}

				if(timeoutUser == 0){
					message = message + "do not time out the user";
				}
				else{
					message = message + "time out the user for a";
					const minute = 60 * 1000;
					const hour = 60 * 60 * 1000;
					const day = 24 * 60 * 60 * 1000;

					if(timeoutUser == minute){
						message = message + " minute";
					}
					else if(timeoutUser == hour){
						message = message + "n hour";
					}
					else if(timeoutUser == day){
						message = message + " day";
					}
				}

				return interaction.reply({content: `${message}`, ephemeral: false});
			})
		},
};