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
		.setName('modrole')
		.setDescription('Get or set the moderator role')
		.addSubcommand(subcommand => 
			subcommand
				.setName('get')
				.setDescription('gets the current moderator role'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('set')
				.setDescription('sets the moderator role')
				.addRoleOption(option => 
					option.setName('role')
						.setDescription('the moderator role')
						.setRequired(true))),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();

			if(subCommand == 'get'){
				let message = "The moderator role is ";
				var modRoleName = "not set! Try using the 'set' subcommand to set it.";

				try{
					Roles.findOne({where: {name: "mod"} }).then(modrole => {
						if(modrole){
							modRoleName = "@" + modrole.roleName;
						}
						message = message + modRoleName;
						return interaction.reply({content: message, ephemeral: false});
					})
				}
				catch(error){
					message = `Something went wrong with getting the mod role! Here's the error: ${error}`;
					return interaction.reply({content: message, ephemeral: false});
				}
			}
			else if(subCommand == 'set'){
				let message = "The moderator role has been set to ";
				let role = interaction.options.getRole('role');
				let roleName = role.name;
				let roleID = role.id;
				var modRoleName = "";

				const affectedRows = Roles.update({roleID: roleID.toString(), roleName: roleName}, {where: {name: "mod"} });
				Roles.sync();

				affectedRows.then(rows => {
					if(rows[0] > 0){
						message = message + "@" + roleName;
						return interaction.reply({content: message, ephemeral: false});
					}
					else{
						try{
							Roles.create({
								name: "mod",
								roleID: roleID.toString(),
								roleName: roleName,
							});
							Roles.sync();
							message = message + "@" + roleName;
						}
						catch(error){
							message = "Something went wrong with setting the mod role. Here's the error: " + error;
						}
						finally{
							return interaction.reply({content: message, ephemeral: false});
						}
					}
				})
			}
		},
};