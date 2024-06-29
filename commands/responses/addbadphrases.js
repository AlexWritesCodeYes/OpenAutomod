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
		.setName('addphrase')
		.setDescription('Add phrases, their word responses, and the followup action to the badphrases list')
		.addStringOption(option => 
			option.setName('phrase')
				.setDescription('The phrase to add')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('regex')
				.setDescription('Is this a regex string?')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('response')
				.setDescription('What should the message response, if any, be?')
				.setRequired(false))
		.addBooleanOption(option => 
			option.setName('delete')
				.setDescription('Should the offending message be deleted?')
				.setRequired(false))
		.addStringOption(option => 
			option.setName('timeout')
				.setDescription('Time out the user who posted it?')
				.setRequired(false)
				.addChoices(
						{name: 'No', value: 'no'},
						{name: 'One minute', value: 'minute'},
						{name: 'One hour', value: 'hour'},
						{name: 'One day', value: 'day'},
					)),
		execute(interaction){
			const badPhrase = interaction.options.getString('phrase').trim().toLowerCase();
			const wordResponse = interaction.options.getString('response');
			const deletion = interaction.options.getBoolean('delete');
			const timeout = interaction.options.getString('timeout');
			const regex = interaction.options.getBoolean('regex');

			let deleteVal = 0;
			if(deletion == true){ deleteVal = 1; }

			let timeoutVal = 0;
			if(timeout == "minute"){
				timeoutVal = 60 * 1000;
			}
			else if(timeout == "hour"){
				timeoutVal = 60 * 60 * 1000;
			}
			else if(timeout == "day"){
				timeoutVal = 24 * 60 * 60 * 1000;
			}

			let regexVal = 0;
			if(regex){
				regexVal = 1;
			}

			try{
				Phrases.create({
					phrase: badPhrase,
					response: wordResponse,
					delete: deleteVal,
					timeout: timeoutVal,
					regex: regexVal,
				});
				Phrases.sync();

				return interaction.reply({content: `Succesfully added ||${badPhrase}||`, ephemeral: false});
			}
			catch(error){
				return interaction.reply({content: `Something went wrong with adding ${badPhrase}: ${error}.`, ephemeral: false});
			}
		},
};