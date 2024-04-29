const { ChannelType, SlashCommandBuilder } = require('discord.js');

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
		if(channelName.slice(0, 7) == "welcome"){
			channel.delete();
			return interaction.reply({ content: 'Success!', ephemeral: false });
		}
		else{
			return interaction.reply({content: "That's not a welcome channel! Please don't try to do that.", ephemeral: false});
		}
	},
};