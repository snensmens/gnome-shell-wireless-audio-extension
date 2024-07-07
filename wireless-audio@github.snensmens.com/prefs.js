import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { GeneralSettings } from './src/preferences/general.js';
import {PactlController} from "./src/pactl.js";

export default class WirelessAudioPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const pactl = new PactlController();
        
        window.add(new GeneralSettings(this.getSettings(), pactl.isInstalled()));
    }
}
