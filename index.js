import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionsBitField } from 'discord.js';
import fs from 'fs';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const LAST_EMBED_FILE = 'last_embedded_message_id.txt';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
});

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
        .setDescription('Deletes the last 50 messages sent by the bot within the past 2 hours.'),
    new SlashCommandBuilder()
        .setName('copy_text_channel')
        .setDescription('Copies messages from a source channel to a target channel.')
        .addStringOption(option =>
            option.setName('sourcechannel')
                .setDescription('The ID of the source channel')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('targetchannel')
                .setDescription('The ID of the target channel')
                .setRequired(true)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('Slash commands registered successfully.');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'clean') {
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
                ephemeral: true
            });
        } catch (error) {
            console.error('Error deleting messages:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while trying to delete messages.',
                ephemeral: true
            });
        }
    } else if (interaction.commandName === 'copy_text_channel') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '⚠️ You need administrator permissions to use this command.',
                ephemeral: true
            });
        }

        const sourceChannelId = interaction.options.getString('sourcechannel');
        const targetChannelId = interaction.options.getString('targetchannel');

        const sourceChannel = await client.channels.fetch(sourceChannelId).catch(() => null);
        const targetChannel = await client.channels.fetch(targetChannelId).catch(() => null);

        if (!sourceChannel || !targetChannel) {
            return interaction.reply({
                content: '⚠️ One or both channel IDs are invalid. Please provide valid channel IDs.',
                ephemeral: true
            });
        }

        const embeddedMessageIds = new Set(getEmbeddedMessageIds());
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

        await interaction.reply({
            content: `✅ Successfully copied messages from <#${sourceChannelId}> to <#${targetChannelId}>.`,
            ephemeral: true
        });
    }
});

client.login(DISCORD_TOKEN);