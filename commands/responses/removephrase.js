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
		.setName('delphrase')
		.setDescription('Modify a phrase entry if it exists in the database')
		.addSubcommand(subcommand =>
			subcommand
				.setName('id')
				.setDescription('Modify the phrase by its database entry id')
				.addNumberOption(option => 
					option.setName('number')
						.setDescription('The numerical database entry id of the phrase to modify')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('phrase')
				.setDescription('Modify the phrase by entering the full phrase as it exists in the database')
				.addStringOption(option => 
					option.setName('fullphrase')
						.setDescription('The exact phrase as it appears in the database')
						.setRequired(true))),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			var rowCount;
			if(subCommand == 'id'){
				const idNum = interaction.options.getNumber('number');
				rowCount = Phrases.destroy({where: {id: idNum} });
			}
			else if(subCommand == 'phrase'){
				const phraseString = interaction.options.getString('fullphrase');
				rowCount = Phrases.destroy({truncate: true, cascade: true, restartIdentity: true, where: {phrase: phraseString} });
			}
			Phrases.sync();

			rowCount.then(count => {
				if(count){
					return interaction.reply({content: 'The requested entry was removed', ephemeral: false});
				}

				return interaction.reply({content: 'The requested entry was not found', ephemeral: false});
			})
		},
};
