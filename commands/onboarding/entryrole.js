const { ChannelType, SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Roles = sequelize.define('roles', {
	name: {
		type: Sequelize.TEXT,
		unique: true,
	},
	roleID: Sequelize.TEXT,
	roleName: Sequelize.TEXT,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('entryrole')
		.setDescription('Get or set the server entry role')
		.addSubcommand(subcommand => 
			subcommand
				.setName('get')
				.setDescription('gets the current server entry role'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('set')
				.setDescription('sets the server entry role')
				.addRoleOption(option => 
					option.setName('role')
						.setDescription('the server entry role')
						.setRequired(true))),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			if(subCommand == 'get'){
				let message = "The role granting full server access is ";
				var entryRoleName = "not set! Try using the 'set' subcommand to set it.";

				try{
					Roles.findOne({where: {name: "entry"} }).then(entryrole => {
						if(entryrole){
							entryRoleName = "@" + entryrole.roleName;
						}
						message = message + entryRoleName;
						return interaction.reply({content: message, ephemeral: false});
					})
				}
				catch(error){
					message = `Something went wrong with getting the entry role! Here's the error: ${error}`;
					return interaction.reply({content: message, ephemeral: false});
				}
			}
			else if(subCommand == 'set'){
				let message = "The role granting full server access has been set to ";
				let role = interaction.options.getRole('role');
				let roleName = role.name;
				let roleID = role.id;
				var entryRoleName = "";

				const affectedRows = Roles.update({roleID: roleID, roleName: roleName}, {where: {name: "entry"} });
				Roles.sync();

				affectedRows.then(rows => {
					if(rows[0] > 0){
						message = message + "@" + roleName;
						return interaction.reply({content: message, ephemeral: false});
					}
					else{
						try{
							Roles.create({
								name: "entry",
								roleID: roleID,
								roleName: roleName,
							});
							Roles.sync();
							message = message + "@" + roleName;
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
		},
};
