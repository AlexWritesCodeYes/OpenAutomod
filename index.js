const {Client, Collection, Events, EmbedBuilder, ChannelType, Partials, PermissionsBitField, GatewayIntentBits} = require("discord.js");
const {token} = require('./config.json');
const Sequelize = require('sequelize');
const fs = require('node:fs');
const path = require('node:path');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

class PhrasePair{
	constructor(phrase, regex){
		this.phrase = phrase;
		this.regex = regex;
	}
}

//more robust version of the word-response pair thing
const Phrases = sequelize.define('phrases', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	phrase: {
		type: Sequelize.STRING,
		unique: true,
	},
	response: Sequelize.TEXT,
	delete: Sequelize.TINYINT,
	timeout: Sequelize.INTEGER,
	regex: Sequelize.INTEGER,
});

//currently only keeps track of the log channel
const Channels = sequelize.define('channels', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
	channelID: Sequelize.TEXT,
});

//the list of channels to be ignored by the word-response system
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
	timeframe: Sequelize.INTEGER,	//the last three are for
	msglimit: Sequelize.SMALLINT,		//raid settings
	userlimit: Sequelize.MEDIUMINT,	//i think
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

const NameBlock = sequelize.define('nameblock', {
	entry: {
		type: Sequelize.TEXT,
		unique: true,
	},
	blackwhite: Sequelize.TINYINT,
	regex: Sequelize.TINYINT,
});

const NameBlockSettings = sequelize.define('nameblocksettings', {
	category: {
		type: Sequelize.TEXT,
		unique: true,
	},
	alert: Sequelize.TINYINT,
	timeout: Sequelize.INTEGER,
});

const AllowList = sequelize.define('allowlist', {
	entry: {
		type: Sequelize.TEXT,
		unique: true,
	},
	roleuser: Sequelize.TINYINT,
	name: Sequelize.TEXT,
});

const Template = sequelize.define('template', {
	url: {
		type: Sequelize.STRING,
		unique: true,
	},
	name: Sequelize.STRING,
});

const MessageDatabase = sequelize.define('messages', {
	category: {
		type: Sequelize.STRING,
		unique: true,
	},
	messageID: Sequelize.STRING,
	channelID: Sequelize.STRING,
});

