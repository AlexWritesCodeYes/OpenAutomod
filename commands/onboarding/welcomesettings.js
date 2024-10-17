const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Welcome = sequelize.define('welcome', {
	category: {
		type: Sequelize.STRING,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('welcome')
		.setDescription('Enable or disable the creation of welcome channels')
		.addSubcommand(subcommand => 
			subcommand
				.setName('enable')
				.setDescription('enables the creation of welcome channels'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('disable')
				.setDescription('disables the creation of welcome channels'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('current')
				.setDescription('gets the current setting for the welcome channels')),
	execute(interaction){
		const subCommand = interaction.options.getSubcommand();
		if(subCommand == 'current'){
			var message = "The creation of welcome channels upon a new user joining the server is currently ";

			var msg = "not configured. I will now attempt to turn it on (the default setting). Run the enable or disable subcommands to enable or disable it.";
			var onoff;
			try{
				Welcome.findOne({where: {category: "standard"} }).then(welcome => {
					if(welcome){
						onoff = welcome.onoff;
					}
					else{
						//onoff = 1;
						message = message + msg;
						try{
							Welcome.create({
								category: "standard",
								onoff: '1',
							});
							Welcome.sync();
						}
						catch(error){
							message = "Something went wrong with configuring the welcome channels. Here's the error: " + error;
						}
						finally{
							return interaction.reply({content: message, ephemeral: true});
						}
					}
					
					if(onoff == 1){
						message = message + "enabled.";
					}
					else if(onoff == 0){
						message = message + "disabled.";
					}
					return interaction.reply({content: message, ephemeral: false});
				})
			}
			catch(error){
				message = `Something went wrong with checking if the welcome channel creation is enabled! Here's the error: ${error}`;
				return interaction.reply({content: message, ephemeral: true});
			}
		}
		else{
			var onoff = 1;
			if(subCommand == 'disable'){
				onoff = 0;
			}

			const affectedRows = Welcome.update({onoff: onoff}, {where: {category: "standard"} });
			Welcome.sync();

			let message = "The creation of welcome channels upon a new user joining is now " + subCommand + "d.";
			affectedRows.then(rows => {
				if(rows[0] > 0){
					return interaction.reply({content: message, ephemeral: false});
				}
				else{
					try{
						Welcome.create({
							category: "standard",
							onoff: onoff.toString(),
						});
						Welcome.sync();
					}
					catch(error){
						message = "Something went wrong with configuring the welcome channels. Here's the error: " + error;
					}
					finally{
						return interaction.reply({content: message, ephemeral: false});
					}
				}
			})
		}
	},
};