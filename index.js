import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, InteractionResponseType } from 'discord.js';
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

const getEmbeddedMessageIds = () => {
    if (fs.existsSync(LAST_EMBED_FILE)) {
        return fs.readFileSync(LAST_EMBED_FILE, 'utf8').trim().split('\n');
    }
    return [];
};

const addEmbeddedMessageId = (messageId) => {
    fs.appendFileSync(LAST_EMBED_FILE, `${messageId}\n`, 'utf8');
};

const commands = [
    new SlashCommandBuilder()
        .setName('clean')
        .setDescription('Deletes the last 50 messages sent by the bot within the past 2 hours.')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    const sourceChannel = await client.channels.fetch(SOURCE_CHANNEL_ID);
    const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
    const embeddedMessageIds = new Set(getEmbeddedMessageIds());

    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, TARGET_GUILD_ID),
            { body: commands }
        );
        console.log('Slash command registered successfully.');
    } catch (error) {
        console.error('Error registering slash command:', error);
    }

    let beforeMessageId = null;
    let hasMore = true;

    while (hasMore) {
        const options = { limit: 100 };
        if (beforeMessageId) options.before = beforeMessageId;

        const messages = await sourceChannel.messages.fetch(options);
        const sortedMessages = [...messages.values()].reverse();

        for (const message of sortedMessages) {
            if (embeddedMessageIds.has(message.id)) continue;

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
                addEmbeddedMessageId(message.id);
                embeddedMessageIds.add(message.id);
            }

            beforeMessageId = message.id;
        }

        hasMore = messages.size === 100;
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== SOURCE_CHANNEL_ID) return;

    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    const embeddedMessageIds = new Set(getEmbeddedMessageIds());

    if (targetChannel && !embeddedMessageIds.has(message.id)) {
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
        addEmbeddedMessageId(message.id);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() || interaction.commandName !== 'clean') return;

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) return;

    try {
        const messages = await channel.messages.fetch({ limit: 50 });
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

        const messagesToDelete = messages.filter(msg =>
            msg.author.id === client.user.id && msg.createdTimestamp >= twoHoursAgo
        );

        await channel.bulkDelete(messagesToDelete, true);

        await interaction.reply({
            content: `🗑️ Deleted ${messagesToDelete.size} bot messages from the past 2 hours.`,
            flags: 64
        });
    } catch (error) {
        console.error('Error deleting messages:', error);
        await interaction.reply({
            content: '⚠️ An error occurred while trying to delete messages.',
            flags: 64
        });
    }
});

client.login(DISCORD_TOKEN);