const Welcome = sequelize.define('welcome', {
	category: {
		type: Sequelize.STRING,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
});

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

helpEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("Main Help Menu")
	.setDescription("Click on the reactions corresponding to the following categories to access their submenus")
	.addFields(
		{ name: "__⚙️: Config__", value: "The commands for configuring various automation settings", inline: false},
		{ name: "__👋: Welcome__", value: "The commands for handling the welcome channels", inline: false},
		{name: "__↔️: Responses__", value: "The commands for handling the phrase-response system", inline: false},
		{name: "__💢: Spam__", value: "The commands for configuring the automated spam protection settings", inline: false},
		{name: "__📜: Names__", value: "The commands for configuring the automated name blocker settings", inline: false},
	)
	.setFooter({text: 'Navigate by clicking the reactions below'});

configEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("Config Help Menu")
	.setDescription("Configuration commands for various automated features. Mainly managing channel exclusion lists, the server template, and the log channel")
	.addFields(
		{name: "/logchannel", value: "changes the channel to which this bot logs events", inline: false},
		{name: "/exclude", value: "adds a channel to one or several of the feature exlusion lists. If a channel is on, for example, the mention exlusion list, then the mention spam protection feature will not work in that channel, even if that feature is turned on for the server.", inline: false},
		{name: "/include", value: "the opposite of /exclude. This command removes a given channel from all exclusion lists it's on. The bot features will now work normally in the given channel.", inline: false},
		{name: "/update", value: "updates exclusion list(s) of the given channel. This command can be used to move a channel onto or off of one or several feature exlusion lists.", inline: false},
		{name: "/template", value: "gets, sets, or syncs the current server template", inline: false},
		{name: "/blacklist", value: "lists the contents of the selected blacklist. These blacklists include the channel exclusion lists, the name blocker list, and the link blocker list used by the suspected spam protection feature", inline: false},
		{name: "/masterlist", value: "posts a list of all commands and the category under which they can be found in the help menu"}
	)
	.setFooter({text: 'Return to the main menu by clicking the ◀️ below'});

welcomeEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("Welcome Channel Help Menu")
	.setDescription("When a new person joins the server, a secret welcome channel that only they (and the mods) can see. The following commands manage those channels.")
	.addFields(
		{name: "/archive", value: "logs all messages in a given welcome channel to the log channel for this bot. **Run this command __before__ the /delete command.**", inline: false},
		{name: "/delete", value: "deletes a welcome channel. this command, for safety reasons, only works on welcome channels.", inline: false},
		{name: "/welcome", value: "enables or disables the creation of welcome channels upon a user joining, or gets the current configuration for this setting.", inline: false},
	)
	.setFooter({text: 'Return to the main menu by clicking the ◀️ below'});

responseEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("Phrase-Response System Help Menu")
	.setDescription("The following commands are for managing the phrase-response system. This system, upon detecting a word or phrase stored within the system, will direct the bot to respond with a customizeable response (which may or may not include an action like, for example, a timeout) associated with that specific word or phrase.")
	.addFields(
		{name: "/addphrase", value: "adds a word or phrase to the responder system", inline: false},
		{name: "/modphrase", value: "modifies the response for a word or phrase in the database. This can be done in one of two ways: by entering the id of the entry in the database, or by entering the exact phrase as it exists in the database", inline: false},
		{name: "/delphrase", value: "removes a phrase from the list, based on either its database id or the phrase itself. This can be done in one of two ways: by entering the id of the entry in the database, or by entering the exact phrase as it exists in the database", inline: false},
		{name: "/fullresponse", value: "returns the detailed response for a given phrase. This can be done in one of two ways: by entering the id of the entry in the database, or by entering the exact phrase as it exists in the database", inline: false},
		{name: "/listphrases", value: "lists all the phrases along with their detailed responses", inline: false},
	)
	.setFooter({text: 'Return to the main menu by clicking the ◀️ below'});

spamEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("Spam Protection Help Menu")
	.setDescription("Configuration commands for the two types of spam protection features (mention spam and suspected spam)")
	.addFields(
		{name: "/mentionconfig", value: "configures the settings for the automated mention spam protection feature for every day use and for raid protection. This command is a bit complicated, so if you would like more detail, click the 💬 at the bottom of this embed", inline: false},
		{name: "/suspectedconfig", value: "configures the settings for the automated suspected spam protection feature for every day use and for suspicious links. This command is a bit complicated, so if you would like more detail, click the 🔍 at the bottom of this embed", inline: false},
		{name: "/managehost", value: "adds or removes a host from the list of suspicious links, or turns protection from a given host on or off. This is a helper command for the suspected spam protection feature. It can be used to, for example, stop people from posting discord phishing links by adding discord.com to the block list.", inline: false},
	)
	.setFooter({text: 'Return to the main menu by clicking the ◀️ below. Alternatively, learn more about the /mentionconfig command by clicking the 💬, or the /suspectedconfig command by clicking the 🔍'});

mentionEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("More on /mentionconfig")
	.setDescription("Mention spam is defined by one (or several, in the case of a raid) user (or users) pinging too many people in a single message. The /mentionconfig command configures the settings for protection against this mention spam. Settings include (but are not limited to) how many unique mentions in a message constitutes mentioon spam, and how the bot should respond to the detection of mention spam.")
	.addFields(
		{name: "standard settings", value: "configure the protection settings for a single user doing mention spam", inline: false},
		{name: "raid settings", value: "configure the protection settings for several users doing mention spam at once, and what constitutes a mention spam raid", inline: false},
		{name: "current settings", value: "post the currently configured mention spam protection settings in plain English.", inline: false},
	)
	.setFooter({text: 'Return to the main menu by clicking the ◀️ below, or back to the spam protection help menu by clicking the 💢'});

susEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("More on /suspectedconfig")
	.setDescription("Suspected spam is generally defined as a user posting the same message repeatedly in one or several channels, or posting a link from a suspicious host. The /suspectedconfig command configures the settings for protection against this type of spam. Settings include (but are not limited to) how many times the same message must be posted, and in how many channels, before the bot flags it as spam and responds based on how the protection is configured")
	.addFields(
		{name: "standard settings", value: "configure the protection settings against one person doing the spam, and what must be done by one person for it to be flagged as spam", inline: false},
		{name: "link settings", value: "configure the protection settings against suspicious links", inline: false},
		{name: "current settings", value: "post the currently configured suspected spam protection settings in plain English.", inline: false},
	)
	.setFooter({text: 'Return to the main menu by clicking the ◀️ below, or back to the spam protection help menu by clicking the 💢'});

namesEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("Name Blocker Help Menu")
	.setDescription("These commands configure the settings for the name blocker feature. This feature will, upon detecting someone joining with or changing their name to something containing a word or regex in the name blocker blacklist (but not in the whitelist), block that person from interacting with the server, unless that person (or a role they possess) is on the bypass list for this feature. **People with admin permissions are on the whitelist by default since it's not possible to time out someone with that level of permissions.**")
	.addFields(
		{name: "/managenameslist", value: "add or delete a name or regex string to the name blocker blacklist or whitelist, move an entry to or from the blacklist or whitelist, or configure how the bot will respond to a bad name being detected", inline: false},
		{name: "/namesbypass", value: "add or remove a user or role to or from the bypass list for the name blocker feature, or list the contents of the bypass list for the name blocker"}
	)
	.setFooter({text: 'Return to the main menu by clicking the ◀️ below'});

commandsEmbed = new EmbedBuilder()
	.setColor("#7F8C8D")
	.setTitle("Command List")
	.setDescription("This is the complete list of all commands and the category they can be found under in the help menu")
	.addFields(
		{name: "/addphrase", value: "↔️ Responses", inline: true},
		{name: "/archive", value: "👋 Welcome", inline: true},
		{name: "/blacklist", value: "⚙️ Config", inline: true},
		{name: "/delete", value: "👋 Welcome", inline: true},
		{name: "/delphrase", value: "↔️ Responses", inline: true},
		{name: "/exclude", value: "⚙️ Config", inline: true},
		{name: "/fullresponse", value: "↔️ Responses", inline: true},
		{name: "/help", value: "⚙️ Config", inline: true},
		{name: "/include", value: "⚙️ Config", inline: true},
		{name: "/listphrases", value: "↔️ Responses", inline: true},
		{name: "/logchannel", value: "⚙️ Config", inline: true},
		{name: "/managehost", value: "💢 Spam", inline: true},
		{name: "/managenameslist", value: "📜 Names", inline: true},
		{name: "/mentionconfig", value: "💢 Spam", inline: true},
		{name: "/modphrase", value: "↔️ Responses", inline: true},
		{name: "/namesbypass", value: "📜 Names", inline: true},
		{name: "/suspectedconfig", value: "💢 Spam", inline: true},
		{name: "/template", value: "⚙️ Config", inline: true},
		{name: "/update", value: "⚙️ Config"}
	)
	.setFooter({text: 'Run the help command to find out more about these commands'});

let badPhrases = new Set();
let badHosts = new Set();
let phrasesBlackList = new Set();
let mentionBlackList = new Set();
let spamBlacklist = new Set();
let namesBlackList = new Set();
let namesWhiteList = new Set();
let namesAllowListRoles = new Set();
let namesAllowListMembers = new Set();

var stdMentionSpamOnOff;
var raidMentionSpamOnOff;
var stdSusSpamOnOff;
var linkSusSpamOnOff;
var mentionMessages = [];
var susMessages = [];
var prevMsg;

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const cmdUser = interaction.member;
	if(!cmdUser.permissions.has(PermissionsBitField.Flags.Administrator)){
		return interaction.reply({content: "You shouldn't be able to use this bot. Please ping an admin to fix this.", ephemeral: false});
	}

	console.log(interaction);
	Channels.findOne({where: {name: "log"} }).then(logchannel => {
		let logChannelID = logchannel.channelID;
		client.channels.cache.get(logChannelID).send("Received an interaction: " + interaction.commandName);
	})

	const command = client.commands.get(interaction.commandName);
	const cmdName = interaction.commandName;

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	if(cmdName == 'welcome'){
		console.log("Syncing welcome settings db");
		Welcome.sync();
	}

	if(cmdName == "addphrase" || cmdName == "modphrase" || cmdName == "delphrase"){
		console.log("Syncing phrases db");
		Phrases.sync();

		console.log("updating local phrases list");
		badPhrases = new Set();
		Phrases.findAll().then(phrases => {
			console.log(`${phrases.length} phrases in the db`);
			phrases.forEach(entry => {
				var newPair = new PhrasePair(entry.phrase, entry.regex);
				badPhrases.add(newPair);
			})
		})
	}

	if(cmdName == "exclude" || cmdName == "include" || cmdName == "update"){
		console.log("Syncing blacklist tables");
		Blacklist.sync();

		console.log("updating local blacklists");
		phrasesBlackList = new Set();
		mentionBlackList = new Set();
		spamBlackList = new Set();
		Blacklist.findAll().then(entries => {
			entries.forEach(entry => {
				let categories = entry.category.split(' ');
				if(categories.includes('phrases')){
					phrasesBlackList.add(entry.channelID);
				}
				if(categories.includes('mention')){
					mentionBlackList.add(entry.channelID);
				}
				if(categories.includes('spam')){
					spamBlacklist.add(entry.channelID);
				}
			})
		})
	}

	if(cmdName == 'mentionconfig'){
		console.log("Syncing mention spam settings db");
		MentionSpamSettings.sync();

		const stdSettings = MentionSpamSettings.findOne({where: {category: 'standard'}});
		const raidSettings = MentionSpamSettings.findOne({where: {category: 'raid'}});

		stdSettings.then(settings => {
			if(settings.onoff == null || settings.onoff == 0){
				stdMentionSpamOnOff = false;
			}
			else{
				stdMentionSpamOnOff = true;
			}
		});

		raidSettings.then(settings => {
			if(settings.onoff == null || settings.onoff == 0){
				raidMentionSpamOnOff = false;
			}
			else{
				raidMentionSpamOnOff = true;
			}
		})
	}

	if(cmdName == 'suspectedconfig'){
		console.log('Syncing suspected spam settings db');
		SuspectedSpamSettings.sync();

		const stdSettings = SuspectedSpamSettings.findOne({where: {category: 'standard'}});
		const linkSettings = SuspectedSpamSettings.findOne({where: {category: 'link'}});

		stdSettings.then(settings => {
			if(settings.onoff == null || settings.onoff == 0){
				stdSusSpamOnOff = false;
			}
			else{
				stdSusSpamOnOff = true;
			}
		});

		linkSettings.then(settings => {
			if(settings.onoff == null || settings.onoff == 0){
				linkSusSpamOnOff = false;
			}
			else{
				linkSusSpamOnOff = true;
			}
		})
	}

	if(cmdName == 'managehost'){
		console.log('Syncing host spam protection db');
		LinkBlacklist.sync();

		badHosts = new Set();
		LinkBlacklist.findAll().then(entries => {
			entries.forEach(entry => {
				if(entry.onoff == 1){
					badHosts.add(entry.host);
				}
			})
		})
	}

	if(cmdName == 'managenameslist'){
		console.log('Syncing name block databases');
		NameBlock.sync();
		NameBlockSettings.sync();

		namesBlackList = new Set();
		namesWhiteList = new Set();
		NameBlock.findAll().then(entries => {
			entries.forEach(entry => {
				if(entry.blackwhite == 1){
					namesBlackList.add(entry); //have to add as an entry due to regex check
				}
				else{
					namesWhiteList.add(entry);
				}
			})
		})
	}
	if(cmdName == 'namesbypass'){
		console.log('Synching name block bypass db');
		AllowList.sync();

		namesAllowListRoles = new Set();
		namesAllowListMembers = new Set();
		AllowList.findAll().then(entries => {
			entries.forEach(entry => {
				if(entry.roleuser == 1){
					namesAllowListRoles.add(entry.entry); //id
				}
				else{
					namesAllowListMembers.add(entry.entry);
				}
			})
		})
	}

	if(cmdName == 'template'){
		console.log('Synching template db');
		Template.sync();
	}

	if(cmdName == "help"){
		console.log('Synching messages db');
		MessageDatabase.sync();
		let theChannel = interaction.channel;
		let embedMsg = theChannel.send({embeds: [helpEmbed]}).then(embedMessage => {
			const configReact = embedMessage.react("⚙️");
			const welcomeReact = embedMessage.react("👋");
			const responseReact = embedMessage.react("↔️");
			const spamReact = embedMessage.react("💢");
			const namesReact = embedMessage.react("📜");

			//store the message id in a database or something i dunno
			const helpMsgEntry = MessageDatabase.findOne({where: {category: 'help'}}).then(entry => {
				if(entry){
					//delete the old message and update the db entry with the id of the new one
					console.log("deleting old help menu message");
					const helpMessageChannel = interaction.guild.channels.fetch(entry.channelID);
					helpMessageChannel.then(channel => {
						//TODO: error check this
						let msg = channel.messages.fetch(entry.messageID);
						msg.then(msgToDelete => {
							msgToDelete.delete();
						})
					})

					console.log("updating the help message ID in the database");
					const affectedRows = MessageDatabase.update({messageID: embedMessage.id.toString(), channelID: theChannel.id.toString()}, {where: {category: 'help'}});
					MessageDatabase.sync();

					affectedRows.then(rows => {
						if(rows[0] > 0){
							console.log("succesfully updated the help message ID in the database");
						}
						else{
							Channels.findOne({where: {name: "log"} }).then(logchannel => {
								let logChannelID = logchannel.channelID;
								client.channels.cache.get(logChannelID).send("Failed to update the help message ID in the database. The old help menu will remain, and the buttons will be non-functional");
							})
						}
					})
				}
				else{
					//there is no help message id in the database. try to create an entry
					console.log("trying to store " + embedMessage.id);
					try{
						MessageDatabase.create({
							category: 'help',
							messageID: embedMessage.id.toString(),
							channelID: theChannel.id.toString(),
						});
						MessageDatabase.sync();
					}
					catch(error){
						Channels.findOne({where: {name: "log"} }).then(logchannel => {
							let logChannelID = logchannel.channelID;
							client.channels.cache.get(logChannelID).send(`Failed to create the help message ID in the database. Here's the error: ${error}`);
						})
					}
				}
			})
		})
		const test = MessageDatabase.findOne({where: {category: 'help'}});
		test.then(testtest => {
			console.log("stored " + testtest.messageID);
		})
	}

	if(cmdName == "masterlist"){
		console.log('Synching messages db');
		MessageDatabase.sync();
		let theChannel = interaction.channel;
		let embedMsg = theChannel.send({embeds: [commandsEmbed]}).then(embedMessage => {
			const commandMsgEntry = MessageDatabase.findOne({where: {category: 'commands'}}).then(entry => {
				if(entry){
					//delete the old message and update the db entry with the id of the new one
					console.log("deleting old command list message");
					const commandMessageChannel = interaction.guild.channels.fetch(entry.channelID);
					commandMessageChannel.then(channel => {
						//TODO: error check this
						let msg = channel.messages.fetch(entry.messageID);
						msg.then(msgToDelete => {
							msgToDelete.delete();
						})
					})

					console.log("updating the command message ID in the database");
					const affectedRows = MessageDatabase.update({messageID: embedMessage.id.toString(), channelID: theChannel.id.toString()}, {where: {category: 'commands'}});
					MessageDatabase.sync();

					affectedRows.then(rows => {
						if(rows[0] > 0){
							console.log("succesfully updated the command message ID in the database");
						}
						else{
							Channels.findOne({where: {name: "log"} }).then(logchannel => {
								let logChannelID = logchannel.channelID;
								client.channels.cache.get(logChannelID).send("Failed to update the command message ID in the database. The old command menu will remain, and the buttons will be non-functional");
							})
						}
					})
				}
				else{
					//there is no help message id in the database. try to create an entry
					console.log("trying to store " + embedMessage.id);
					try{
						MessageDatabase.create({
							category: 'commands',
							messageID: embedMessage.id.toString(),
							channelID: theChannel.id.toString(),
						});
						MessageDatabase.sync();
					}
					catch(error){
						Channels.findOne({where: {name: "log"} }).then(logchannel => {
							let logChannelID = logchannel.channelID;
							client.channels.cache.get(logChannelID).send(`Failed to create the command message ID in the database. Here's the error: ${error}`);
						})
					}
				}
			})
		})
		const test = MessageDatabase.findOne({where: {category: 'commands'}});
		test.then(testtest => {
			console.log("stored " + testtest.messageID);
		})
	}

	try {
		command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			interaction.followUp({ content: `There was an error! Here it is: ${error}`, ephemeral: true });
		} else {
			interaction.reply({ content: `There was an error! Here it is: ${error}`, ephemeral: true });
		}
	}
})

