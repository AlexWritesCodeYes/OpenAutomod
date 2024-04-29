const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const AllowList = sequelize.define('allowlist', {
	entry: {
		type: Sequelize.TEXT,
		unique: true,
	},
	roleuser: Sequelize.TINYINT,
	name: Sequelize.TEXT,
});

module.exports = {
	data: new SlashCommandBuilder()
	.setName('namesbypass')
	.setDescription('Add or remove a role or user to the name block bypass list')
	.addSubcommand(subcommand => 
		subcommand
			.setName('addrole')
			.setDescription('add a role to the name block bypass list')
			.addRoleOption(option => 
				option.setName('role')
					.setDescription('The role to add to the name block bypass list')
					.setRequired(true)))
	.addSubcommand(subcommand => 
		subcommand
			.setName('adduser')
			.setDescription('add a user to the name block bypass list')
			.addUserOption(option =>
				option.setName('user')
					.setDescription('The user to add to the name block bypass list')
					.setRequired(true)))
	.addSubcommand(subcommand => 
		subcommand
			.setName('removerole')
			.setDescription('removes a role from the name block bypass list')
			.addRoleOption(option => 
				option.setName('role')
					.setDescription('The role to remove from the name block bypass list')
					.setRequired(true)))
	.addSubcommand(subcommand => 
		subcommand
			.setName('removeuser')
			.setDescription('removes a user from the name block bypass list')
			.addUserOption(option => 
				option.setName('user')
					.setDescription('The user to remove from the name block bypass list')
					.setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand
			.setName('list')
			.setDescription('lists the contents of the name blocker bypass list')),
	execute(interaction){
		const subCommand = interaction.options.getSubcommand();
		var isRole = true;
		if(subCommand == 'adduser' || subCommand == 'removeuser'){ isRole = false; }

		var roleuser = 0;
		if(isRole){ roleuser = 1; }

		var entryID;
		var entryName;
		var message;
		if(subCommand == 'adduser' || subCommand == 'addrole'){
			var entry;
			if(subCommand == 'adduser'){
				entry = interaction.options.getUser('user');
				entryName = entry.username;
			}
			else{
				entry = interaction.options.getRole('role');
				entryName = entry.name;
			}
			entryID = entry.id;

			try{
				AllowList.create({
					entry: entryID,
					roleuser: roleuser,
					name: entryName,
				});
				AllowList.sync();

				if(isRole){
					message = `The ${entryName} role`;
				}
				else{
					message = `User ${entryName}`;
				}
				message = message + ` was added to the name block bypass list.`;
			}
			catch(error){
				message = "Something went wrong with adding ";
				if(isRole){
					message = message + `the ${entryName} role`;
				}
				else{
					message = message + `${entryName}`;
				}
				message = message + `to the name block bypass list. Here's the error: ${error}`;
			}
			finally{
				return interaction.reply({content: message, ephemeral: false});
			}
		}
		else if(subCommand == 'removeuser' || subCommand == 'removerole'){
			var entry;
			if(subCommand == 'removeuser'){
				entry = interaction.options.getUser('user');
			}
			else{
				entry = interaction.options.getRole('role');
			}
			entryID = entry.id;

			const affectedRows = AllowList.destroy({where: {entry: entryID} });
			AllowList.sync();

			affectedRows.then(rows => {
				if(rows){
					if(isRole){
						message = `The ${entry.name} role`;
					}
					else{
						message = `${entry.username}`;
					}
					message = message + ` was removed from the name block bypass list.`;
				}
				else{
					if(isRole){
						message = `The ${entry.name} role`;
					}
					else{
						message = `${entry.username}`;
					}
					message = message + ` was not found in the name block bypass list.`;
				}

				return interaction.reply({content: message, ephemeral: false});
			})
		}
		else if(subCommand == 'list'){
			const channelSentIn = interaction.channel;
			const guild = interaction.guild;

			var message = "|     name block bypass list      |\n----------------------\n";
			var roleName;
			var userName;
			let list = [];
			AllowList.findAll().then(entries => {
				entries.forEach(entry => {
					list.push(entry);
				})

				if(list.length == 0){
					AllowList.sync({force: true});
				}

				console.log("list length " + list.length);
				list.forEach(entry => {
					let roleuser = entry.roleuser;
					if(roleuser == 1 /*this is a role*/){
						message = message + "Role: ";
						
						roleName = entry.name;
						message = message + roleName + "\n---------------\n";
					}
					else{
						message = message + "User: ";

						userName = entry.name;
						message = message + userName + "\n---------------\n";
					}
				})
				return interaction.reply({content: message, ephemeral: false});
			})
		}
	},
};