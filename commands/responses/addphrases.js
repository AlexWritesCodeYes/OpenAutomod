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
		.setName('addphrase')
		.setDescription('Add phrases, their word responses, and the followup action to the badphrases list')
		.addStringOption(option => 
			option.setName('phrase')
				.setDescription('The phrase to add')
				.setRequired(true))
		.addNumberOption(option => 
			option.setName('list')
				.setDescription('blacklist or whitelist')
				.setRequired(true)
				.addChoices(
					{ name: 'blacklist', value: 0 },
					{ name: 'whitelist', value: 1 },
				))
		.addNumberOption(option => 
			option.setName('regex')
				.setDescription('regex entry')
				.setRequired(true)
				.addChoices(
					{ name: 'normal phrase', value: 0 },
					{ name: 'regex phrase', value: 1 },
				))
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
			const thePhrase = interaction.options.getString('phrase').trim().toLowerCase();
			const listOpt = interaction.options.getNumber('list');
			const regexOpt = interaction.options.getNumber('regex');
			const wordResponse = interaction.options.getString('response');
			const deletion = interaction.options.getBoolean('delete');
			const timeout = interaction.options.getString('timeout');

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

			try{
				Phrases.create({
					phrase: thePhrase,
					blackwhite: listOpt,
					regex: regexOpt,
					response: wordResponse,
					delete: deleteVal,
					timeout: timeoutVal,
				});
				Phrases.sync();

				return interaction.reply({content: `Succesfully added ||${thePhrase}||`, ephemeral: false});
			}
			catch(error){
				return interaction.reply({content: `Something went wrong with adding ${thePhrase}: ${error}.`, ephemeral: false});
			}
		},
};