async function mainEmbedHelper(message){
	message.edit({embeds: [helpEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => {
			msg.react("⚙️");
			msg.react("👋");
			msg.react("↔️");
			msg.react("💢");
			msg.react("📜");
		});
	});
	return;
}

async function configEmbedHelper(message){
	message.edit({embeds: [configEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => msg.react("◀️"));
	});
	return;
}

async function welcomeEmbedHelper(message){
	message.edit({embeds: [welcomeEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => msg.react("◀️"));
	});
	return;
}

async function phrasesEmbedHelper(message){
	message.edit({embeds: [responseEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => msg.react("◀️"));
	});
	return;
}

async function spamEmbedHelper(message){
	message.edit({embeds: [spamEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => {
			msg.react("◀️");
			msg.react("💬");
			msg.react("🔍");
		});
	});
	return;
}

async function namesEmbedHelper(message){
	message.edit({embeds: [namesEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => msg.react("◀️"));
	});
	return;
}

async function mentionEmbedHelper(message){
	message.edit({embeds: [mentionEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => {
			msg.react("◀️");
			msg.react("💢");
		});
	});
	return;
}

async function susEmbedHelper(message){
	message.edit({embeds: [susEmbed]}).then(msg => {
		msg.reactions.removeAll().then(() => {
			msg.react("◀️");
			msg.react("💢");
		});
	});
	return;
}

