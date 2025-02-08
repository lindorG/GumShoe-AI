# Discord Text Channel Copier / Duplication Bot

## Description

* Simple Discord bot which currently has the capacity to capacity to scan a Discord server's text channel and copy over the messages from that specific text channel and into a target channel

## Getting Started

### Dependencies
must have [node.js](https://nodejs.org/en/download)
```
npm install discord.js
npm install dotenv
```

### Installing

Through the [Discord Development Portal](https://discord.com/developers/applications), create a new application. In the settings, visit "OAuth2", then visit "OAuth2 URL generator" and checkmark "bot". Then scroll down and checkmarket "Administrator" as well. Use the URL that has been generated below to invite your newly created bot applicaiton into server(s) of your choosing. Now, all you must do is visit the "Bot" seciton of settings within the development portal, and in the "Token" area, click "Generate Token"/"Reset Token", and insert the generated token into the ``.env`` file, which is located in the main project files, within the quotations.

### Executing program

```
node index.js
```

## Help

Please reach out to me if you have any issues with this bot. Future updates to come.

## Authors

ex. Discord: [@gumshoe](https://discord.com/users/173155815312588800)

## Version History

* 0.4
    * Initial Release