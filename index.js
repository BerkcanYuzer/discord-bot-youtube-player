const { Client, Events, GatewayIntentBits } = require("discord.js");

const config = require("./config.json");
const DiscordService = require("./services/discord-service");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
});
client.on("ready", async () => {
  await DiscordService.registerSlashCommands();
  console.log("Bot is ready!");
});

client.on(Events.InteractionCreate, async (interaction) => {
  await DiscordService.startCommandRunner(interaction);
});

client.login(config.discordToken);
