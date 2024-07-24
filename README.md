# gnome-shell-wireless-audio-extension

Extension for the GNOME Desktop that allows you to
- Discover and use AirPlay Devices
- Stream your audio to other Devices with RTP
- Receive RTP audio streams on your Device

**This extension requires `pactl` to be installed on your system.
To check if it's installed run `pactl --version`.**


## Limitations
- Using AirPlay-Devices with passwords is not supported

## Compatability Chart

|                                            Device                                            | Compatible? |
|:--------------------------------------------------------------------------------------------:|:-----------:|
|                                          AppleTV 4K                                          |      ❌      |
| [shairport-sync](https://github.com/mikebrady/shairport-sync) (Tested on Rasperry Pi Zero W) |     ✔️      |
