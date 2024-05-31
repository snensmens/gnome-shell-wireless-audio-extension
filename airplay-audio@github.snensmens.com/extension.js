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
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';


class AirPlay {
    enable() {
        if (this.isEnabled()) {
            console.log('"module-raop-discover" is already loaded - nothing to do')
        } else {
            const enableAirPlayAttempt = this._executeCommand('pactl load-module module-raop-discover');
            if (!enableAirPlayAttempt.wasSuccessful) {
                Main.notifyError('Enableing AirPlay failed !', enableAirPlayAttempt.error);
            }
        }
    }
    
    disable() {
        console.log(this._executeCommand('pactl unload-module module-raop-discover'));
    }
    
    /// check if "module-raop-discover" is already loaded
    isEnabled() {
        const enabledModulesQuery = this._executeCommand('pactl list modules');
        if (enabledModulesQuery.wasSuccessful) {
            return ( enabledModulesQuery.result.search("module-raop-discover") >= 0 );
        } else {
            
        }
    }
    
    checkDependencies () {
        const dependencyCheck = this._executeCommand("pactl --version");
        if (!dependencyCheck.wasSuccessful) {
            throw dependencyCheck.error;
        }
    }
    
    _executeCommand(command) {
        const result = GLib.spawn_command_line_sync(command);
        const decoder = new TextDecoder();
        
        return { 
            result: decoder.decode(result[1]),
            error: decoder.decode(result[2]),
            wasSuccessful: Object.keys(result[2]).length === 0
        }
    }
}
const airplay = new AirPlay();


const AirPlayQuickToggle = GObject.registerClass(
class AirPlayQuickToggle extends QuickToggle {
    constructor(path) {
        super({
            title: _('AirPlay'),
            toggleMode: true,
        });

        this.gicon = Gio.icon_new_for_string(`${path}/icons/hicolor/scalable/actions/speaker-wireless-symbolic.svg`);
    }
});


const AirPlayIndicator = GObject.registerClass(
class AirPlayIndicator extends SystemIndicator {
    constructor(path) {
        super();

        this._indicator = this._addIndicator();
        this._indicator.visible = false;

        const toggle = new AirPlayQuickToggle(path);
        toggle.checked = airplay.isEnabled();
        
        toggle.connect("notify::checked", () => {
            if (toggle.checked) {
                toggle.checked = airplay.enable().wasSuccessful;
            } else {
                airplay.disable();
            }
        });
            
        this.quickSettingsItems.push(toggle);
    }
});


export default class QuickSettingsAirPlayExtension extends Extension {
    enable() {
        airplay.checkDependencies()
        this._indicator = new AirPlayIndicator(this.path);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        airplay.disable();
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
    }
}
