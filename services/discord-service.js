const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const play = require("play-dl");
const consola = require("consola");

const config = require("../config.json");
const { t } = require("./lang-control-service.js");
const { playSong } = require("../utils/play-song-utils.js");
const {
  checkVoiceChannelAndReply,
} = require("../utils/check-voice-channel-utils.js");

let playerList = [];
let connection = {};

const DiscordService = {
  registerSlashCommands: async () => {
    const rest = new REST({ version: "10" }).setToken(config.discordToken);

    const commands = [
      new SlashCommandBuilder()
        .setName("play")
        .setDescription(t("playDescription"))
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription(t("playSongDescription"))
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName("pause")
        .setDescription(t("pauseDescription")),

      new SlashCommandBuilder()
        .setName("start")
        .setDescription(t("startDescription")),
      new SlashCommandBuilder()
        .setName("list")
        .setDescription(t("listDescription")),

      new SlashCommandBuilder()
        .setName("next")
        .setDescription(t("nextDescription")),

      new SlashCommandBuilder()
        .setName("remove")
        .setDescription(t("removeDescription"))
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription(t("removeSongDescription"))
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName("repeat")
        .setDescription(t("repeatDescription")),

      new SlashCommandBuilder()
        .setName("reset")
        .setDescription(t("resetDescription")),

      new SlashCommandBuilder()
        .setName("leave")
        .setDescription(t("leaveDescription")),
    ];

    const data = await rest.put(
      Routes.applicationGuildCommands(
        config.discordBotId,
        config.discordGuildId
      ),
      { body: commands }
    );
  },

  isInVoiceChannel: (interaction) => {
    const voiceChannel = interaction.member?.voice?.channel;
    return !!voiceChannel;
  },

  play: async (interaction) => {
    const arg = interaction.options.getString("song");

    checkVoiceChannelAndReply(interaction, t);

    if (
      !connection._state ||
      connection._state.channelId !== interaction.member.voice.channel.id
    ) {
      connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.member.voice.channel.guild.id,
        adapterCreator:
          interaction.member.voice.channel.guild.voiceAdapterCreator,
      });
    }
    await interaction.deferReply();

    async function isValidHttpUrl(string) {
      let url;
      try {
        url = new URL(string);
      } catch (_) {
        return false;
      }

      return url.protocol === "http:" || url.protocol === "https:";
    }

    let yt_info = {};
    if (await isValidHttpUrl(arg)) {
      const video_info = await play.video_info(arg);
      yt_info = video_info.video_details;
    } else {
      const video_info = await play.search(arg, {
        limit: 1,
      });
      yt_info = video_info[0];
    }

    const playListPush = {
      url: yt_info.url,
      title: yt_info.title,
      thumbnail: yt_info.thumbnail,
      duration: yt_info.duration,
      channel: yt_info.channel.name,
      channel_url: yt_info.channel.url,
      views: yt_info.views,
      ago: yt_info.ago,
      requested_by: interaction.user.tag,
    };

    playerList.push(playListPush);

    if (!connection._state.subscription) {
      playSong(playerList[0], connection, playerList);
    }

    if (playerList.length === 1) {
      await interaction.editReply({
        content: `${t("nowPlaying")} ${playerList[0].title}`,
        ephemeral: true,
      });
    } else {
      await interaction.editReply({
        content: `${t("addedPlaylist")} ${
          playerList[playerList.length - 1].title
        }`,
        ephemeral: true,
      });
    }
  },

  pause: async (interaction) => {
    checkVoiceChannelAndReply(interaction, t);

    await interaction.deferReply();

    if (!connection || !connection._state || !connection._state.subscription) {
      return interaction.editReply({
        content: t("errorMessage"),
        ephemeral: true,
      });
    }

    const player = connection._state.subscription.player;
    player.pause();

    await interaction.editReply({
      content: t("pauseMessage"),
      ephemeral: true,
    });
  },

  start: async (interaction) => {
    checkVoiceChannelAndReply(interaction, t);

    await interaction.deferReply();

    if (!connection || !connection._state || !connection._state.subscription) {
      return interaction.editReply({
        content: t("errorMessage"),
        ephemeral: true,
      });
    }

    const player = connection._state.subscription.player;

    player.unpause();

    await interaction.editReply({
      content: t("startMessage"),
      ephemeral: true,
    });
  },

  list: async (interaction) => {
    checkVoiceChannelAndReply(interaction, t);

    await interaction.deferReply();

    if (!connection || !connection._state || !connection._state.subscription) {
      return interaction.editReply({
        content: t("errorMessage"),
        ephemeral: true,
      });
    }

    let queueList = "";

    playerList.forEach((item, index) => {
      queueList += `${index + 1}. ${item.title}\n`;
    });

    await interaction.editReply({
      content: `${t("listMessage")} \n${queueList}`,
      ephemeral: true,
    });
  },

  next: async (interaction) => {
    if (!checkVoiceChannelAndReply(interaction)) {
      return;
    }

    await interaction.deferReply();

    if (!connection || !connection._state || !connection._state.subscription) {
      return interaction.editReply({
        content: t("errorMessage"),
        ephemeral: true,
      });
    }

    playerList.shift();

    if (playerList.length === 0) {
      const player = connection._state.subscription.player;
      player.stop();
      connection.destroy();

      return interaction.editReply({
        content: t("nextMessagePlaylistEmpty"),
        ephemeral: true,
      });
    }

    const nextSong = playerList[0];
    playSong(nextSong, connection);

    await interaction.editReply({
      content: `${t("nextMessage")} ${nextSong.title}.`,
      ephemeral: true,
    });
  },

  remove: async (interaction) => {
    checkVoiceChannelAndReply(interaction, t);

    const songName = interaction.options.getString("song");
    const index = parseInt(songName) - 1;

    if (isNaN(index) || index < 0 || index >= playerList.length) {
      return interaction.reply({
        content: t("removeErrorMessage"),
        ephemeral: true,
      });
    }

    const removedSong = playerList.splice(index, 1)[0];

    if (index === 0) {
      const player = connection._state.subscription.player;
      player.stop();

      if (playerList.length > 0) {
        const nextSong = playerList[0];
        playSong(nextSong, connection);
      } else {
        connection.destroy();
      }
    }

    await interaction.reply({
      content: `${t("removeMessage")} ${removedSong.title}.`,
      ephemeral: true,
    });
  },

  repeat: async (interaction) => {
    checkVoiceChannelAndReply(interaction, t);

    if (playerList.length === 0) {
      return interaction.reply({
        content: t("resetErrorMessage"),
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    let stream = await play.stream(playerList[0].url);

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    player.play(resource);

    connection.subscribe(player);

    await interaction.editReply({
      content: `${t("repeatMessage")} ${playerList[0].title}.`,
      ephemeral: true,
    });
  },

  reset: async (interaction) => {
    checkVoiceChannelAndReply(interaction, t);

    if (playerList.length === 0) {
      return interaction.reply({
        content: t("resetErrorMessage"),
        ephemeral: true,
      });
    } else {
      playerList = [];
      connection._state.subscription.player.stop();
      connection.destroy();
    }

    await interaction.reply({
      content: t("resetMessage"),
      ephemeral: true,
    });
  },

  leave: async (interaction) => {
    checkVoiceChannelAndReply(interaction, t);

    if (!connection || !connection._state || !connection._state.subscription) {
      return interaction.reply({
        content: t("errorMessage"),
        ephemeral: true,
      });
    }

    connection.destroy();

    await interaction.reply({
      content: t("leaveMessage"),
      ephemeral: true,
    });
  },
  startCommandRunner: async (interaction) => {
    if (interaction.isCommand()) {
      const { commandName } = interaction;
      const commands = [
        "play",
        "pause",
        "start",
        "list",
        "next",
        "remove",
        "repeat",
        "reset",
        "leave",
      ];

      if (commands.includes(commandName)) {
        if (!DiscordService.isInVoiceChannel(interaction)) {
          return interaction.reply({
            content: t("joinAudio"),
            ephemeral: true,
          });
        }
        await DiscordService[commandName](interaction);
      }
    }
  },
  deleteSlashCommands: async () => {
    const rest = new REST({ version: "10" }).setToken(config.discordToken);

    try {
      consola.start(t("allCommandDelete"));
      await rest.put(
        Routes.applicationGuildCommands(
          config.discordBotId,
          config.discordGuildId
        ),
        {
          body: [],
        }
      );
      consola.success(t("allCommandDeleted"));
    } catch (error) {
      consola.error("Komut silme hatası:", error);
    }
  },
};

module.exports = DiscordService;
