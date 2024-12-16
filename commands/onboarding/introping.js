const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Introping = sequelize.define('introping', {
	category: {
		type: Sequelize.STRING,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
});

//TODO: create a database to track whether the user has introduced themselves before or not to prevent spam pings caused by impatient new users

module.exports = {
	data: new SlashCommandBuilder()
		.setName('intronotify')
		.setDescription('Enable or disable the pinging of the mod role when a new user introduces themselves once')
		.addSubcommand(subcommand => 
			subcommand
				.setName('enable')
				.setDescription('enables the pinging of the mod role when a user introduces themselves'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('disable')
				.setDescription('disables the pinging of the mod role when a user introduces themselves'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('current')
				.setDescription('gets the current settings for introduction notifications')),
	execute(interaction){
		const subCommand = interaction.options.getSubcommand();
		if(subCommand == 'current'){
			var message = "The pinging of the moderator role upon a new user introducing themselves for the first time is currently "

			var configMessage = "Not configured. I will now attempt to turn it on (the default setting). Run the enable or disable subcommands to enable or disable it.";
			var onoff;
			try{
				Introping.findOne({where: {category: "standard"} }).then(settings => {
					if(settings){
						onoff = settings.onoff;
					}
					else{
						//onoff = 1;
							message = message + configMessage;
						try{
							Introping.create({
								category: "standard",
								onoff: '1',
							});
							Introping.sync();
						}
						catch(error){
							message = "Something went wrong with configuring the introduction ping settings. Here's the error: " + error;
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
				message = `Something went wrong with checking if the introduction pinging is enabled! Here's the error: ${error}`;
				return interaction.reply({content: message, ephemeral: true});
			}
		}
		else{
			var onoff = 1;
			if(subCommand == 'disable'){
				onoff = 0;
			}

			const affectedRows = Introping.update({onoff: onoff}, {where: {category: "standard"} });
			Introping.sync();

			let message = "The pinging of the moderator role upon a new user posting in the introductions channel for the first time is now " + subCommand + "d.";
			affectedRows.then(rows => {
				if(rows[0] > 0){
					return interaction.reply({content: message, ephemeral: false});
				}
				else{
					try{
						Introping.create({
							category: "standard",
							onoff: onoff,
						});
						Introping.sync();
					}
					catch(error){
						message = "Something went wrong with configuring the introduction moderator pings. Here's the error: " + error;
					}
					finally{
						return interaction.reply({content: message, ephemeral: false});
					}
				}
			})
		}
	},
};