import dotenv from 'dotenv'
dotenv.config()

import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// manually insert the channel_id's here using this template:

// SOURCE_CHANNEL_ID="SOURCE_CHANNEL_ID_GOES_HERE"
// TARGET_CHANNEL_ID="TARGET_CHANNEL_ID_GOES_HERE"
const SOURCE_CHANNEL_ID = process.env.SOURCE_CHANNEL_ID;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.author.bot || message.channel.id !== SOURCE_CHANNEL_ID) return;

    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    if (targetChannel) {
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: message.author.username, 
                iconURL: message.author.displayAvatarURL() 
            })
            .setDescription(message.content)
            .setColor(0x5865F2) 
            .setTimestamp(message.createdAt);

        targetChannel.send({ embeds: [embed] });
    } else {
        console.error('Target channel not found!');
    }
});


client.login(DISCORD_TOKEN);