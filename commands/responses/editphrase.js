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
	blackwhite: Sequelize.TINYINT,
	regex: Sequelize.TINYINT,
	response: Sequelize.TEXT,
	delete: Sequelize.TINYINT,
	timeout: Sequelize.INTEGER,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modphrase')
		.setDescription('Get the detailed response to a phrase entry if it exists in the database')
		.addSubcommand(subcommand =>
			subcommand
				.setName('id')
				.setDescription('Get the response by its database entry id')
				.addNumberOption(option => 
					option.setName('number')
						.setDescription('The numerical id of the database entry to modify')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('newphrase')
						.setDescription('The new phrase to replace this one with')
						.setRequired(false))
				.addNumberOption(option => 
					option.setName('list')
						.setDescription('blacklist or whitelist')
						.setRequired(false)
						.addChoices(
							{ name: 'blacklist', value: 0 },
							{ name: 'whitelist', value: 1 },
						))
				.addNumberOption(option => 
					option.setName('regex')
						.setDescription('regex entry')
						.setRequired(false)
						.addChoices(
							{ name: 'normal phrase', value: 0 },
							{ name: 'regex phrase', value: 1 },
						))
				.addStringOption(option => 
					option.setName('newreply')
						.setDescription('The new reply to the phrase')
						.setRequired(false))
				.addBooleanOption(option =>
					option.setName('deletion')
						.setDescription('Should the offending message be deleted?')
						.setRequired(false))
				.addStringOption(option => 
					option.setName('timeout')
						.setDescription('Should the offending user be timed out?')
						.setRequired(false)
						.addChoices(
						{name: 'No', value: 'no'},
						{name: 'One minute', value: 'minute'},
						{name: 'One hour', value: 'hour'},
						{name: 'One day', value: 'day'},
					)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('phrase')
				.setDescription('Get the the response by its full phrase as it exists in the database')
				.addStringOption(option => 
					option.setName('fullphrase')
						.setDescription('The exact phrase as it appears in the database')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('newphrase')
						.setDescription('The new phrase to replace this one with')
						.setRequired(false))
				.addNumberOption(option => 
					option.setName('list')
						.setDescription('blacklist or whitelist')
						.setRequired(false)
						.addChoices(
							{ name: 'blacklist', value: 0 },
							{ name: 'whitelist', value: 1 },
						))
				.addNumberOption(option => 
					option.setName('regex')
						.setDescription('regex entry')
						.setRequired(false)
						.addChoices(
							{ name: 'normal phrase', value: 0 },
							{ name: 'regex phrase', value: 1 },
						))
				.addStringOption(option => 
					option.setName('newreply')
						.setDescription('The new reply to the phrase')
						.setRequired(false))
				.addBooleanOption(option =>
					option.setName('deletion')
						.setDescription('Should the offending message be deleted?')
						.setRequired(false))
				.addStringOption(option => 
					option.setName('timeout')
						.setDescription('Should the offending user be timed out?')
						.setRequired(false)
						.addChoices(
						{name: 'No', value: 'no'},
						{name: 'One minute', value: 'minute'},
						{name: 'One hour', value: 'hour'},
						{name: 'One day', value: 'day'},
					))),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			var response;
			var idNum;
			var phraseString;
			if(subCommand == 'id'){
				idNum = interaction.options.getNumber('number');
				response = Phrases.findOne({where: {id: idNum} });
			}
			else if(subCommand == 'phrase'){
				phraseString = interaction.options.getString('fullphrase');
				response = Phrases.findOne({where: {phrase: phraseString} });
			}
			else{
				//throw an error message
				return interaction.reply({content: "The requested entry was not found. Try running /listphrases to see if it's there!", ephemeral: false});
			}

			response.then(entry => {
				if(!entry){
					return interaction.reply({content: "The requested entry was not found. Try running /listphrases to see if it's there!", ephemeral: false});
				}

				const newphrase = interaction.options.getString('newphrase');
				const listOpt = interaction.options.getNumber('list');
				const regexOpt = interaction.options.getNumber('regex');
				const newreply = interaction.options.getString('newreply');
				const deletion = interaction.options.getBoolean('deletion');
				const timeout = interaction.options.getString('timeout');

				var modPhrase = false;
				var modReply = false;
				var modDelete = false;
				var modTimeout = false;
				var modList = false;
				var modReg = false;

				if(newphrase){
					modPhrase = true;

					if(subCommand == 'id'){
						Phrases.update({phrase: newphrase}, {where: {id: idNum}});
					}
					else{
						Phrases.update({phrase: newphrase}, {where: {phrase: phraseString}});
					}
				}
				if(newreply){
					modReply = true;

					if(subCommand == 'id'){
						Phrases.update({response: newreply}, {where: {id: idNum}});
					}
					else{
						Phrases.update({response: newreply}, {where: {phrase: phraseString}});
					}
				}
				if(deletion != null){
					modDelete = true;

					var deleteVal;
					if(deletion){
						deleteVal = 1;
					}
					else{
						deleteVal = 0;
					}

					if(subCommand == 'id'){
						Phrases.update({deletion: deleteVal}, {where: {id: idNum}});
					}
					else{
						Phrases.update({deletion: deleteVal}, {where: {phrase: phraseString}});
					}
				}
				if(timeout){
					modTimeout = true;

					const minute = 60 * 1000;
					const hour = 60 * 60 * 1000;
					const day = 24 * 60 * 60 * 1000;

					const timeoutString = interaction.options.getString('timeout');
					var timeoutVal;
					if(timeoutString == 'minute'){
						timeoutVal = minute;
					}
					else if(timeoutString == 'hour'){
						timeoutVal = hour;
					}
					else if(timeoutString == 'day'){
						timeoutVal = day;
					}
					
					if(subCommand == 'id'){
						Phrases.update({timeout: timeoutVal}, {where: {id: idNum}});
					}
					else{
						Phrases.update({timeout: timeoutVal}, {where: {phrase: phraseString}});
					}
				}
				if(listOpt)
				{
					modList = true;

					if(subCommand == 'id'){
						Phrases.update({blackwhite: listOpt}, {where: {id: idNum}});
					}
					else{
						Phrases.update({blackwhite: listOpt}, {where: {phrase: phraseString}});
					}
				}
				if(regexOpt)
				{
					modReg = true;
					
					if(subCommand == 'id'){
						Phrases.update({regex: regexOpt}, {where: {id: idNum}});
					}
					else{
						Phrases.update({regex: regexOpt}, {where: {phrase: phraseString}});
					}
				}

				var message = "The following was modified: {";

				if(modPhrase){
					message = message + " phrase ";
				}
				if(modList){
					message = message + " list option ";
				}
				if(modReg){
					message = message + " regex option ";
				}
				if(modReply){
					message = message + " reply ";
				}
				if(modDelete){
					message = message + " deletion ";
				}
				if(modTimeout){
					message = message + " timeout ";
				}
				if(!modPhrase && !modReply && !modDelete && !modTimeout){
					message = message + " nothing! ";
				}
				message = message + "} for entry: ";
				if(subCommand == 'id'){
					message = message + idNum;
				}
				else{
					message = message + `||${phraseString}||`;
				}

				return interaction.reply({content: message, ephemeral: false});
			})
		},
}
