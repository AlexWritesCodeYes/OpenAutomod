const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const MentionSpamSettings = sequelize.define('mentionspam', {
	category: {
		type: Sequelize.TEXT,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
	uniques: Sequelize.SMALLINT,
	delete: Sequelize.TINYINT,
	alert: Sequelize.TINYINT,
	timeout: Sequelize.INTEGER,
	timeframe: Sequelize.INTEGER,		//the last three are for
	msglimit: Sequelize.SMALLINT,		//raid settings
	userlimit: Sequelize.MEDIUMINT,	//i think
});

const minute = 60 * 1000;
const hour = minute * 60;
const day = hour * 24;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mentionconfig')
		.setDescription('Configure the settings for various types of mention spam')
		.addSubcommand(subcommand =>
			subcommand
				.setName('standard')
				.setDescription('The standard settings for mention spam protection')
				.addBooleanOption(option => 
					option.setName('onoff')
						.setDescription('Should this protection be on?')
						.setRequired(true))
				.addNumberOption(option => 
					option.setName('uniques')
						.setDescription('How many unique mentions per message constitutes mention spam?')
						.setRequired(false))
				.addBooleanOption(option => 
					option.setName('delete')
						.setDescription('Delete messages containing mention spam?')
						.setRequired(false))
				.addBooleanOption(option => 
					option.setName('alert')
						.setDescription('Send an alert to the log channel when mention spam is detected?')
						.setRequired(false))
				.addStringOption(option => 
					option.setName('timeout')
						.setDescription('Time out the user who posted the mention spam?')
						.setRequired(false)
						.addChoices(
								{name: 'No', value: 'no'},
								{name: 'One minute', value: 'minute'},
								{name: 'One hour', value: 'hour'},
								{name: 'One day', value: 'day'},
							)))
		.addSubcommand(subcommand => 
			subcommand
				.setName('raid')
				.setDescription('The settings for mention spam raid protection')
				.addBooleanOption(option => 
					option.setName('onoff')
						.setDescription('Should this protection be on?')
						.setRequired(true))
				.addNumberOption(option => 
					option.setName('uniques')
						.setDescription('How many unique mentions per message constitutes mention spam?')
						.setRequired(false))
				.addBooleanOption(option => 
					option.setName('delete')
						.setDescription('Delete messages containing the mention spam?')
						.setRequired(false))
				.addBooleanOption(option => 
					option.setName('alert')
						.setDescription('Send an alert to the log channel when a mention spam raid is detected?')
						.setRequired(false))
				.addStringOption(option => 
					option.setName('timeout')
						.setDescription('Time out the users who posted the mention spam?')
						.setRequired(false)
						.addChoices(
								{name: 'No', value: 'no'},
								{name: 'One minute', value: 'minute'},
								{name: 'One hour', value: 'hour'},
								{name: 'One day', value: 'day'},
							))
				.addNumberOption(option => 
					option.setName('timeframe')
						.setDescription('The timeframe (IN MILLISECONDS) in which to detect raid messages')
						.setRequired(false))
				.addNumberOption(option => 
					option.setName('msglimit')
						.setDescription('How many mention-spamming messages (within the timeframe) until it constitutes a raid?')
						.setRequired(false))
				.addNumberOption(option => 
					option.setName('userlimit')
						.setDescription('How many unique users must be doing the mention spam for it to constitute a raid?')
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('current')
				.setDescription('Posts the current configuration settings')),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();
			if(subCommand == 'current'){
				var message = "The standard mention spam protection is ";
				MentionSpamSettings.findOne({where: {category: 'standard'}}).then(entry => {
					if(entry){
						const onoffVal = entry.onoff;
						const uniquesVal = entry.uniques;
						const deletionVal = entry.delete;
						const alertVal = entry.alert;
						const timeoutVal = entry.timeout;

						var onoff = "on";
						if(onoffVal == 0){
							onoff = "off";
						}
						message = message + onoff + ".";
						message = message + " " + uniquesVal + " unique mentions in a single message constitues mention spam.";

						var deletion = "";
						if(deletionVal == 0){
							deletion = " not";
						}
						message = message + " If mention spam is detected in a message, the message will" + deletion + " be deleted.";

						var alert = "";
						if(alertVal == 0){
							alert = " not";
						}
						message = message + " Additionally, an alert will" + alert + " be sent to the mods in the designated log channel.";

						message = message + " Lastly, the user who posted the mention spam will";
						var timeout = " not";
						var timeoutWord;
						if(timeoutVal != 0){
							timeout = "";
							if(timeoutVal == minute){
								timeoutWord = "minute";
							}
							else if(timeoutVal == hour){
								timeoutWord = "hour";
							}
							else if(timeoutVal == day){
								timeoutWord = "day";
							}

							message = message + " be timed out for a(n) " + timeoutWord; 
						}
						else{
							message = message + timeout + " be timed out";
						}
						message = message + '. Note that admins cannot be timed out.';
					}
					else{
						message = "Standard settings have not been set. run the 'standard' subcommand of this command to configure them.";
					}

					message = message + "\n----------------------------\n";

					MentionSpamSettings.findOne({where: {category: 'raid'}}).then(entry => {
						if(entry){
							const onoffVal = entry.onoff;
							const uniquesVal = entry.uniques;
							const deletionVal = entry.delete;
							const alertVal = entry.alert;
							const timeoutVal = entry.timeout;
							const timeframeVal = entry.timeframe;
							const msglimitVal = entry.msglimit;
							const userlimitVal = entry.userlimit;

							var onoff = "on";
							if(onoffVal == 0){
								onoff = "off";
							}
							var timeframe;
							if(timeframeVal ){ timeframe = timeframeVal / 1000; }
							message = message + "The raid mention spam protection is " + onoff + ".";
							message = message + " " + uniquesVal + " unique mentions in a single message constitues mention spam.";
							message = message + " If mention spam is detected from at least " + userlimitVal + " users, across " + msglimitVal + " messages, in the span of " + timeframe + " seconds, it will constitute a mention spam raid.";

							var deletion = "";
							if(deletionVal == 0){
								deletion = " not";
							}
							message = message + " If a mention spam raid is detected in (a) message(s), the message(s) will" + deletion + " be deleted.";

							var alert = "";
							if(alertVal == 0){
								alert = " not";
							}
							message = message + " Additionally, an alert will" + alert + " be sent to the mods in the designated log channel.";

							message = message + " Furthermore, the user(s) who posted the mention spam will";
							var timeout = " not";
							var timeoutWord;
							if(timeoutVal != 0){
								timeout = "";
								if(timeoutVal == minute){
									timeoutWord = "minute";
								}
								else if(timeoutVal == hour){
									timeoutWord = "hour";
								}
								else if(timeoutVal == day){
									timeoutWord = "day";
								}

								message = message + " be timed out for a " + timeoutWord; 
							}
							else{
								message = message + timeout + " be timed out";
							}
							message = message + '. Note that admins cannot be timed out.';
						}
						else{
							message = message + "\nRaid settings have not been set. run the 'raid' subcommand of this command to configure them.";
						}

						return interaction.reply({content: message, ephemeral: false});
					})
				})
			}
			else{
				var replyMsg = "The following was updated: {";

				const onoff = interaction.options.getBoolean('onoff');
				const uniques = interaction.options.getNumber('uniques');
				const deletion = interaction.options.getBoolean('delete');
				const alert = interaction.options.getBoolean('alert');
				const timeout = interaction.options.getString('timeout');

				var onoffVal = 0;
				var deletionVal = 0;
				var alertVal = 0;
				if(onoff){ onoffVal = 1; }
				if(deletion == true){ deletionVal = 1; }
				if(alert == true){ alertVal = 1; }

				let uniquesVal = 3;
				if(uniques && uniques < 3) { 
					uniquesVal = 3; 
				}
				else if(uniques >= 3){
					uniquesVal = uniques;
				}

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

				var timeframe = null;
				var msglimit = null;
				var userlimit = null;
				if(subCommand == 'raid'){
					timeframe = interaction.options.getNumber('timeframe');
					msglimit = interaction.options.getNumber('msglimit');
					userlimit = interaction.options.getNumber('userlimit');				
				}

				MentionSpamSettings.findOne({where: {category: subCommand}}).then(entry => {
					if(entry){
						if(entry.onoff != onoffVal){
							replyMsg = replyMsg + "onoff ";
							MentionSpamSettings.update({onoff: onoffVal}, {where: {category: subCommand}});
						}
						if(uniques){
							replyMsg = replyMsg + "uniques ";
							MentionSpamSettings.update({uniques: uniquesVal}, {where: {category: subCommand}});
						}
						if(deletion != null){
							replyMsg = replyMsg + "deletion ";
							MentionSpamSettings.update({delete: deletionVal}, {where: {category: subCommand}});
						}
						if(alert != null){
							replyMsg = replyMsg + "alert ";
							MentionSpamSettings.update({alert: alertVal}, {where: {category: subCommand}});
						}
						if(timeout){
							replyMsg = replyMsg + "timeout ";
							MentionSpamSettings.update({timeout: timeoutVal}, {where: {category: subCommand}});
						}
						MentionSpamSettings.sync();	//where all does this need to go??
					}
					else{
						replyMsg = replyMsg + "onoff uniques deletion alert timeout ";
						MentionSpamSettings.create({
							category: subCommand,
							onoff: onoffVal,
							uniques: uniquesVal,
							delete: deletionVal,
							alert: alertVal,
							timeout: timeoutVal,
						})
						MentionSpamSettings.sync();
					}

					if(subCommand == 'raid'){
						if(timeframe){
							replyMsg = replyMsg + "timeframe ";
							MentionSpamSettings.update({timeframe: timeframe}, {where: {category: subCommand}});
						}
						if(msglimit){
							replyMsg = replyMsg + "message_limit ";
							if(msglimit < 1){ msglimit = 1; }
							MentionSpamSettings.update({msglimit: msglimit}, {where: {category: subCommand}});
						}
						if(userlimit){
							replyMsg = replyMsg + "user_limit ";
							if(userlimit < 1){ userlimit = 1; }
							MentionSpamSettings.update({userlimit: userlimit}, {where: {category: subCommand}});
						}
						MentionSpamSettings.sync();	//where all does this need to go??
					}
					replyMsg = replyMsg.trim() + "} for the " + subCommand + " mention spam protection settings.";

					return interaction.reply({content: replyMsg, ephemeral: false});
				})
			}
		},
};