import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import { exec } from 'child_process';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const LAST_EMBED_FILE = 'last_embedded_message.json';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
});

// Load and save last embedded message
function loadLastEmbeddedMessage() {
    try {
        const data = fs.readFileSync(LAST_EMBED_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error loading last embedded message:', err);
        return null;
    }
}

function saveLastEmbeddedMessage(message) {
    const data = JSON.stringify({ channelId: message.channel.id, messageId: message.id });
    fs.writeFileSync(LAST_EMBED_FILE, data, 'utf8');
}

async function deepSeekGenerate(prompt) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Generated response for prompt: ${prompt}`);
        }, 2000);
    });
}

async function handleMessage(message) {
    if (message.author.bot) return;

    console.log(`Received message from ${message.author.username}: ${message.content}`);
    const thinkingMessage = await message.channel.send('GumShoe BOT is thinking...');

    try {
        const deepSeekResponse = await Promise.race([
            deepSeekGenerate(message.content),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);

        if (!deepSeekResponse || deepSeekResponse.length === 0) {
            throw new Error('Empty response from DeepSeek-R1');
        }

        const embed = new EmbedBuilder()
            .setTitle('GumShoe BOT Response')
            .setDescription(deepSeekResponse)
            .setColor(0x00AE86);

        const sentMessage = await message.channel.send({ embeds: [embed] });
        saveLastEmbeddedMessage(sentMessage);
    } catch (error) {
        console.error('Error handling message:', error);
        await message.channel.send('Sorry, something went wrong while processing your request.');
    } finally {
        await thinkingMessage.delete();
    }
}

client.on('messageCreate', handleMessage);

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
        ),
    new SlashCommandBuilder()
        .setName('ask_gumshoe')
        .setDescription('Ask GumShoe AI a question.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you want to ask GumShoe AI')
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

        let beforeMessageId = null;
        let hasMore = true;

        while (hasMore) {
            const options = { limit: 100 };
            if (beforeMessageId) options.before = beforeMessageId;

            const messages = await sourceChannel.messages.fetch(options);
            const sortedMessages = [...messages.values()].reverse();

            for (const message of sortedMessages) {
                if (message.author.bot) continue;

                const embed = new EmbedBuilder()
                    .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
                    .setColor(0x5865F2)
                    .setTimestamp(message.createdAt)
                    .setDescription(message.content || '');

                if (message.attachments.size > 0) {
                    embed.setImage(message.attachments.first().url);
                }

                await targetChannel.send({ embeds: [embed] });
            }

            hasMore = messages.size === 100;
            if (messages.size > 0) beforeMessageId = messages.last().id;
        }

        await interaction.reply({
            content: `✅ Successfully copied messages from <#${sourceChannelId}> to <#${targetChannelId}>.`,
            ephemeral: true
        });
    } else if (interaction.commandName === 'ask_gumshoe') {
        const question = interaction.options.getString('question');

        await interaction.deferReply();

        exec(`python ask_gumshoe.py "${question}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return interaction.followUp('⚠️ An error occurred while processing your request.');
            }
            if (stderr) {
                console.error(`Python script stderr: ${stderr}`);
                return interaction.followUp('⚠️ An error occurred while processing your request.');
            }
            interaction.followUp(stdout.trim());
        });
    }
});

client.login(DISCORD_TOKEN);

