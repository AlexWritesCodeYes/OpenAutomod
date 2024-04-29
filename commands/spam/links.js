const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const LinkBlacklist = sequelize.define('linkblacklist', {
	host: {
		type: Sequelize.TEXT,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('managehost')
		.setDescription('add, remove, or update a host in the link spam blacklist')
		.addSubcommand(subcommand => 
			subcommand
				.setName('add')
				.setDescription('add a host to the link spam blacklist')
				.addStringOption(option =>
					option.setName('host')
						.setDescription('The host to blacklist')
						.setRequired(true)))
		.addSubcommand(subcommand => 
			subcommand
				.setName('delete')
				.setDescription('deletes a host from the link spam blacklist')
				.addStringOption(option => 
					option.setName('host')
						.setDescription('The host to take off the blacklist, as it appears in the database')
						.setRequired(true)))
		.addSubcommand(subcommand => 
			subcommand
				.setName('update')
				.setDescription('keeps a host in the blacklist, but turns protection for that host on or off')
				.addStringOption(option => 
					option.setName('host')
						.setDescription('The host to turn on or off in the blacklist')
						.setRequired(true))
				.addStringOption(option => 
					option.setName('onoff')
						.setDescription('Should the spam protection block links from this host?')
						.setRequired(true)
						.addChoices(
							{name: 'Yes', value: 'on'},
							{name: 'No', value: 'off'},
						))),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();
			const host = interaction.options.getString('host');

			if(subCommand == 'add'){
				const onoff = 1;
				if(host.indexOf('.') == -1){
					return interaction.reply({content: `${host} is not a valid host as it is unresolvable. Example host: \`discord.gg\``, ephemeral: false});
				}
				try{
					LinkBlacklist.create({
						host: host,
						onoff: onoff,
					});
					LinkBlacklist.sync();

					return interaction.reply({content: `${host} added to the link spam blacklist.`, ephemeral: false});
				}
				catch(error){
					return interaction.reply({content: `something went wrong with adding ${host} to the blacklist: ${error}`, ephemeral:false});
				}

			}
			else if(subCommand == 'delete'){
				const rowCount = LinkBlacklist.destroy({where: {host: host}});
				LinkBlacklist.sync();

				rowCount.then(count => {
					if(count){
						return interaction.reply({content: `${host} was removed from the blacklist`, ephemeral: false});
					}
					return interaction.reply({content: `${host} was not found on the blacklist. Try running the /blacklist command to see if it's there!`, ephemeral: false});
				})
			}
			else if(subCommand == 'update'){
				const onoff = interaction.options.getString('onoff');
				var onoffVal = 0;
				if(onoff == 'on'){ onoffVal = 1; }

				const rowCount = LinkBlacklist.update({onoff: onoffVal}, {where: {host: host}});
				LinkBlacklist.sync();

				rowCount.then(count => {
					if(count){
						let msg = "The spam protection settings were set to " + onoff + " for " + host;
						return interaction.reply({content: msg, ephemeral: false});
					}
					return interaction.reply({content: `${host} was not updated or not found in the database. Try running the /blacklist command to see if it's there!`, ephemeral: false});
				})
			}
		},
};