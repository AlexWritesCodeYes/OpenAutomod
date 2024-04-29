const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const NameBlock = sequelize.define('nameblock', {
	entry: {
		type: Sequelize.TEXT,
		unique: true,
	},
	blackwhite: Sequelize.TINYINT,
	regex: Sequelize.TINYINT,
});

const NameBlockSettings = sequelize.define('nameblocksettings', {
	category: {
		type: Sequelize.TEXT,
		unique: true,
	},
	alert: Sequelize.TINYINT,
	timeout: Sequelize.INTEGER,
});

module.exports = {
	data: new SlashCommandBuilder()
	.setName('managenameslist')
	.setDescription('Add, remove, or update entries in the names blacklist or whitelist')
	.addSubcommand(subcommand => 
		subcommand
			.setName('add')
			.setDescription('add an entry to the names blacklist or whitelist')
			.addStringOption(option =>
				option.setName('entry')
					.setDescription('The word, phrase, or pattern to add')
					.setRequired(true))
			.addStringOption(option => 
				option.setName('blackwhite')
					.setDescription('add to the blacklist or the whitelist?')
					.setRequired(true)
					.addChoices(
						{name: 'Blacklist', value: 'black'},
						{name: 'Whitelist', value: 'white'},
						))
			.addBooleanOption(option => 
				option.setName('regex')
					.setDescription('is this entry a regex pattern?')
					.setRequired(true)))
	.addSubcommand(subcommand => 
		subcommand
			.setName('delete')
			.setDescription('delete an entry from the names blacklist or whitelist')
			.addStringOption(option =>
				option.setName('entry')
					.setDescription('The word, phrase, or pattern to delete')
					.setRequired(true)))
	.addSubcommand(subcommand => 
		subcommand
			.setName('move')
			.setDescription('moves an entry from the names blacklist to the whitelist, or vise versa')
			.addStringOption(option => 
				option.setName('entry')
					.setDescription('The entry to move to/from the blacklist/whitelist')
					.setRequired(true)))
	.addSubcommand(subcommand => 
		subcommand
			.setName('configure')
			.setDescription('configures the response(s) for a user with a name that triggers the blacklist')
			.addBooleanOption(option => 
				option.setName('block')
					.setDescription('Block the user from interacting?')
					.setRequired(true))
			.addBooleanOption(option => 
				option.setName('alert')
					.setDescription('Send an alert to the log channel when a user has a rule-breaking name?')
					.setRequired(true))),
	execute(interaction){
		const subCommand = interaction.options.getSubcommand();
		if(subCommand == 'configure'){
			var blockVal = 0;
			var alertVal = 0;
			if(interaction.options.getBoolean('block')){ blockVal = 28 * 24 * 60 * 60 * 1000; /*28 day timeout*/ }
			if(interaction.options.getBoolean('alert')){ alertVal = 1; }

			let message = `Users who break the name rule will`;
			if(blockVal == 0){ message = message + ` not`; }
			message = message + ` be blocked from interacting. If a user has a rule-breaking name, an alert will`;
			if(alertVal == 0){ message = message + ` not`; }
			message = message + ` be sent to the log channel`;

			var affectedRows = NameBlockSettings.update({alert: alertVal, timeout: blockVal}, {where: {category: 'general'}});
			NameBlockSettings.sync();

			affectedRows.then(rows => {
				if(rows[0] > 0){
					return interaction.reply({content: message, ephemeral: false});
				}
				else{
					try{
						NameBlockSettings.create({
							category: 'general',
							alert: alertVal,
							timeout: blockVal,
						});
						NameBlockSettings.sync();

						return interaction.reply({content: message, ephemeral: false});
					}
					catch(error){
						return interaction.reply({content: `something went wrong with the configure subcommand. here's the error: ${error}`, ephemeral: false});
					}
				}
			})
		}
		else{
			const entry = interaction.options.getString('entry');

			if(subCommand == 'add'){
				const blackwhite = interaction.options.getString('blackwhite');
				var regexVal = 0;
				var blackwhiteVal = 0; //whitelist
				if(interaction.options.getBoolean('regex')){ regexVal = 1; }
				if(blackwhite == 'black'){ blackwhiteVal = 1; }//blacklist

				try{
					NameBlock.create({
						entry: entry,
						blackwhite: blackwhiteVal,
						regex: regexVal,
					});
					NameBlock.sync();
					
					return interaction.reply({content: `||${entry}|| was added to the names ${blackwhite}list`, ephemeral: false});
				}
				catch(error){
					return interaction.reply({content: `Something went wrong with adding ||${entry}|| to the ${blackwhite}list: ${error}.`, ephemeral: false});
				}
			}
			else{
				var rowCount;
				var message;
				if(subCommand == 'delete'){
					rowCount = NameBlock.destroy({where: {entry: entry} });
					NameBlock.sync();

					message = `||${entry}|| was deleted from the name block database.`;

					rowCount.then(rc => {
						if(rc){
							return interaction.reply({content: message, ephemeral: false});
						}
						else{
							message = `something went wrong with the ${subCommand} subcommand. Likely the entry wasn't found in the database. If you're sure it's in there, tell an admin to check the logs.`;
							return interaction.reply({content: message, ephemeral: false});
						}
					})
				}
				else if(subCommand == 'move'){
					let dbEntry = NameBlock.findOne({where: {entry: entry}});
					if(!dbEntry){
						return interaction.reply({content: `${entry} was not found in the name blocker database.`, ephemeral: false});
					}
					let bwVal = 0;
					bwNewVal = 1;
					let bwText = 'white';
					let bwNewText = 'black';
					dbEntry.then(dbe => {
						bwVal = dbe.blackwhite;
						if(bwVal == 1){ 
							bwNewVal = 0;
							bwText = 'black'; 
							bwNewText = 'white';
						}
						rowCount = NameBlock.update({blackwhite: bwNewVal}, {where: {entry: entry}});
						NameBlock.sync();

						message = `||${entry}|| was moved from the ${bwText}list to the ${bwNewText}list in the name block database.`;

						rowCount.then(rc => {
							if(rc[0] > 0){
								return interaction.reply({content: message, ephemeral: false});
							}
							else{
								message = `something went wrong with the ${subCommand} subcommand. Likely the entry wasn't found in the database. If you're sure it's in there, tell an admin to check the logs.`;
								return interaction.reply({content: message, ephemeral: false});
							}
						})
					})
				}
			}
		}
	},
};