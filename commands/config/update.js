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

const LinkBlacklist = sequelize.define('linkblacklist', {
	host: {
		type: Sequelize.TEXT,
		unique: true,
	},
	onoff: Sequelize.TINYINT,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Update an entry in the channel blacklist')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to update in the blacklist')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption(option => 
			option.setName('phrases')
				.setDescription('Exclude this channel from the phrases feature?')
				.setRequired(false))
		.addBooleanOption(option => 
			option.setName('mention')
				.setDescription('Exclude this channel from the mention spam protection feature?')
				.setRequired(false))
		.addBooleanOption(option => 
			option.setName('spam')
				.setDescription('Exclude this channel from the suspected spam protection feature?')
				.setRequired(false)),
		execute(interaction){
			const channel = interaction.options.getChannel('channel');
			const phrases = interaction.options.getBoolean('phrases');
			const mention = interaction.options.getBoolean('mention');
			const spam = interaction.options.getBoolean('spam');
			var category = "";
			if(phrases != null || mention != null || spam != null){
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
				return interaction.reply({content: `You have chosen not to update anything, so the settings for ${channel.name}, if they exist, have been left alone.`, ephemeral: false});
			}

			category = category.trim();
			const id = channel.id;

			Blacklist.findOne({where: {channelID: id} }).then(entry => {
				if(entry){
					const oldCategory = entry.category;
					var message = channel.name + " was on the {" + oldCategory + "} blacklist(s). It is now on the {";
					message = message + category + "} blacklist(s)";

					const affectedRows = Blacklist.update({category: category}, {where: {channelID: id.toString()}});
					Blacklist.sync();

					affectedRows.then(rows => {
						if(rows[0] > 0){
							return interaction.reply({content: message, ephemeral: false});
						}
						else{
							return interaction.reply({content: `The blacklist(s) were not updated for ${channel.name}. If you think this is an error, tell an admin to check the logs`});
						}
					})
				}
				else{
					return interaction.reply({content: `${channel.name} was not found in the blacklist. Try running /blacklist to see if it's there!`, ephemeral: false});
				}
			})
		},
};