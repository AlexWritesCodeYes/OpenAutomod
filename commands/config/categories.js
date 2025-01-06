const { ChannelType, SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Categories = sequelize.define('categories', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
	categoryID: Sequelize.TEXT,
});

//currently this only sets the welcome category, but in the future this will be used for other category management
module.exports = {
	data: new SlashCommandBuilder()
		.setName('categories')
		.setDescription('Sets or gets the IDs of various categories')
		.addSubcommand(subcommand =>
			subcommand
				.setName('welcome')
				.setDescription('sets the category under which welcome channels get created')
				.addStringOption(option =>
					option.setName('categoryid')
						.setDescription('The numerical ID of the welcome channel category')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('all')
				.setDescription('returns a list of all currently set categories')),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			if(subCommand == 'welcome'){
				let message = "The ID of the welcome channel category ";
				let msg = "was not set, but is now set to ";

				const catID = interaction.options.getString('categoryid');
				const affectedRows = Categories.update({categoryID: catID}, {where: {name: "welcome"} });
				Categories.sync();

				affectedRows.then(rows => {
					if(rows[0] > 0){
						message = message + "was set to " + catID;
						return interaction.reply({content: message, ephemeral: false});
					}
					else{
						try{
							Categories.create({
								name: "welcome",
								categoryID: catID,
							});
							Categories.sync();
							message = message + msg + catID;
						}
						catch(error){
							message = "Something went wrong with setting the entry role. Here's the error: " + error;
						}
						finally{
							return interaction.reply({content: message, ephemeral: false});
						}
					}
				})
			}
			if(subCommand == 'all'){
				var message = "====Categories====\n"
				Categories.findAll().then(categories => {
					categories.forEach(category => {
						message = message + "name: " + category.name + " | ID: " + category.categoryID + "\n";
					})
				})
				message = message + "====================";
				return interaction.reply({content: message, ephemeral: false});
			}
		}
};