const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Accounts = sequelize.define('accounts', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
	accountID: Sequelize.TEXT,
	bot: Sequelize.TINYINT,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('acquireaegis')
		.setDescription('input the aegis bot account for ban parsing')
		.addUserOption(option => 
			option.setName('account')
				.setDescription('the aegis bot account')
				.setRequired(true)),
	execute(interaction){
		var aegis = interaction.options.getUser('account');
		var accountID = aegis.id;
		//comment out the line below for testing
		if(!aegis.bot){ return interaction.reply({content: "Error: this command must be used on a bot account", flags: MessageFlags.Ephemeral }); }
		var bot = 1;

		const affectedRows = Accounts.update({accountID: accountID}, {where: {name: "aegis"} });
		Accounts.sync();

		let message = "The aegis account in the database has been ";
		affectedRows.then(rows => {
			if(rows[0] > 0){
				message = message + "updated.";
				return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
			}
			else{
				try{
					Accounts.create({
						name: "aegis",
						accountID: accountID,
						bot: bot,
					});
					Accounts.sync();

					message = message + "set.";
				}
				catch(error){
					message = "Something went wrong with setting the aegis bot in the database. Here's the error: " + error;
				}
				finally{
					return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
				}
			}
		})
	},
};