async function messageReactionEmbedHelper(message){
	let helpEmbed = message.embeds[0];
	if(helpEmbed){
		let title = helpEmbed.title;
		console.log("title: " + title);

		let reactions = message.reactions;

		if(title == "Main Help Menu"){
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "⚙️"){
						console.log("changing to the config embed");
						configEmbedHelper(message);
						return;
					}
					else if(react.emoji.name == "👋"){
						console.log("changing to the welcome embed");
						welcomeEmbedHelper(message);			
						return;
					}
					else if(react.emoji.name == "↔️"){
						console.log("changing to the phrases embed");
						phrasesEmbedHelper(message);
						return;
					}
					else if(react.emoji.name == "💢"){
						console.log("changing to the spam embed");
						spamEmbedHelper(message);
						return;
					}
					else if(react.emoji.name == "📜"){
						console.log("changing to the names embed");
						namesEmbedHelper(message);
						return;
					}
				}
			})
		}
		else if(title == "Welcome Channel Help Menu"){
			//yes, I'm copy-pasting code in multiple locations. 
			//it's in case i want to easily add menu options to any of these in the future
			//it's called scalability look it up sweaty
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "◀️"){
						console.log("returning to the main menu");
						mainEmbedHelper(message);
						return;
					}
				}
			})
		}
		else if(title == "Config Help Menu"){
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "◀️"){
						console.log("returning to the main menu");
						mainEmbedHelper(message);
						return;
					}
				}
			})
		}
		else if(title == "Phrase-Response System Help Menu"){
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "◀️"){
						console.log("returning to the main menu");
						mainEmbedHelper(message);
						return;
					}
				}
			})
		}
		else if(title == "Spam Protection Help Menu"){
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "◀️"){
						console.log("returning to the main menu");
						mainEmbedHelper(message);
						return;
					}
					else if(react.emoji.name == "💬"){
						console.log("showing more about the /mentionconfig command");
						mentionEmbedHelper(message);
						return;
					}
					else if(react.emoji.name == "🔍"){
						console.log("showing more about the /suspectedconfig command");
						susEmbedHelper(message);
						return;
					}
				}
			})
		}
		else if(title == "More on /mentionconfig"){
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "◀️"){
						console.log("returning to the main menu");
						mainEmbedHelper(message);
						return;
					}
					else if(react.emoji.name == "💢"){
						console.log("returning to the spam protection menu");
						spamEmbedHelper(message);
						return;
					}
				}
			})
		}
		else if(title == "More on /suspectedconfig"){
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "◀️"){
						console.log("returning to the main menu");
						mainEmbedHelper(message);
						return;
					}
					else if(react.emoji.name == "💢"){
						console.log("returning to the spam protection menu");
						spamEmbedHelper(message);
						return;
					}
				}
			})
		}
		else if(title == "Name Blocker Help Menu"){
			reactions.cache.forEach(react => {
				if(react.count == 2){
					if(react.emoji.name == "◀️"){
						console.log("returning to the main menu");
						mainEmbedHelper(message);
						return;
					}
				}
			})
		}
	}
	else{
		console.log("No help message embed is contained within this message");
		return;
	}
}

