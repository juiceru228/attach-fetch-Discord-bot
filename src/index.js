const { Client, IntentsBitField } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const { token } = require('../config.json');

const client = new Client({ 
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.GuildMembers] 
});


async function downloadAttachment(url) {
    const originalFileName = new URL(url).pathname.split('/').pop();
    const fileExtension = originalFileName.split('.').pop();
    const uniqueId = crypto.randomBytes(5).toString('hex'); 
    const tempFileName = `downloads/temp_${uniqueId}.${fileExtension}`;
    const finalFileName = `downloads/${uniqueId}_${originalFileName}`;
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream(tempFileName))
        .on('finish', () => {
            fs.rename(tempFileName, finalFileName, (err) => {
                if (err) {
                    console.error('Error renaming file:', err);
                } else {
                    console.log(`File downloaded and renamed successfully to ${finalFileName}`);
                }
            });
        })
        .on('error', (e) => {
            console.error('Error downloading file:', e);
        });
}

client.on("ready", (c) => {
    console.log(`${c.user.tag} is online.`)
});


client.on("messageCreate", async (msg) => {
    let prefix = "!";
    let message = msg.content;
    let channel= msg.channelId;
    let botChannel = "your_channel_id";

    if (channel === botChannel){
        if (message.startsWith(prefix)){
            const args = message.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const sendMessage = (message) => {
                client.channels.cache.get(botChannel).send(message);
            }
            switch (command) {
                case "help":
                    console.log("help init");
                    sendMessage("gitgut");
                    break;
                case "stats":
                    sendMessage(`This server has ${msg.guild.memberCount} members`);
                    console.log('stats init');
                    break;
                case "getprevmsg":
                    let messages = [];
                    let lastMessageId;
                    while (true) {
                        try {

                            const fetchedMessages = await msg.channel.messages.fetch({ limit: 100, before: lastMessageId });
                            fetchedMessages.forEach(message => {
                                message.attachments.forEach(attachment => {
                                    messages.push(attachment.url);
                                    console.log(attachment.url);
                                });
                            });
            
                            if (fetchedMessages.size < 100) {
                                break;
                            }
                            lastMessageId = fetchedMessages.last().id;
                        } catch (error) {
                            console.error('Error fetching messages:', error);
                            break;
                        }
                    }
                    await fs.writeFile('downloads/attachments_from_command.txt', messages.join('\n'), (err) => {
                        if (err){
                            console.error(err);
                        }
                    });
                    console.log('Attachments URLs from command saved to attachments_from_command.txt');
                    for (let i = 0; i < messages.length; i++) {
                        try{
                            await downloadAttachment(messages[i]);
                        } catch (err){
                            console.error(err);
                            break;
                        }
                    }
                    console.log('Fetching is end');
                    break;
                default:
                    sendMessage("Command not found");
            }
        }
    }
    else {
        sendMessage("exeption - channel id is wrong");
        console.log('command error init');
    }

});


client.login(token)