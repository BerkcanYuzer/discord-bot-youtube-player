const {
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const play = require("play-dl");

async function playSong(song, connection, DiscordService) {
  let stream = await play.stream(song.url);
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

  player.on("stateChange", (oldState, newState) => {
    if (oldState.status === "playing" && newState.status === "idle") {
      DiscordService.playerList.shift();

      if (DiscordService.playerList.length > 0) {
        const nextSong = playerList[0];
        playSong(nextSong, connection, DiscordService.playerList);
      } else {
        connection.destroy();
      }
    }
  });
}

module.exports = {
  playSong,
};
