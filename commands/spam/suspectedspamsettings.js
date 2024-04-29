const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const SuspectedSpamSettings = sequelize.define('susspam', {
	category: {
		type: Sequelize.TEXT,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
	delete: Sequelize.TINYINT,
	alert: Sequelize.TINYINT,
	timeout: Sequelize.INTEGER,
	messagelimit: Sequelize.SMALLINT,
	channellimit: Sequelize.SMALLINT,
	timeframe: Sequelize.INTEGER,
});

const minute = 60 * 1000;
const hour = minute * 60;
const day = hour * 24;

module.exports = {
	data: new SlashCommandBuilder()
	.setName('suspectedconfig')
	.setDescription('Configure the settings for various types of suspected spam')
	.addSubcommand(subcommand => 
		subcommand
			.setName('standard')
			.setDescription('The standard settings for suspected spam protection')
			.addBooleanOption(option => 
				option.setName('onoff')
					.setDescription('Should this protection be on?')
					.setRequired(true))
			.addBooleanOption(option => 
				option.setName('delete')
					.setDescription('Delete messages containing the suspected spam?')
					.setRequired(false))
			.addBooleanOption(option => 
				option.setName('alert')
					.setDescription('Send an alert to the log channel when suspected spam is detected?')
					.setRequired(false))
			.addStringOption(option => 
				option.setName('timeout')
					.setDescription('Time out the user who posted the spam?')
					.setRequired(false)
					.addChoices(
							{name: 'No', value: 'no'},
							{name: 'One minute', value: 'minute'},
							{name: 'One hour', value: 'hour'},
							{name: 'One day', value: 'day'},
						))
			.addNumberOption(option => 
				option.setName('messages')
					.setDescription('How many of the same message should count as spam?')
					.setRequired(false))
			.addNumberOption(option => 
				option.setName('channels')
					.setDescription('How many channels must the same message be posted in to count as spam?')
					.setRequired(false))
			.addNumberOption(option => 
				option.setName('timeframe')
					.setDescription('The timeframe (IN MILLISECONDS) in which to detect duplicate message spam')
					.setRequired(false)))
	.addSubcommand(subcommand => 
		subcommand
			.setName('link')
			.setDescription('The settings for link spam protection')
			.addBooleanOption(option => 
				option.setName('onoff')
					.setDescription('Should this protection be on?')
					.setRequired(true))
			.addBooleanOption(option => 
				option.setName('delete')
					.setDescription('Delete messages containing the suspected spam?')
					.setRequired(false))
			.addBooleanOption(option => 
				option.setName('alert')
					.setDescription('Send an alert to the log channel when a suspected spam link is posted?')
					.setRequired(false))
			.addStringOption(option => 
				option.setName('timeout')
					.setDescription('Time out the user who posted the suspected spam link?')
					.setRequired(false)
					.addChoices(
							{name: 'No', value: 'no'},
							{name: 'One minute', value: 'minute'},
							{name: 'One hour', value: 'hour'},
							{name: 'One day', value: 'day'},
						)))
	.addSubcommand(subcommand =>
			subcommand
				.setName('current')
				.setDescription('Posts the current configuration settings')),
	execute(interaction){
		const subCommand = interaction.options.getSubcommand();

		if(subCommand == 'current'){
			var message = "The standard suspected spam protection is ";
			SuspectedSpamSettings.findOne({where: {category: 'standard'}}).then(entry => {
				if(entry){
					const onoffVal = entry.onoff;
					const deletionVal = entry.delete;
					const alertVal = entry.alert;
					const timeoutVal = entry.timeout;
					const timeframeVal = entry.timeframe;
					const channellimitVal = entry.channellimit;
					const messagelimitVal = entry.messagelimit;

					var onoff = "on";
					if(onoffVal == 0){
						onoff = "off";
					}
					message = message + onoff + ".";

					var messageLimit;
					if(messagelimitVal){
						message = message + " When this protection is on, the same message posted " + messagelimitVal + " times, ";
					}
					else{
						message = message + " However, the message limit was not set. Please set this value by using the 'standard' subcommand of this command.";
						return interaction.reply({content: message, ephemeral: false});
					}

					message = message + " in at least ";
					if(channellimitVal){
						message = message + channellimitVal;
					}
					else{
						message = message + "1";
					}
					message = message + " channel(s), ";

					message = message + " within the span of ";
					if(timeframeVal){
						message = message + (timeframeVal/1000) + " seconds, will be considered suspected spam.";
					}
					else{
						message = "The standard suspected spam protection is on, but no timeframe was specified. Please set this value by using the 'standard' subcommand of this command.";
						return interaction.reply({content: message, ephemeral: false});
					}

					message = message + " If suspected spam is detected, the suspected spam messages posted within the specified time frame will ";
					if(!deletionVal){
						message = message + "not ";
					}
					message = message + "be deleted. Additionally, an alert will ";

					if(!alertVal){
						message = message + "not ";
					}
					message = message + "be sent in the specified log channel. Lastly, the user who posted the suspected spam content will ";

					if(!timeoutVal){
						message = message + "not be timed out";
					}
					else{
						message = message + "be timed out for ";
						if(timeoutVal == minute){
							message = message + "a minute";
						}
						else if(timeoutVal == hour){
							message = message + "an hour";
						}
						else if(timeoutVal == day){
							message = message + "a day";
						}
					}
					message = message + ". Note that admins cannot be timed out.";
				}
				else{
					message = message + "not configured. Use the 'standard' subcommand of this command to configure those settings.";
				}
				message = message + "\n----------------------------\n";
				SuspectedSpamSettings.findOne({where: {category: 'link'}}).then(entry => {
					message = message + "The link spam protection is ";
					if(entry){
						const onoffVal = entry.onoff;
						const deletionVal = entry.delete;
						const alertVal = entry.alert;
						const timeoutVal = entry.timeout;

						var onoff = "off";
						if(onoffVal == 1){
							onoff = "on";
						}
						message = message + onoff + ". When this protection is on, and a user posts a link whose host URL is on the link blacklist, the message containing the link will ";

						if(!deletionVal){
							message = message + "not ";
						}
						message = message + "be deleted. Additionally, an alert will ";

						if(!alertVal){
							message = message + "not ";
						}
						message = message + "be sent to the designated log channel. Lastly, the user who posted the suspected spam link will ";

						if(!timeoutVal){
							message = message + "not be timed out.";
						}
						else{
							message = message + "be timed out for ";

							if(timeoutVal == minute){
								message = message + "a minute.";
							}
							else if(timeoutVal == hour){
								message = message + "an hour.";
							}
							else if(timeoutVal == day){
								message = message + "a day.";
							}
						}
						message = message + " Note that admins cannot be timed out.";
					}
					else{
						message = message + "not configured. Use the 'link' subcommand of this command to configure those settings.";		
					}

					return interaction.reply({content: message, ephemeral: false});
				})
			})
		}
		else{
			var replyMsg = "The following was updated: {";

			const onoff = interaction.options.getBoolean('onoff');
			const deletion = interaction.options.getBoolean('delete');
			const alert = interaction.options.getBoolean('alert');
			const timeout = interaction.options.getString('timeout');

			var onoffVal = 0;
			var deletionVal = 0;
			var alertVal = 0;
			if(onoff){ onoffVal = 1; }
			if(deletion == true){ deletionVal = 1; }
			if(alert == true){ alertVal = 1; }

			let timeoutVal = 0;
			if(timeout == "minute"){
				timeoutVal = minute;
			}
			else if(timeout == "hour"){
				timeoutVal = hour;
			}
			else if(timeout == "day"){
				timeoutVal = day;
			}

			var msgCount = null;
			var chnlCount = null;
			var timeframe = null;
			if(subCommand == 'standard'){
				msgCount = interaction.options.getNumber('messages');
				if(msgCount && msgCount < 2){ msgCount = 2; }
				chnlCount = interaction.options.getNumber('channels');
				timeframe = interaction.options.getNumber('timeframe');
			}

			SuspectedSpamSettings.findOne({where: {category: subCommand}}).then(entry => {
				if(entry){
					if(entry.onoff != onoffVal){
						replyMsg = replyMsg + "onoff ";
						SuspectedSpamSettings.update({onoff: onoffVal}, {where: {category: subCommand}});
					}
					if(deletion != null){
						replyMsg = replyMsg + "deletion ";
						SuspectedSpamSettings.update({delete: deletionVal}, {where: {category: subCommand}});
					}
					if(alert != null){
						replyMsg = replyMsg + "alert ";
						SuspectedSpamSettings.update({alert: alertVal}, {where: {category: subCommand}});
					}
					if(timeout){
						replyMsg = replyMsg + "timeout ";
						SuspectedSpamSettings.update({timeout: timeoutVal}, {where: {category: subCommand}});
					}
					SuspectedSpamSettings.sync();
				}
				else{
					replyMsg = replyMsg + "onoff deletion alert timeout ";
					SuspectedSpamSettings.create({
						category: subCommand,
						onoff: onoffVal,
						delete: deletionVal,
						alert: alertVal,
						timeout: timeoutVal,
					})
					SuspectedSpamSettings.sync();
				}

				if(subCommand == 'standard'){
					if(msgCount){
						replyMsg = replyMsg + "message_limit ";
						SuspectedSpamSettings.update({messagelimit: msgCount}, {where: {category: subCommand}});
					}
					if(chnlCount){
						replyMsg = replyMsg + "channel_limit ";
						SuspectedSpamSettings.update({channellimit: chnlCount}, {where: {category: subCommand}});
					}
					if(timeframe){
						replyMsg = replyMsg + "timeframe ";
						SuspectedSpamSettings.update({timeframe: timeframe}, {where: {category: subCommand}});
					}
					SuspectedSpamSettings.sync();
				}

				replyMsg = replyMsg.trim() + "} for the " + subCommand + " suspected spam protection settings.";

				return interaction.reply({content: replyMsg, ephemeral: false});
			})
		}
	},
};