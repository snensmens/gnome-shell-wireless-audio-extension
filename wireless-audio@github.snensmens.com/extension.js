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
    constructor(showIconInTopBar, icon) {
        super();

        this._indicator = this._addIndicator();
        this._indicator.gicon = icon;
        
        this.toggle = new WirelessAudioQuickToggle(icon);

        this.visible = showIconInTopBar && this.toggle.checked;
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
        this._checkDefaultSinkInterval = null;

        this._appIcon = Gio.icon_new_for_string(`${this.path}/resources/icons/hicolor/scalable/actions/speaker-wireless-symbolic.svg`);
        this._settings = this.getSettings();

        this._pactl = new PactlController();
        this._airplay = new AirPlayController();
        this._rtpSend = new RtpSendController(this._settings);
        this._rtpReceive = new RtpReceiveController();

        this._indicator = new WirelessAudioIndicator(this._settings.get_boolean("show-icon"), this._appIcon);
        this._toggle = this._indicator.toggle;

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        if(this._pactl.isInstalled()) {

            // observe the toggle state
            this._toggle_checked_signal = this._toggle.connect("notify::checked", () => {
                this._toggle.checked && this._settings.get_boolean("show-icon") ?
                    this.showTopbarIcon() : this.hideTopbarIcon();

                this._toggle.checked && this._settings.get_boolean("enable-airplay") ?
                    this._airplay.enable() : this._airplay.disable();

                this._toggle.checked && this._settings.get_boolean("enable-rtp-sending") ?
                    this.enableRtpSend() : this.disableRtpSend();

                this._toggle.checked && this._settings.get_boolean("enable-rtp-receiving") ?
                    this.enableRtpReceive() : this.disableRtpReceive();
            });

            // observe the states of the settings
            this._show_icon_signal = this._settings.connect("changed::show-icon", () => {
                this._settings.get_boolean("show-icon") && this._toggle.checked ?
                    this.showTopbarIcon() : this.hideTopbarIcon();
            });

            this._enable_airplay_signal = this._settings.connect("changed::enable-airplay", () => {
                this._settings.get_boolean("enable-airplay") && this._toggle.checked ?
                    this._airplay.enable() : this._airplay.disable();
            });

            this._enable_rtp_sending_signal = this._settings.connect("changed::enable-rtp-sending", () => {
                this._settings.get_boolean("enable-rtp-sending") && this._toggle.checked ?
                    this.enableRtpSend() : this.disableRtpSend();
            });

            this._enable_rtp_receiving_signal = this._settings.connect("changed::enable-rtp-receiving", () => {
                this._settings.get_boolean("enable-rtp-receiving") && this._toggle.checked ?
                    this.enableRtpReceive() : this.disableRtpReceive();
            });

            this._rtp_devices_changed_signal = this._settings.connect("changed::rtp-devices", () => {
                if(this._toggle.checked) {
                    this._rtpSend.disable();
                    this._rtpSend.enable();
                }
            });
        }
    }

    /*
    * sometimes audio over rtp is still playing even if the sink is not selected as output anymore.
    * as a get-around we periodically check the current default sink to deactivate rtp sinks when they are not selected anymore.
    * */
    createDefaultSinkObserver() {
        return setInterval(() => this._rtpSend.enableGroupIfActive(this._pactl.getDefaultSink()), 500);
    }

    enableRtpSend() {
        this._rtpSend.enable();
        this._checkDefaultSinkInterval = this.createDefaultSinkObserver();
    }

    disableRtpSend() {
        if(this._checkDefaultSinkInterval) {
            clearInterval(this._checkDefaultSinkInterval);
        }
        this.checkDefaultSinkInterval = null;

        this._rtpSend.disable();
    }

    enableRtpReceive() {
        this._rtpReceive.enable();
        Main.osdWindowManager.show(-1, this._appIcon, _("Your Device is now available as audio receiver"), null, null);
    }

    disableRtpReceive() {
        this._rtpReceive.disable();
    }

    showTopbarIcon() {
        this._indicator.visible = true;
    }

    hideTopbarIcon() {
        this._indicator.visible = false;
    }

    disable() {
        // clear the interval if its running
        if(this._checkDefaultSinkInterval) {
            clearInterval(this._checkDefaultSinkInterval);
            this._checkDefaultSinkInterval = null;
        }

        // disconnect signals
        if (this._toggle_checked_signal) {
            this._toggle.disconnect(this._toggle_checked_signal);
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
        this._airplay.disable();
        this._rtpSend.disable();
        this._rtpReceive.disable();

        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        
        this._pactl = null;
        this._airplay = null;
        this._rtpSend = null;
        this._settings = null;
        this._appIcon = null;
    }
}

