import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { GeneralSettings } from './src/preferences/general.js';
import { PactlController } from "./src/pactl.js";
import { RTPSettings } from "./src/preferences/rtp.js";

export default class WirelessAudioPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const pactl = new PactlController();
        
        window.add( new GeneralSettings(this.getSettings(), pactl.isInstalled()) );
        window.add( new RTPSettings(this.getSettings()) )
    }
}
