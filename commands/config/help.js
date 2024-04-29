const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('posts a navigable embed with instructions and details on how to use this bot'),
	execute(interaction){
		return interaction.reply({content: "posting the help message", ephemeral: true});
	},
};