client.on(Events.MessageReactionAdd, async (message, reaction, user) => {
	if(message.partial){
		message.fetch().then(fullMessage => {
			MessageDatabase.findOne({where: {category: 'help'}}).then(entry => {
				if(entry){
					if(entry.messageID != fullMessage.message.id.toString()){
						console.log("nope");
						return;
					}
				}
				else{
					console.log("I don't know where the help message is!");
				}
			})
			
			messageReactionEmbedHelper(fullMessage.message);
		})
	}
	else{
		if(!message.message.author.bot){ return; }
		MessageDatabase.findOne({where: {category: 'help'}}).then(entry => {
			if(entry){
				if(entry.messageID != message.message.id.toString()){
					console.log("nope");
					return;
				}
			}
			else{
				console.log("I don't know where the help message is!");
			}
		})

		messageReactionEmbedHelper(message.message);
	}
})

//checks if a given phrase exists in a list of words
function phraseFinder(wordList, phrasepair){
	const phrase = phrasepair.phrase;
	let splitphrase = phrase.split(' ');
	const phraseLength = splitphrase.length;
	if(phraseLength > 1){
		let firstIndex = 0;
		let lastIndex = phraseLength - 1;

		let foundit = false;
		while(lastIndex < wordList.length){
			if(phrasepair.regex == 1){
				console.log("regex");
				const regexPhrase = new RegExp(phrase);
				if(regexPhrase.test(wordList[firstIndex])){
					foundit = true;
					console.log("Found the phrase at index " + firstIndex);
					break;
				}
			}
			else{
				console.log(phrasepair.regex);
				if(wordList[firstIndex] == splitphrase[0]){
					let breakCondition = false;
					for(let i = 1; i < phraseLength; i++){
						if(wordList[firstIndex + i] != splitphrase[i]){
							breakCondition = true;
						}
						if(breakCondition){ break; }
					}
					if(!breakCondition){
						console.log("Found the phrase! The first word is at index " + firstIndex);
						foundit = true;
					}
				}
			}
			
			if(foundit){
				return foundit;
			}
			
			firstIndex += 1;
			lastIndex += 1;
		}
		if(!foundit){
			return foundit;
		}
	}
	else{
		if(phrasepair.regex == 1){
			const regexPhrase = new RegExp(phrase);
			var foundit = false;
			wordList.forEach(word => {
				if(regexPhrase.test(word)){
					foundit = true;
				}
			});
			return foundit;
		}
		else{
			return wordList.includes(phrase);
		}
	}
}

