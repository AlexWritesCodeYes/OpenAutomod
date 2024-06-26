const { ChannelType, SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Channels = sequelize.define('channels', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
	channelID: Sequelize.TEXT,
});

function formatDate(dateString){
	dateString = dateString + "";
	return dateString.split('G')[0];
}

async function grabMany(channel, options, msgList){
	let lastID = options.before;
	let breakCondition = false;
	do{
		if(typeof lastID != `undefined`){
			options = { limit: 100, before: lastID};
			channel.messages.fetch(options).then(messages => {
				console.log(`grabbed ${messages.size} messages before ${options.before}`);
			})
		}
		else{
			console.log("lastID is undefined");
		}

		const channelMessages = await channel.messages.fetch(options);

		let myMessageList = [];

		if(channelMessages.size == 100){
			lastID = channelMessages.last().id;
			options = { limit: 100, before: lastID};
		}
		else{
			console.log(`only ${channelMessages.size} to go!`);
			breakCondition = true;
		}

		channelMessages.forEach(message => {
			let messageString = formatDate(message.createdAt) + " " + message.author.tag + " " + message.content;
			if(message.attachments.size != 0){
				message.attachments.forEach(attachment => {
					messageString = messageString + " [file: " + attachment.url + " ]";
				})
			}
			messageString = messageString + "\n----------\n";
			//console.log(messageString);
			myMessageList.push(messageString);
		})

		console.log(`grabbed ${myMessageList.length} messages this time`);
		if(breakCondition){
			return myMessageList;
		}
		else{
			const newMessages = await grabMany(channel, options, myMessageList);
			
			newMessages.forEach(msg => {
				myMessageList.push(msg);
			});

			console.log(`total length: ${myMessageList.length}`);
			if(newMessages.length < 100){
				console.log(`returning ${myMessageList.length} messages`);

				return myMessageList;
			}
		}
	} while(true);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('archive')
		.setDescription('logs all messages in a welcome channel')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The welcome channel to archive')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText)),
	execute(interaction){
		const channel = interaction.options.getChannel('channel');
		const channelName = channel.name;
		if(channelName.slice(0, 7) != "welcome"){
			return interaction.reply({ content: `${channelName} is not a welcome channel. Please do not do that.`,
			 ephemeral: false });
		}
		else{
			Channels.findOne({where: {name: "log"} }).then(logchannel => {
				let logChannelID = logchannel.channelID;
				console.log("log channel " + logChannelID);
				const logChannel = channel.client.channels.cache.get(logChannelID);
				
				let msgList = [];
				msgList = grabMany(channel, {limit: 100}, msgList);

				//console.log(`msgList: ${msgList}`);

				msgList.then(messageList => {
					console.log(channel.name);
					console.log(`${messageList.length} messages in ${channel.name}.`);
					
					var logMessage = `${messageList.length} messages in ${channel.name}. \n`;

					messageList.reverse().forEach(message => {
						let length = logMessage.length + message.length;
						if(length >= 2000){
							logChannel.send(logMessage);
							logMessage = "";
						}
						logMessage = logMessage + message;
					})
					logChannel.send(logMessage);

					let tooMany = 100;
					if(messageList.length > tooMany){
						logChannel.send(`${messageList.length} is a lot of messages! In the future, please try to keep conversation in the welcome channels to fewer than ${tooMany} messages`);
					}
				});

				return interaction.reply({ content: `Success! ${channelName} was archived in the designated log channel.`, ephemeral: false });
			})
		}
	},
};
