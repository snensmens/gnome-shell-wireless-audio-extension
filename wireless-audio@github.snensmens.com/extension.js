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

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

import {AirPlayController} from './airplay.js';
import {TCPDiscoverer} from './tcp.js';

const WirelessAudioQuickToggle = GObject.registerClass(
class WirelessAudioQuickToggle extends QuickToggle {
    constructor(settings, path) {
        super({
            title: _('Wireless Audio'),
            toggleMode: true
        });
        
        this.gicon = Gio.icon_new_for_string(`${path}/icons/hicolor/scalable/actions/speaker-wireless-symbolic.svg`);
        this.checked = settings.get_boolean('activate-on-startup');
    }
});


const WirelessAudioIndicator = GObject.registerClass(
class WirelessAudioIndicator extends SystemIndicator {
    constructor(settings, path, airplay) {
        super();

        this._indicator = this._addIndicator();
        this._indicator.gicon = Gio.icon_new_for_string(`${path}/icons/hicolor/scalable/actions/speaker-wireless-symbolic.svg`);
        
        //settings.bind('show-topbar-icon', this._indicator, 'visible', Gio.SettingsBindFlags.DEFAULT);
        
        this.toggle = new WirelessAudioQuickToggle(settings, path);
        this.toggle.connect('notify::checked', () => {
            this._indicator.visible = this.toggle.checked && settings.get_boolean('show-topbar-icon');
            
            if (settings.get_boolean('discover-airplay')) {
                this.toggle.checked ? airplay.enable() : airplay.disable();
            }
        });
        
        this._indicator.visible = this.toggle.checked && settings.get_value('show-topbar-icon');
        
        settings.connect('changed::show-topbar-icon', (_, key) => {
            this._indicator.visible = this.toggle.checked && settings.get_boolean('show-topbar-icon');
        });
        
        this.quickSettingsItems.push(this.toggle);
    }
});


export default class QuickSettingsAirPlayExtension extends Extension {
    enable() {
        this._airplay = new AirPlayController();
        
        this._indicator = new WirelessAudioIndicator(this.getSettings(), this.path, this._airplay);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        
        this._settings = this.getSettings();
        this._discoverAirplayHandlerId = this._settings.connect('changed::discover-airplay', (settings, key) => {
            console.log(`${key} = ${settings.get_value(key).print(true)}`);
            
            if (this._indicator.toggle.checked) {
                settings.get_boolean(key) ? this._airplay.enable() : this._airplay.disable();
            }
        });
        this._discoverTCPHandlerId = this._settings.connect('changed::discover-tcp', (settings, key) => { console.log(`${key} = ${settings.get_value(key).print(true)}`); });
        this._exposeTCPHandlerId = this._settings.connect('changed::expose-tcp', (settings, key) => { console.log(`${key} = ${settings.get_value(key).print(true)}`); });
    }

    disable() {
        this._airplay.disable();
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        
        this._airplay = null;
        
        if (this._discoverAirplayHandlerId) {
            this._settings.disconnect(this._discoverAirplayHandlerId);
        }
        if (this._discoverTCPHandlerId) {
            this._settings.disconnect(this._discoverTCPHandlerId);
        }
        if (this._exposeTCPHandlerId) {
            this._settings.disconnect(this._exposeTCPHandlerId);
        }
        this._settings = null;
    }
}