client.on(Events.MessageCreate, message => {
	if(!message.author.bot){
		if(![...phrasesBlackList].includes(message.channel.id)){
			let splitup = message.content.toLowerCase().replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
			let splitupSet = new Set();
			splitup.forEach(entry => {
				splitupSet.add(entry);
			});
			let badphrases = [...badPhrases];

			let foundBadPhrases = new Set();
			for(let phrasepair of badphrases){
				if(phraseFinder(splitup, phrasepair)){
					console.log("Found a bad phrase!");

					const respondTo = Phrases.findOne({where: {phrase: phrasepair.phrase} });

					respondTo.then(entry => {
						let logMessage = `A user posted the word, phrase, or regex ||${entry.phrase}|| in ${message.channel}.`;
						let reply = entry.response;

						if(reply != null && reply.length > 0){
							message.reply({content: reply, ephemeral: false});
						}

						const deletion = entry.delete;
						const timeout = entry.timeout;

						if(deletion == 1 && timeout > 0){
							logMessage = logMessage + " The message containing it was deleted and the user who posted it was timed out.";
							message.member.timeout(timeout, 'Posting a bad word or phrase'); //TODO: make the reason customizeable
							message.delete();
						}
						else if(timeout > 0){
							message.member.timeout(timeout, 'Posting a bad word or phrase'); //TODO: make the reason customizeable
							logMessage = logMessage + ' The user who posted the message was timed out.';
						}
						else if(deletion == 1){
							message.delete();
							logMessage = logMessage + ' The message containing it was deleted.';
						}

						Channels.findOne({where: {name: "log"} }).then(logchannel => {
							let logChannelID = logchannel.channelID;
							client.channels.cache.get(logChannelID).send(logMessage);
						})
					})
				}
			}
		}
		if(![...mentionBlackList].includes(message.channel.id)){
			const stdSettings = MentionSpamSettings.findOne({where: {category: 'standard'}});
			const raidSettings = MentionSpamSettings.findOne({where: {category: 'raid'}});
			var mentions;
			if(stdMentionSpamOnOff || raidMentionSpamOnOff){
				let members = message.mentions.users;
				members.tap(membrs => mentions = membrs.size);
			}
			if(stdMentionSpamOnOff){
				console.log(`this message has ${mentions} unique mentions`);
				stdSettings.then(settings => {
					if(mentions >= settings.uniques){
						let logMsg = "Mention spam detected!";

						if(settings.timeout > 0){
							logMsg = logMsg + " The user who did the mention spam was timed out.";
							message.member.timeout(settings.timeout, 'mention spamming'); //TODO: make the reason customizeable
						}
						if(settings.delete == 1){
							logMsg = logMsg + " The message with the mention spam was deleted.";
							message.delete();
						}
						if(settings.alert == 1){
							Channels.findOne({where: {name: "log"} }).then(logchannel => {
								let logChannelID = logchannel.channelID;
								client.channels.cache.get(logChannelID).send(logMsg);
							})
						}
						console.log(logMsg);
					}
				})
			}
			if(raidMentionSpamOnOff){
				raidSettings.then(settings => {
					//make sure the list only has messages within the timeframe
					let trueList = [];
					for(let i = 0; i < mentionMessages.length; i++){
						if(Math.abs(message.createdTimestamp - mentionMessages[i].createdTimestamp) <= settings.timeframe){
							trueList.push(mentionMessages[i]);
						}
					}
					mentionMessages = trueList;

					if(mentions >= settings.uniques){
						console.log(`created at ${message.createdTimestamp}`);
						console.log(`${mentionMessages.length} mentionMessages in the list out of ${settings.msglimit - 1}`);
						if(mentionMessages.length == 0){ mentionMessages.push(message); }
						else{
							if(Math.abs(message.createdTimestamp - mentionMessages[(mentionMessages.length - 1)].createdTimestamp) <= settings.timeframe){
								mentionMessages.push(message);
							}
						}
					}
					if(mentionMessages.length >= settings.msglimit){
						console.log('message limit reached or exceeded');
						let uniquePosters = new Set();
						mentionMessages.forEach(msg => {
							let poster = msg.member;
							uniquePosters.add(poster);
						})
						console.log(`${[...uniquePosters].length} posters out of ${settings.userlimit}`);
						
						if([...uniquePosters].length >= settings.userlimit){
							let logMsg = "Mention spam raid detected!";

							//deal with the raid
							if(settings.timeout > 0){
								uniquePosters.forEach(raider => {	
									raider.timeout(settings.timeout, 'mention spam raiding'); //TODO: make the reason customizeable
								})
								logMsg = logMsg + " The raiders were timed out.";
							}
							if(settings.delete == 1){
								mentionMessages.forEach(msg => {
									console.log(msg.content);
									msg.delete();
								})
								logMsg = logMsg + " The raid mentionMessages were deleted.";
							}
							if(settings.alert == 1){
								Channels.findOne({where: {name: "log"} }).then(logchannel => {
									let logChannelID = logchannel.channelID;
									client.channels.cache.get(logChannelID).send(logMsg);
								})
							}
							console.log(logMsg);
							mentionMessages = [];
						}
					}
					else{
						//get the next oldest one 
						if(mentionMessages.length > 1){
							let newMessageList = [];
							for(let i = 1; i < mentionMessages.length; i++){
								if(Math.abs(message.createdTimestamp - mentionMessages[i].createdTimestamp) <= settings.timeframe){
									newMessageList.push(mentionMessages[i]);
								}
							}
							mentionMessages = newMessageList;
						}
						else{
							mentionMessages = [];
							mentionMessages.push(message);
						}
					}
				})
			}
		}
		if(![...spamBlacklist].includes(message.channel.id)){
			if(stdSusSpamOnOff){
				const stdSettings = SuspectedSpamSettings.findOne({where: {category: 'standard'}});
				stdSettings.then(settings => {
					const messagelimit = settings.messagelimit;
					const channellimit = settings.channellimit;
					const timeframe = settings.timeframe;

					if(prevMsg == null || (Math.abs(message.createdTimestamp - prevMsg.createdTimestamp) > timeframe)){
						prevMsg = message;
						susMessages = [];
						susMessages.push(prevMsg);
					}

					//only deal with the new message if it's the same as the last message and posted by the same user
					if((message.content == prevMsg.content) && (message.author.id == prevMsg.author.id)){
						if(Math.abs(message.createdTimestamp - prevMsg.createdTimestamp) <= timeframe){
							susMessages.push(message);
						}
						else{
							let newList = [];
							susMessages.forEach(msg => {
								if(Math.abs(msg.createdTimestamp - message.createdTimestamp) <= timeframe){
									newList.push(msg);
								}
							})
							susMessages = newList;
						}
						
						const msgCount = susMessages.length;
						var chnlCount = 1;

						let channelIdList = new Set();
						if(channellimit != null && channellimit > 1){ //dont do this if we dont need to
							susMessages.forEach(msg => {
								channelIdList.add(msg.channel.id); //id is a snowflake, not a number. revisit this if it doesn't work
							})
							chnlCount = [...channelIdList].length;
						}

						var suspectedSpamDetected = false;
						if(msgCount > messagelimit){
							if(channellimit != null){
								if(chnlCount >= channellimit){
									suspectedSpamDetected = true;
								}
							}
							else{
								suspectedSpamDetected = true;
							}
						}

						if(suspectedSpamDetected){
							const timeout = settings.timeout;
							const deletion = settings.delete;
							const alert = settings.alert;

							var logMsg = "Suspected spam detected! User " + message.member.displayName + " is the suspect.";

							if(timeout > 0){
								logMsg = logMsg + " They were timed out.";
								message.member.timeout(timeout, "suspected spam");
							}
							if(deletion == 1){
								logMsg = logMsg + " Their messages were deleted.";
								susMessages.forEach(msg => {
									if(msg){
										msg.delete();
									}
								})
							}
							else if(timeout == 0 && deletion == 0){
								logMsg = logMsg + " No action has been taken.";
							}

							if(alert == 1){
								Channels.findOne({where: {name: "log"} }).then(logchannel => {
									let logChannelID = logchannel.channelID;
									client.channels.cache.get(logChannelID).send(logMsg);
								})
							}
							prevMsg = null;
							susMessages = [];
							console.log(logMsg);
						}
					}
					prevMsg = message;
				})
			}
			if(linkSusSpamOnOff){
				const linkSettings = SuspectedSpamSettings.findOne({where: {category: 'link'}});
				const badhosts = [...badHosts];
				const content = message.content;

				linkSettings.then(settings => {
					var isSpam = false;
					badhosts.forEach(host => {
						if(content.includes(host)){ 
							isSpam = true;
						}
					})

					if(isSpam){
						const timeout = settings.timeout;
						const deletion = settings.delete;
						const alert = settings.alert;

						var logMsg = "A suspected spam link was posted in " + message.channel.name + ".";
						
						if(timeout > 0){
							logMsg = logMsg + " The user who posted it was timed out.";
							message.member.timeout(settings.timeout, 'suspected link spam');
						}
						if(deletion == 1){
							logMsg = logMsg + " The message containing the suspected link spam was deleted.";

							message.delete();
						}
						
						if(timeout == 0 && deletion == 0){
							logMsg = logMsg + " No action has been taken.";
						}

						if(alert == 1){
							Channels.findOne({where: {name: "log"} }).then(logchannel => {
								let logChannelID = logchannel.channelID;
								client.channels.cache.get(logChannelID).send(logMsg);
							})
						}

						console.log(logMsg);
					}
				})
			}
		}
	}
})

