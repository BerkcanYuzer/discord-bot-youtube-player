const { Client, GatewayIntentBits, Options } = require("discord.js");
const { VoiceConnectionStatus } = require("@discordjs/voice");
const consola = require("consola");

const config = require("./config.json");
const DiscordService = require("./services/discord-service");
const { t } = require("./services/lang-control-service");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  makeCache: Options.cacheWithLimits({
    MessageManager: 0,
    PresenceManager: 0,
    ThreadManager: 0,
  }),
});

client.once("ready", async () => {
  const guild = client.guilds.cache.get(config.discordGuildId);

  if (guild) {
    try {
      await guild.commands.set([]);
      consola.success(t("slashDelete"));
    } catch (error) {
      consola.error(error);
    }
  } else {
    consola.error(t("guildNotFound"));
  }
});

client.on("ready", async () => {
  await DiscordService.deleteSlashCommands();
  await DiscordService.registerSlashCommands();
  consola.box(t("botReady"));
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  await DiscordService.startCommandRunner(interaction);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.member.user.bot) {
    if (
      newState.channelId &&
      newState.channel.type === "GUILD_VOICE" &&
      newState.connection &&
      newState.connection.state.status === VoiceConnectionStatus.Connecting
    ) {
      newState.connection.voice.setSelfDeaf(false);
      newState.connection.voice.setSelfMute(false);
    }
  }
});

client.login(config.discordToken);
