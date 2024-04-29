const { SlashCommandBuilder } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	// SQLite only
	storage: 'database.sqlite',
});

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
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('listphrases')
		.setDescription('List all phrases in the database and their detailed responses'),
		execute(interaction){
			const channelSentIn = interaction.channel;
			Phrases.findAll().then(phrases => {
				let list = [];

				phrases.forEach(entry => {
					list.push(entry);
				})

				let message = list.length + " phrases on the list \n";
				if(list.length == 0){
					Phrases.sync({force: true}); //recreates the table, resetting the id
				}
				list.forEach(entry => {
					message = message + entry.id + ") phrase: ||" + entry.phrase + "|| | reply: ";
					let reply = entry.response;
					if(reply == null || reply.length == 0){
						message = message + "N/A";
					}
					else{
						message = message + reply;
					}
					message = message + "\nresponse: "
					
					if(entry.delete == 0){
						message = message + "do not ";
					}
					message = message + "delete the message and ";
					
					const timeoutNum = entry.timeout;
					if(timeoutNum > 0){
						const minute = 60 * 1000;
						const hour = 60 * 60 * 1000;
						const day = 24 * 60 * 60 * 1000;
						message = message + "timeout the user for a";

						if(timeoutNum == minute){
							message = message + " minute";
						}
						else if(timeoutNum == hour){
							message = message + "n hour"
						}
						else if(timeoutNum == day){
							message = message + " day";
						}
					}
					else if(timeoutNum == 0){
						message = message + "do nothing else.";
					}
					message = message + "\n ----------- \n";
				})

				let pages = [];
				const msgLength = message.length;
				const MAXLENGTH = 2000;
				const entryCount = list.length;
				if(msgLength <= MAXLENGTH){
					return interaction.reply({content: message, ephemeral: false});
				}
				else{
					const pageCount = Math.ceil(msgLength / 2000);
					let startingIndex = 0;
					for(let i = 0; i < pageCount; i++){
						var currPage;
						var trimPoint;
						if( (2000 + startingIndex) > msgLength){
							currPage = message.slice(startingIndex, msgLength);
							trimPoint = msgLength;
						}
						else{	
							currPage = message.slice(startingIndex, (2000 * (i + 1)));
							trimPoint = currPage.lastIndexOf("phrase:");
						}
						let currPageTrimmed = currPage.slice(0, trimPoint);
						
						channelSentIn.send(currPageTrimmed);
						
						startingIndex = startingIndex + currPageTrimmed.length - 1; 
					}

					return interaction.reply({content: "the list is long, so I split it into multiple messages. Please reduce the number of entries so Discord doesn't get mad at the developer :(."})
				}

			})
		},
};