client.once(Events.ClientReady, c => {
	Phrases.sync();
	Channels.sync();
	Blacklist.sync();
	LinkBlacklist.sync();
	MentionSpamSettings.sync();
	SuspectedSpamSettings.sync();
	NameBlock.sync();
	NameBlockSettings.sync();
	AllowList.sync();
	Template.sync();
	MessageDatabase.sync();
	Welcome.sync();
	
	console.log("updating local lists");
	phrasesBlackList = new Set();
	mentionBlackList = new Set();
	spamBlackList = new Set();
	Blacklist.findAll().then(entries => {
		entries.forEach(entry => {
			let categories = entry.category.split(' ');
			if(categories.includes('phrases')){
				phrasesBlackList.add(entry.channelID);
			}
			if(categories.includes('mention')){
				mentionBlackList.add(entry.channelID);
			}
			if(categories.includes('spam')){
				spamBlacklist.add(entry.channelID);
			}
		})
	})
	badPhrases = new Set();
	Phrases.findAll().then(phrases => {
		phrases.forEach(phrase => {
			badPhrases.add(new PhrasePair(phrase.phrase, phrase.regex));
		})
	})
	mentionMessages = [];

	const stdSettings = MentionSpamSettings.findOne({where: {category: 'standard'}});
	const raidSettings = MentionSpamSettings.findOne({where: {category: 'raid'}});
	stdSettings.then(settings => {
		if(settings.onoff == null || settings.onoff == 0){
			stdMentionSpamOnOff = false;
		}
		else{
			stdMentionSpamOnOff = true;
		}
	})
	raidSettings.then(settings => {
		if(settings.onoff == null || settings.onoff == 0){
			raidMentionSpamOnOff = false;
		}
		else{
			raidMentionSpamOnOff = true;
		}
	})

	const stdSusSettings = SuspectedSpamSettings.findOne({where: {category: 'standard'}});
	const linkSusSettings = SuspectedSpamSettings.findOne({where: {category: 'link'}});
	stdSusSettings.then(settings => {
		if(settings.onoff == null || settings.onoff == 0){
			stdSusSpamOnOff = false;
		}
		else{
			stdSusSpamOnOff = true;
		}
	})
	linkSusSettings.then(settings => {
		if(settings.onoff == null || settings.onoff == 0){
			linkSusSpamOnOff = false;
		}
		else{
			linkSusSpamOnOff = true;
		}
	})
	susMessages = [];
	prevMsg = null;

	badHosts = new Set();
	LinkBlacklist.findAll().then(entries => {
		entries.forEach(entry => {
			if(entry.onoff == 1){
				badHosts.add(entry.host);
			}
		})
	})

	namesBlackList = new Set();
	namesWhiteList = new Set();
	NameBlock.findAll().then(entries => {
		entries.forEach(entry => {
			if(entry.blackwhite == 1){
				namesBlackList.add(entry); //have to add as an entry due to regex check
			}
			else{
				namesWhiteList.add(entry);
			}
		})
	})

	namesAllowListRoles = new Set();
	namesAllowListMembers = new Set();
	AllowList.findAll().then(entries => {
		entries.forEach(entry => {
			if(entry.roleuser == 1){
				namesAllowListRoles.add(entry.entry); //id
			}
			else{
				namesAllowListMembers.add(entry.entry);
			}
		})
	})

	console.log(`Logged in as ${c.user.tag}!`);
})

