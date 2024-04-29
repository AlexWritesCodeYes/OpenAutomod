const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('masterlist')
		.setDescription('posts a navigable embed with a list of all commands and their category'),
	execute(interaction){
		return interaction.reply({content: "posting the command list", ephemeral: true});
	},
};