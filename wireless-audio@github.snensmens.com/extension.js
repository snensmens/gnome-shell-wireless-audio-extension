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

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

import {AirPlayController} from './src/airplay.js';
import {RtpSendController, RtpReceiveController} from './src/rtp.js';
import {PactlController} from "./src/pactl.js";


const WirelessAudioQuickToggle = GObject.registerClass(
class WirelessAudioQuickToggle extends QuickToggle {
    constructor(icon) {
        super({
            title: _("Wireless Audio"),
            toggleMode: true
        });
        
        this.gicon = icon;
    }
});


const WirelessAudioIndicator = GObject.registerClass(
class WirelessAudioIndicator extends SystemIndicator {
    constructor(showIconInTopbar, icon) {
        super();

        this._indicator = this._addIndicator();
        this._indicator.gicon = icon;
        
        this.toggle = new WirelessAudioQuickToggle(icon);

        this.visible = showIconInTopbar && this.toggle.checked;
        this.quickSettingsItems.push(this.toggle);
    }
});


export default class QuickSettingsAirPlayExtension extends Extension {
    enable() {
        this._toggle_checked_signal = null;
        this._show_icon_signal = null;
        this._enable_airplay_signal = null;
        this._enable_rtp_sending_signal = null;
        this._enable_rtp_receiving_signal = null;
        this._rtp_devices_changed_signal = null;
        this.checkDefaultSinkInterval = null;

        this._appIcon = Gio.icon_new_for_string(`${this.path}/resources/icons/hicolor/scalable/actions/speaker-wireless-symbolic.svg`);
        this._settings = this.getSettings();

        this.pactl = new PactlController();
        this.airplay = new AirPlayController();
        this.rtpSend = new RtpSendController(this._settings);
        this.rtpReceive = new RtpReceiveController();

        this._indicator = new WirelessAudioIndicator(this._settings.get_boolean("show-icon"), this._appIcon);
        this.toggle = this._indicator.toggle;

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        if( this.pactl.isInstalled() ) {

            // observe the toggle state
            this._toggle_checked_signal = this.toggle.connect("notify::checked", () => {
                this.toggle.checked && this._settings.get_boolean("show-icon") ?
                    this.showTopbarIcon() : this.hideTopbarIcon();

                this.toggle.checked && this._settings.get_boolean("enable-airplay") ?
                    this.airplay.enable() : this.airplay.disable();

                this.toggle.checked && this._settings.get_boolean("enable-rtp-sending") ?
                    this.enableRtpSend() : this.disableRtpSend();

                this.toggle.checked && this._settings.get_boolean("enable-rtp-receiving") ?
                    this.enableRtpReceive() : this.disableRtpReceive();
            });

            // observe the states of the settings
            this._show_icon_signal = this._settings.connect("changed::show-icon", () => {
                this._settings.get_boolean("show-icon") && this.toggle.checked ?
                    this.showTopbarIcon() : this.hideTopbarIcon();
            });

            this._enable_airplay_signal = this._settings.connect("changed::enable-airplay", () => {
                this._settings.get_boolean("enable-airplay") && this.toggle.checked ?
                    this.airplay.enable() : this.airplay.disable();
            });

            this._enable_rtp_sending_signal = this._settings.connect("changed::enable-rtp-sending", () => {
                this._settings.get_boolean("enable-rtp-sending") && this.toggle.checked ?
                    this.enableRtpSend() : this.disableRtpSend();
            });

            this._enable_rtp_receiving_signal = this._settings.connect("changed::enable-rtp-receiving", () => {
                this._settings.get_boolean("enable-rtp-receiving") && this.toggle.checked ?
                    this.enableRtpReceive() : this.disableRtpReceive();
            });

            this._rtp_devices_changed_signal = this._settings.connect("changed::rtp-devices", () => {
                if(this.toggle.checked) {
                    this.rtpSend.disable();
                    this.rtpSend.enable();
                }
            });
        }
    }

    createDefaultSinkObserver() {
        return setInterval(() => this.rtpSend.enableGroupIfActive(this.pactl.getDefaultSink()), 500);
    }

    enableRtpSend() {
        this.rtpSend.enable();
        this.checkDefaultSinkInterval = this.createDefaultSinkObserver();
    }

    disableRtpSend() {
        if(this.checkDefaultSinkInterval) {
            clearInterval(this.checkDefaultSinkInterval);
        }
        this.checkDefaultSinkInterval = null;
        this.rtpSend.disable();
    }

    enableRtpReceive() {
        this.rtpReceive.enable();
        Main.osdWindowManager.show(-1, this._appIcon, _("Your Device is now available as audio receiver"), null, null);
    }

    disableRtpReceive() {
        this.rtpReceive.disable();
    }

    showTopbarIcon() {
        this._indicator.visible = true;
    }

    hideTopbarIcon() {
        this._indicator.visible = false;
    }

    disable() {
        // clear the interval if its running
        if(this.checkDefaultSinkInterval) {
            clearInterval(this.checkDefaultSinkInterval);
            this.checkDefaultSinkInterval = null;
        }

        // disconnect signals
        if (this._toggle_checked_signal) {
            this.toggle.disconnect(this._toggle_checked_signal);
            this._toggle_checked_signal = null;
        }
        if (this._show_icon_signal) {
            this._settings.disconnect(this._show_icon_signal);
            this._show_icon_signal = null;
        }
        if (this._enable_airplay_signal) {
            this._settings.disconnect(this._enable_airplay_signal);
            this._enable_airplay_signal = null;
        }
        if (this._enable_rtp_sending_signal) {
            this._settings.disconnect(this._enable_rtp_sending_signal);
            this._enable_rtp_sending_signal = null;
        }
        if (this._enable_rtp_receiving_signal) {
            this._settings.disconnect(this._enable_rtp_receiving_signal);
            this._enable_rtp_receiving_signal = null;
        }
        if (this._rtp_devices_changed_signal) {
            this._settings.disconnect(this._rtp_devices_changed_signal);
            this._rtp_devices_changed_signal = null;
        }

        // disable all controllers
        this.airplay.disable();
        this.rtpSend.disable();
        this.rtpReceive.disable();

        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        
        this.pactl = null;
        this.airplay = null;
        this.rtpSend = null;
        this._settings = null;
        this._appIcon = null;
    }
}