function nameHandlerHelper(name){
	if(!name){
		return false;
	}
	let blacklist = [...namesBlackList];
	let whitelist = [...namesWhiteList];

	var doubleCheck = false;
	blacklist.forEach(entry => {
		const entryText = entry.entry;
		if(entry.regex == 1){
			const regex = new RegExp(entryText);
			doubleCheck = regex.test(name);
		}
		else{
			doubleCheck = name.includes(entryText);
		}
	})

	var takeAction = true;
	if(doubleCheck){
		whitelist.forEach(entry => {
			const entryText = entry.entry;
			if(entry.regex == 1){
				const regex = new RegExp(entryText);
				takeAction = !(regex.test(name));
			}
			else{
				takeAction = !(name.includes(entryText));
			}
		})
	}

	return (doubleCheck && takeAction);
}

//function to handle name checking
//this function is called when a member joins or is updated
function nameHandler(member){
	if(member.permissions.has(PermissionsBitField.Flags.Administrator)){
		return;
	}

	const newTag = member.user.tag;
	const newUsername = member.user.username;
	const newNickname = member.nickname;
	
	const memberRoles = member.roles.cache;
	const memberID = member.user.id;

	if(![...namesAllowListMembers].includes(memberID)){ //if true, skip this member. they're on the allowlist
		var breakCondition = false;
		memberRoles.forEach(role => {
			if([...namesAllowListRoles].includes(role.id)){
				breakCondition = true;
				return; //skip this member. they have a role that's on the allowlist
			}
		})
		if(breakCondition){ return; }
		if(nameHandlerHelper(newTag) || nameHandlerHelper(newUsername) || nameHandlerHelper(newNickname)){
			NameBlockSettings.findOne({where: {category: 'general'}}).then(settings => {
				let message = 'A user joined with or changed one of their names to a rule-breaking name.';
				if(settings.timeout > 0){
					message = message + ' The user was timed out for 28 days as a result.';
					member.timeout(settings.timeout, 'having a rule-breaking name');
				}
				if(settings.alert == 1){
					Channels.findOne({where: {name: "log"} }).then(logchannel => {
						let logChannelID = logchannel.channelID;
						client.channels.cache.get(logChannelID).send(message);
					})
				}
				console.log(message);
			})
		}
	}
}

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
	nameHandler(oldMember);
	nameHandler(newMember);
})

client.on(Events.GuildMemberAdd, member => {
	const memberName = member.user.tag;
	console.log(memberName + " joined the server");
	Welcome.findOne({where: {category: "standard"} }).then(welcome => {
		if(welcome){
			if(welcome.onoff == 1){
				member.guild.channels.create({
					name: "Welcome-" + memberName,
					type: ChannelType.GuildText,
					permissionOverwrites: [{
						id: member.id,
						allow: [PermissionsBitField.Flags.ViewChannel,
								PermissionsBitField.Flags.ReadMessageHistory]
					},
					{
						id: member.guild.roles.everyone,
						deny: [PermissionsBitField.Flags.ViewChannel]
					}]
				});
			}
		}
	})
	nameHandler(member);
})

client.on(Events.ChannelDelete, channel => {
	const channelName = channel.name;
	console.log(channelName + " was deleted");
	if(channelName.slice(0, 7) == "welcome"){
		let message = "Synced template ";
		Template.findOne({where: {name: "default"} }).then(entry => {
			if(entry){
				let templateURL = entry.url;
				interaction.guild.client.fetchGuildTemplate(templateURL).then(template => {
					template.sync();
					console.log("synced template " + template.name);

					message = message + template.name;
				})
			}
			else{
				message = "Server template has not been set! Try setting it with the 'template set' command.";
			}

			Channels.findOne({where: {name: "log"} }).then(logchannel => {
				let logChannelID = logchannel.channelID;
				client.channels.cache.get(logChannelID).send(message);
			})
		})
	}
})

client.login(token);