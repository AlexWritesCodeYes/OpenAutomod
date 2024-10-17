const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

const Archived = sequelize.define('archived', { //database of archived channels
	channelID: {											   //double check this database before allowing /delete
		type: Sequelize.TEXT,
		unique: true,
	},
	name: Sequelize.STRING,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('deletes a channel then syncs the server template')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to delete')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText)),
	execute(interaction){
		const channel = interaction.options.getChannel('channel');
		const channelName = channel.name;
		const channelID = channel.id;

		var yesCustomId = "yes_button-" + channel.id.toString(); //this is such a stupid hack
		var cancelCustomId = "cancel_button-" + channel.id.toString();
		if(channelName.slice(0, 7) == "welcome"){
			let buttons = new ActionRowBuilder();
			buttons.addComponents(
				new ButtonBuilder()
					.setCustomId(yesCustomId) //seriously this is dumb
					.setStyle(ButtonStyle.Success)
					.setLabel('Yes'),
				new ButtonBuilder()
					.setCustomId(cancelCustomId)
					.setStyle(ButtonStyle.Danger)
					.setLabel('Cancel'),
			);

			Archived.findOne({where: {channelID: channelID}}).then(ach => {
				if(ach){
					try{
						rowCount = Archived.destroy({where: {channelID: channelID} });
						Archived.sync();
					}
					catch(error){
						console.log(error);
					}
					finally{
						return interaction.reply({ content: `Are you sure you want to delete #${channelName}?`, components: [buttons], ephemeral:false });
					}
				}
				else{
					return interaction.reply({ content: `#${channelName} has **NOT** been archived! Are you sure you want to delete it?`, components: [buttons], ephemeral:false });
				}
			});
		}
		else{
			return interaction.reply({content: "That's not a welcome channel! Please don't try to do that.", ephemeral: false});
		}
	},
};