import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { GeneralSettings } from './src/preferences/general.js';
import { RTPSettings } from './src/preferences/rtp.js';

export default class WirelessAudioPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        
        window.add(new GeneralSettings(this.getSettings()));
        window.add(new RTPSettings(this.getSettings()));
    }
}
