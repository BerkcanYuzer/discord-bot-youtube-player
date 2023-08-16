# Müzik Botu - Discord

Bu Discord botu, sunucunuzda müzik çalmanıza ve dinlemenize olanak tanır. Bot, metin tabanlı slash komutları kullanarak çalma listesi oluşturmanıza, müziği duraklatmanıza, devam ettirmenize, sıradaki şarkıya geçmenize ve daha fazlasına olanak sağlar.

## Gereksinimler

- Node.js 16 veya daha yeni bir sürümü
- NPM veya Yarn paket yöneticisi
- Bir Discord bot hesabı ve botun tokenı

## Kurulum

1. Repository'yi klonlayın veya zip dosyasını indirin:
```
git clone https://github.com/BerkcanYuzer/discord-youtube-player-bot-app.git
```
3. Proje klasörüne gidin
4. Gerekli bağımlılıkları yükleyin:
```
npm install
```
5. `config.json` dosyasını düzenleyin:

```json
{
  "discordToken": "BURAYA_DISCORD_BOT_TOKENI_GIRIN",
  "discordBotId": "BURAYA_DISCORD_BOT_ID_GIRIN",
  "discordGuildId": "BURAYA_DISCORD_SUNUCU_ID_GIRIN"
}
```
- discordToken: Discord botunuza ait token.
- discordBotId: Discord botunuzun kimliği (ID'si).
- discordGuildId: Botun bağlı olacağı Discord sunucu kimliği (ID'si).
6. Botu başlatın:
```
npm run start 
```
ya da 
```
node index.js
```
Botunuz artık Discord sunucunuza katılmış ve hazır durumda!

## Kullanım
Botunuz, /play, /pause, /start, /list, /next, /remove, /repeat, /reset, /leave olmak üzere çeşitli slash komutlarını destekler.
- /play <şarkı_adı veya_video_url>: Verilen şarkıyı çalma listesine ekler ve oynatmaya başlar.
- /pause: Mevcut şarkıyı duraklatır.
- /start: Duraklatılan şarkıyı devam ettirir.
- /list: Çalma listesini gösterir.
- /next: Bir sonraki şarkıya geçer.
- /remove <şarkı_sıra_no>: Belirtilen sıradaki şarkıyı çalma listesinden kaldırır.
- /repeat: Şu anda çalınan şarkıyı tekrar oynatır.
- /reset: Çalma listesini sıfırlar ve botu sesli kanaldan çıkarır.
- /leave: Botu sesli kanaldan çıkarır.
