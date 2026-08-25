const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Systems = sequelize.define('system', {
	category: {
		type: Sequelize.STRING,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
});

module.exports = {
	data: new SlashCommandBuilder()
	.setName('aegisbans')
	.setDescription('get or set the channel for monitoring the aegis bot')
		.addSubcommand(subcommand => 
			subcommand
				.setName('check')
				.setDescription('check if automatic aegis bans are on or off'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('switch')
				.setDescription('turns automatic aegis bans on or off')),
	execute(interaction){
		const subCommand = interaction.options.getSubcommand();

		if(subCommand == 'check'){
			var message = "Automatic aegis bans are ";
			let addTxt = "not currently set. Setting them to the default (off).";

			try{
				Systems.findOne({where: {category: "aegis"} }).then(aegisbans => {
					if(aegisbans){
						addTxt = aegisbans.onoff == 1 ? "currently on." : "currently off.";
					}
					message = message + addTxt;
					return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
				})
			}
			catch(error){
				message = `Something went wrong with getting the automatic aegis ban settings! Here's the error: ${error}`;
				return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
			}
		}
		else if(subCommand == 'switch'){
			var message = "Automatic aegis bans were ";
			var onoff = 0;
			var addTxt;
			try{
				Systems.findOne({where: {category: "aegis"} }).then(aegisbans => {
					if(aegisbans){
						addTxt = aegisbans.onoff == 1 ? "on. They have been switched off." : "off. They have been switched on.";
						onoff = aegisbans.onoff == 1 ? 0 : 1; //flip the switch

						const affectedRows = Systems.update({onoff: onoff}, {where: {category: "aegis"} });
						Systems.sync();
					}
					else{
						addTxt = "not set. Setting them to the default (off).";
						Systems.create({
							category: "aegis",
							onoff: onoff,
						});
						Systems.sync();
					}
					message = message + addTxt;
					return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
				})
			}
			catch(error){
				message = `Something went wrong with changing the automatic aegis ban settings! Here's the error: ${error}`;
				return interaction.reply({content: message, flags: MessageFlags.Ephemeral });
			}
		}
	},
};