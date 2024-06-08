import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {execute} from './command.js';


export class RtpSendController {
    constructor(settings) {
        this.moduleID = null;
        this.isEnabled = () => this.moduleID != null;

        settings.connect('changed::enable-rtp-streaming', () => {
            settings.get_boolean('enable-rtp-streaming') && settings.get_boolean('active') ? this.enable() : this.disable();
        });

        settings.connect('changed::active', () => {
            settings.get_boolean('enable-rtp-streaming') && settings.get_boolean('active') ? this.enable() : this.disable();
        });

        if (settings.get_boolean('enable-rtp-streaming') && settings.get_boolean('active')) {
            this.enable();
        }
    }

    enable() {
        if (!this.isEnabled()) {
            const enableRtpSendAttempt = execute('');
        }
    }

    disable() {

    }
}


export class RtpReceiveController {
    constructor(settings) {
        this.moduleID = null;
        this.isEnabled = () => this.moduleID != null;

        settings.connect('changed::enable-rtp-receiving', () => {
            settings.get_boolean('enable-rtp-receiving') && settings.get_boolean('active') ? this.enable() : this.disable();
        });

        settings.connect('changed::active', () => {
            settings.get_boolean('enable-rtp-receiving') && settings.get_boolean('active') ? this.enable() : this.disable();
        });

        if (settings.get_boolean('enable-rtp-receiving') && settings.get_boolean('active')) {
            this.enable();
        }
    }

    enable() {
        if (!this.isEnabled()) {
            const enableRtpReceiveAttempt = execute('pactl load-module module-rtp-recv latency_msec=15 sap_address=0.0.0.0');
            if (enableRtpReceiveAttempt.wasSuccessful) {
                this.moduleID = enableRtpReceiveAttempt.result.trim();
            }
        }
    }

    disable() {
        if (this.isEnabled()) {
            execute(`pactl unload-module ${this.moduleID}`);
            this.moduleID = null;
        }
    }
}
