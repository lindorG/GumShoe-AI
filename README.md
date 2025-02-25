# GumShoe-AI: Discord AI Chatbot

## Description

GumShoe-AI is an advanced Discord chatbot powered by DeepSeek-R1-70B. It provides AI-driven responses to user queries in Discord text channels. The bot leverages the Groq API for fast, high-quality responses and supports seamless interaction through Discord's messaging interface.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: [Download Node.js](https://nodejs.org/en/download)
- **Python 3**: Required for executing AI-related scripts.
- **Discord Bot Token**: Obtainable from the [Discord Developer Portal](https://discord.com/developers/applications).
- **Groq API Key**: Sign up and retrieve your API key from the [Groq Platform](https://groq.com/).

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/lindorG/GumShoe-AI.git
   cd GumShoe-AI
   ```

2. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory of the project.
   - Add the following lines to the `.env` file:
     ```ini
     DISCORD_TOKEN=your_discord_bot_token_here
     API_KEY=your_groq_api_key_here
     ```
   Replace `your_discord_bot_token_here` and `your_groq_api_key_here` with your actual tokens.

4. **Configure Python Execution**:
   - **Windows**:
     - Ensure Python is installed and added to your system's PATH.
   - **macOS/Linux**:
     - Verify Python 3 is installed:
       ```bash
       python3 --version
       ```
     - If the default `python` command is not available, create an alias:
       ```bash
       sudo ln -s /usr/bin/python3 /usr/bin/python
       ```

### Running the Bot

To start the bot, execute:

```bash
node index.js
```

The bot should now be active and ready to provide AI-powered responses.

## Troubleshooting

- **Python Not Found Error**:
  - If you encounter an error indicating that `python` is not found:
    - **macOS/Linux**: Create an alias for Python 3 as shown in the installation steps.
    - **Windows**: Ensure Python is installed and the path is added to the system environment variables.

- **Permission Issues**:
  - Ensure the bot has the necessary permissions in the Discord server, especially message reading and sending permissions.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## Author

- Discord: [@gumshoe](https://discord.com/users/173155815312588800)

## Version History

- **0.0.6**
  - AI-powered chatbot functionality added
  - Improved stability and performance

