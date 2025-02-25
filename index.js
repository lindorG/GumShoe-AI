import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import { exec } from 'child_process';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const LAST_EMBED_FILE = 'last_embedded_message.json';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Function to load the last embedded message
function loadLastEmbeddedMessage() {
  try {
    const data = fs.readFileSync(LAST_EMBED_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading last embedded message:', err);
    return null;
  }
}

// Function to save the last embedded message
function saveLastEmbeddedMessage(message) {
  const data = JSON.stringify({ channelId: message.channel.id, messageId: message.id });
  fs.writeFileSync(LAST_EMBED_FILE, data, 'utf8');
}

// Function to generate a response using DeepSeek-R1
async function deepSeekGenerate(prompt) {
  // Simulate a call to DeepSeek-R1
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Generated response for prompt: ${prompt}`);
    }, 2000); // Simulate a 2-second response time
  });
}

// Function to handle messages
async function handleMessage(message) {
  if (message.author.bot) return;

  // Log the received message
  console.log(`Received message from ${message.author.username}: ${message.content}`);

  // Send a "thinking" message
  const thinkingMessage = await message.channel.send('GumShoe BOT is thinking...');

  try {
    // Set a timeout for the DeepSeek-R1 response
    const deepSeekResponse = await Promise.race([
      deepSeekGenerate(message.content),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)) // 10-second timeout
    ]);

    // Check if the response is valid
    if (!deepSeekResponse || deepSeekResponse.length === 0) {
      throw new Error('Empty response from DeepSeek-R1');
    }

    // Create an embed with the response
    const embed = new EmbedBuilder()
      .setTitle('GumShoe BOT Response')
      .setDescription(deepSeekResponse)
      .setColor(0x00AE86);

    // Send the embed and save the reference
    const sentMessage = await message.channel.send({ embeds: [embed] });
    saveLastEmbeddedMessage(sentMessage);
  } catch (error) {
    console.error('Error handling message:', error);
    await message.channel.send('Sorry, something went wrong while processing your request.');
  } finally {
    // Delete the "thinking" message
    await thinkingMessage.delete();
  }
}

client.on('messageCreate', handleMessage);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(DISCORD_TOKEN);
