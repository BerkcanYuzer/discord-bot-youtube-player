const checkVoiceChannelAndReply = (interaction, t) => {
  if (!interaction.member.voice.channel) {
    interaction.reply({
      content: t("joinAudio"),
      ephemeral: true,
    });
    return false;
  }
  return true;
};

module.exports = {
  checkVoiceChannelAndReply,
};
