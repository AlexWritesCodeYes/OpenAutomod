const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Template = sequelize.define('template', {
	url: {
		type: Sequelize.STRING,
		unique: true,
	},
	name: Sequelize.STRING,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('template')
		.setDescription('Get or set the server template(s)')
		.addSubcommand(subcommand => 
			subcommand
				.setName('get')
				.setDescription('gets the current server template link'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('set')
				.setDescription('sets the template link to sync')
				.addStringOption(option => 
					option.setName('url')
						.setDescription('the url of the template you wish to be synced regularly')
						.setRequired(true)))
		.addSubcommand(subcommand => 
			subcommand
				.setName('sync')
				.setDescription('syncs the currently set server template')),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			if(subCommand == 'get'){
				let message = "The server template link is ";
				var templateLink = "not set! Try setting it with the 'set' subcommand.";
				try{
					Template.findOne({where: {name: "default"} }).then(template => {
						if(template){
							templateLink = template.url;
						}
						message = message + templateLink;
						return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
					})
				}
				catch(error){
					message = `Something went wrong with getting the server template! Here's the error: ${error}`;
					return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
				}
			}
			else if(subCommand == 'set'){
				const url = interaction.options.getString('url');
				if(url.slice(0,20) != "https://discord.new/"){
					return interaction.reply({content: `${url} is not a valid server template URL`, flags: MessageFlags.Ephemeral });
				}

				const affectedRows = Template.update({url: url}, {where: {name: "default"} });
				Template.sync(); //this syncs the database, not the template itself

				let message = "The server template url was set to " + url;
				affectedRows.then(rows => {
					if(rows[0] > 0){
						return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
					}
					else{
						try{
							Template.create({
								url: url,
								name: "default",
							});
							Template.sync();
						}
						catch(error){
							message = "Something went wrong with setting the server template. Here's the error: " + error;
						}
						finally{
							return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
						}
					}
				})
			}
			else if(subCommand == 'sync'){
				try{
					let message = "Synced template ";
					Template.findOne({where: {name: "default"} }).then(entry => {
						if(entry){
							if(entry.url.slice(0,20) != "https://discord.new/"){
								return interaction.reply({content: `The server template was set to "${entry.url}", which is an invalid template url. Please use \`/template set\` to correct this.`, flags: MessageFlags.Ephemeral });
							}
							interaction.guild.client.fetchGuildTemplate(entry.url).then(template => {
								template.sync();

								message = message + template.name;
								return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
							})
						}
						else{
							message = "Server template has not been set! Try setting it with the 'set' subcommand.";
							return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
						}
					})
				}
				catch(error){
					return interaction.reply({content: `Something went wrong with syncing the server template! Here's the error: ${error}`, flags: MessageFlags.Ephemeral });
				}
			}
		},
};
