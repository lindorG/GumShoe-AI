import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } from 'discord.js';
import fs from 'fs';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const LAST_EMBED_FILE = 'last_embedded_message_id.txt';
const TARGET_GUILD_ID = process.env.TARGET_GUILD_ID;
const SOURCE_CHANNEL_ID = process.env.SOURCE_CHANNEL_ID;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
// const CHANNEL_ID = process.env.CHANNEL_ID;

const getLastEmbeddedMessageId = () => {
    if (fs.existsSync(LAST_EMBED_FILE)) {
        return fs.readFileSync(LAST_EMBED_FILE, 'utf8');
    }
    return null;
};

const setLastEmbeddedMessageId = (messageId) => {
    fs.writeFileSync(LAST_EMBED_FILE, messageId, 'utf8');
};

const commands = [
    new SlashCommandBuilder()
        .setName('clean')
        .setDescription('Deletes the last 50 messages sent within the past hour.')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    const sourceChannel = await client.channels.fetch(SOURCE_CHANNEL_ID);
    const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
    const lastEmbeddedId = getLastEmbeddedMessageId();

    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, TARGET_GUILD_ID),
            { body: commands }
        );
        console.log('Slash command registered successfully.');
    } catch (error) {
        console.error('Error registering slash command:', error);
    }

    let options = { limit: 100 };
    if (lastEmbeddedId) {
        options.after = lastEmbeddedId;
    }

    const messages = await sourceChannel.messages.fetch(options);
    const sortedMessages = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    for (const message of sortedMessages) {
        if (!message.author.bot) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
                .setColor(0x5865F2)
                .setTimestamp(message.createdAt);

            if (message.content.trim()) {
                embed.setDescription(message.content);
            }

            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                embed.setImage(attachment.url);
            }

            await targetChannel.send({ embeds: [embed] });
            setLastEmbeddedMessageId(message.id);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== SOURCE_CHANNEL_ID) return;

    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    if (targetChannel) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setColor(0x5865F2)
            .setTimestamp(message.createdAt);

        if (message.content.trim()) {
            embed.setDescription(message.content);
        }

        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            embed.setImage(attachment.url);
        }

        await targetChannel.send({ embeds: [embed] });
        setLastEmbeddedMessageId(message.id);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() || interaction.commandName !== 'clean') return;

    const channel = client.channels.cache.get(TARGET_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    try {
        const messages = await channel.messages.fetch({ limit: 50 });
        const twoHoursAgo = Date.now() - 60 * 120 * 1000;

        const messagesToDelete = messages.filter(msg => msg.createdTimestamp >= twoHoursAgo)

        await channel.bulkDelete(messagesToDelete, true);

        await interaction.reply({ content: `Deleted ${messagesToDelete.size} messages from the past two hours.`, ephemeral: true });
    } catch (error) {
        console.error('Error deleting messages:', error);
        await interaction.reply({ content: 'An error occurred while trying to delete messages.', ephemeral: true });
    }
});

client.login(DISCORD_TOKEN);
