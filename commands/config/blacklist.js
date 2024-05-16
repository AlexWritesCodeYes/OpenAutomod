const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Blacklist = sequelize.define('blacklist', {
	channelID: {
		type: Sequelize.STRING,
		unique: true,
	},
	category: Sequelize.TEXT,
});

const LinkBlacklist = sequelize.define('linkblacklist', {
	host: {
		type: Sequelize.TEXT,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
});

const NameBlock = sequelize.define('nameblock', {
	entry: {
		type: Sequelize.TEXT,
		unique: true,
	},
	blackwhite: Sequelize.TINYINT,
	regex: Sequelize.TINYINT,
});

function specialCharHandler(entry, currIndex){
	var result = entry;
	for(let i = currIndex; i < entry.length; i++){
		if(i == 0){
			if(entry[i] === "*" || entry[i] === "_"){
				result = "\\" + entry;
			}
		}
		else{
			if((entry[i] === "*" || entry[i] === "_") && entry[i-1] != "\\"){ 
				result = result.slice(0, i) + "\\" + result.slice(i);
				specialCharHandler(result, i);
			}
		}
	}

	return result;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription('Posts the contents of a blacklist')
		.addSubcommand(subcommand => 
			subcommand
				.setName('channel')
				.setDescription('Posts the channel blacklist'))
		.addSubcommand(subcommand => 
			subcommand
				.setName('link')
				.setDescription('Posts the blacklist for links'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('names')
				.setDescription('Posts the blacklist and whitelist for the name blocker')),
		execute(interaction){
			const subCommand = interaction.options.getSubcommand();
			if(subCommand == 'channel'){
				Blacklist.findAll().then(channelIDs => {
					let list = [];

					channelIDs.forEach(entry => {
						list.push(entry);
					})

					let message = list.length + " channels on the exclusion list \n";
					list.forEach(entry => {
						let channel = interaction.guild.channels.cache.find(channel => channel.id === entry.channelID);
						message = message + "channel name: " + channel.name + " | id: " + entry.channelID + " | category: " + entry.category.replace(' ', ', ') + "\n";
					})

					return interaction.reply({content: message, ephemeral: false});
				})
			}
			else if(subCommand == 'link'){
				LinkBlacklist.findAll().then(hosts => {
					let list = [];

					hosts.forEach(host => {
						list.push(host);
					})

					let message = list.length + " hosts on the blacklist \n";
					list.forEach(entry => {
						let onoff = entry.onoff;
						let host = entry.host;
						
						message = message + " links with " + host + " are ";
						if(onoff == 0){
							message = message + "not ";
						}
						message = message + "blocked\n";
					})

					return interaction.reply({content: message, ephemeral: false});
				})
			}
			else if(subCommand == 'names'){
				NameBlock.findAll().then(entries => {
					let whitelist = [];
					let blacklist = [];
					let messages = [];	//TODO: Implement this system for the other two subcommands

					entries.forEach(entry => {
						if(entry.blackwhite == 1){
							blacklist.push(entry);
						}
						else{
							whitelist.push(entry);
						}
					})

					let message = blacklist.length + " entries in the blacklist and " + whitelist.length + " entries in the whitelist.\n";
					messages.push(message);
					message = "blacklist: \n----------\n";
					blacklist.forEach(entry => {
						let entryEntry = specialCharHandler(entry.entry, 0);
						let messageAddition = "entry: ||" + entryEntry + "|| | regex: " + (entry.regex == 1) + "\n-----\n";
						if((message.length + messageAddition.length) >= 2000){
							messages.push(message);
							message = "";
						}
						message = message + messageAddition;
					})
					messages.push(message);
					message = "whitelist: \n----------\n";
					whitelist.forEach(entry => {
						let entryEntry = specialCharHandler(entry.entry, 0);
						let messageAddition = "entry: ||" + entryEntry + "|| | regex: " + (entry.regex == 1) + "\n-----\n";
						if((message.length + messageAddition.length) >= 2000){
							messages.push(message);
							message = "";
						}
						message = message + messageAddition;
					})
					messages.push(message);

					let totalMessage = "";
					messages.forEach(msg => {
						totalMessage = totalMessage + msg;
					})
					if(totalMessage.length <= 2000){
						return interaction.reply({content: totalMessage, ephemeral: false});
					}
					else{
						let channelCalledIn = interaction.channel;
						messages.forEach(msg => {
							channelCalledIn.send(msg);
						})
					}
				})
			}
		},
};
