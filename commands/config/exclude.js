const { ChannelType, SlashCommandBuilder } = require('discord.js');
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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exclude')
		.setDescription('adds a channel to be ignored by the various automod features')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to exclude')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption(option => 
			option.setName('phrases')
				.setDescription('Exclude this channel from the phrases feature?')
				.setRequired(true))
		.addBooleanOption(option => 
			option.setName('mention')
				.setDescription('Exclude this channel from the mention spam protection feature?')
				.setRequired(true))
		.addBooleanOption(option => 
			option.setName('spam')
				.setDescription('Exclude this channel from the suspected spam protection feature?')
				.setRequired(true)),
		execute(interaction){
			const channel = interaction.options.getChannel('channel');
			const phrases = interaction.options.getBoolean('phrases');
			const mention = interaction.options.getBoolean('mention');
			const spam = interaction.options.getBoolean('spam');
			var category = "";
			if(phrases || mention || spam){
				if(phrases){
					category = category + "phrases ";
				}
				if(mention){
					category = category + "mention ";
				}
				if(spam){
					category = category + "spam ";
				}
			}
			else{
				return interaction.reply({content: "Please select at least one feature exclusion", ephemeral: true});
			}
			category = category.trim();
			const id = channel.id;

			try{
				const blacklistedChannel = Blacklist.create({
					channelID: id.toString(),
					category: category,
				});
				Blacklist.sync();
				
				category = category.replace(' ', ', ');
				return interaction.reply({content: `${channel.name} added to (the) {\`${category}\`} exclusion list(s).`, ephemeral: false});
			}
			catch(error){
				return interaction.reply({content: `Something went wrong with adding ${channel.name} to the exclusion list: ${error}.`, ephemeral: false});
			}
		},
};