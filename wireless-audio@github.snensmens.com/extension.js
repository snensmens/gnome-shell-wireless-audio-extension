/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

import {AirPlayController} from './src/airplay.js';
import {PactlController} from "./src/pactl.js";


const WirelessAudioQuickToggle = GObject.registerClass(
class WirelessAudioQuickToggle extends QuickToggle {
    constructor(settings, path) {
        super({
            title: _('Wireless Audio'),
            toggleMode: true
        });
        
        this.gicon = Gio.icon_new_for_string(`${path}/resources/icons/hicolor/scalable/actions/speaker-wireless-symbolic.svg`);
    }
});


const WirelessAudioIndicator = GObject.registerClass(
class WirelessAudioIndicator extends SystemIndicator {
    constructor(settings, path) {
        super();

        this._indicator = this._addIndicator();
        this._indicator.gicon = Gio.icon_new_for_string(`${path}/resources/icons/hicolor/scalable/actions/speaker-wireless-symbolic.svg`);
        
        this.toggle = new WirelessAudioQuickToggle(settings, path);
        this.toggle.connect('notify::checked', () => {
            this.toggle.checked ? this.showIconIfEnabled() : this.hideIcon();
        });

        this.settings = settings;
        this.settings.connect('changed::show-icon', () => {
            this.settings.get_boolean('show-icon') ? this.showIconIfEnabled() : this.hideIcon();
        });

        this.visible = this.settings.get_boolean('show-icon') && this.toggle.checked;

        this.quickSettingsItems.push(this.toggle);
    }

    showIconIfEnabled() {
        if( this.settings.get_boolean('show-icon') && this.toggle.checked ) {
            this.visible = true;
        }
    }

    hideIcon() {
        this.visible = false;
    }
});


export default class QuickSettingsAirPlayExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._settings.set_boolean('active', false);

        this._indicator = new WirelessAudioIndicator(this.getSettings(), this.path);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        
        this.pactl = new PactlController();
        this.airplay = new AirPlayController();

        this.toggle = this._indicator.toggle;

        if( this.pactl.isInstalled() ) {
            this.toggle.connect('notify::checked', () => {
                this.toggle.checked ? this.airplay.enable() : this.airplay.disable();
            });
        }
    }

    disable() {
        this.airplay.disable();

        this._indicator.toggle.active = false;
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        
        this.airplay = null;
        this._settings = null;
    }
}

