import Json from 'gi://Json';

import {execute} from './command.js';


export class RtpReceiveController {
    constructor() {
        this.moduleId = null;
        this.isEnabled = () => this.moduleId != null;
    }

    /**
     * load a rtp-receive module to receive audio on this device
     * */
    enable() {
        if(!this.isEnabled()) {
            const enableRtpReceivingAttempt = execute(`pactl load-module module-rtp-recv latency_msec=15 sap_address=0.0.0.0`);
            if(enableRtpReceivingAttempt.wasSuccessful) {
                this.moduleId = enableRtpReceivingAttempt.result;
            }
        }
    }

    /**
     * unload the created module
     * */
    disable() {
        if(this.isEnabled()) {
            execute(`pactl unload-module ${this.moduleId}`);
        }
    }
}


export class RtpSendController {
    constructor(settings) {
        this.settings = settings;
        this.groups = [];
    }

    /**
     * enable rtp sending
     * this only loads a null-sink for each group that is shown in the sound-output-chooser.
     * the devices get loaded when the sink is actually selected as output.
     * */
    enable() {
        this.groups = [];
        
        const rtpSettings = JSON.parse(Json.to_string(Json.gvariant_serialize(this.settings.get_value("rtp-devices")), false));

        // rtpSettings.groups can be undefined when no groups are defined by the user
        if(rtpSettings.groups) {
            rtpSettings.groups.forEach((group) => {
                this.groups.push(new RtpGroup({
                    name: group.name,
                    devices: group.devices
                }));
            });
        }
        
        this.groups.forEach((group) => {
            group.load();
        });
    }

    /**
     * disable rtp sending completely
     * */
    disable() {
        this.groups.forEach((group) => {
            group.unload();
            group = null;
        });
        this.groups = [];
    }

    /**
     * check for every group if it is currently selected as sound output.
     * if a group is not selected, make sure its devices are not loaded.
     * */
    enableGroupIfActive(defaultSink) {
        this.groups.forEach((group) => {
            group.moduleName === defaultSink ? group.loadDevices() : group.unloadDevices()
        });
    }
}


class RtpGroup {
    constructor({name, devices}) {
        this.name = name;
        this.moduleName = name.replace(/\s+/g, '');
        this.moduleId = null;
        this.isEnabled = () => this.moduleId != null;
        
        this.devices = devices.map((device) => new RtpDevice({
            monitor: this.moduleName,
            address: device.address
        }));
    }

    /**
     * create a null-sink with the name of the group
     * this is what is presented to the user in the sound-output-chooser
     * rtp devices will get their audio from the monitor of this sink
     * */
    load() {
        if(!this.isEnabled()) {
            const loadModuleAttempt = execute(`pactl load-module module-null-sink sink_name="${this.moduleName}" sink_properties="'device.description=\\"${this.name}\\"'"`);
            if(loadModuleAttempt.wasSuccessful) {
                this.moduleId = loadModuleAttempt.result;
            }
        }
    }

    /**
     * load a rtp-send module for each device of the group
     * */
    loadDevices() {
        if(this.isEnabled()) {
            this.devices.forEach(device => device.load());
        }
    }

    /**
     * unload the modules of all devices and the null-module of the group itself
     * */
    unload() {
        this.unloadDevices();

        if(this.isEnabled()) {
            execute(`pactl unload-module ${this.moduleId}`);
            this.moduleId = null;
        }
    }

    /**
     * unload the rtp-send modules of every device
     * */
    unloadDevices() {
        this.devices.forEach(device => device.unload());
    }
}


class RtpDevice {
    constructor({monitor, address}) {
        this.monitor = monitor;
        this.address = address;
        this.moduleId = null;
        this.isEnabled = () => this.moduleId != null;
    }

    /**
     * load a rtp-send module for the device. the audio is taken from the monitor of the groups null-module
     * */
    load() {
        if(!this.isEnabled()) {
            const loadRtpSendModuleAttempt = execute(`pactl load-module module-rtp-send source="${this.monitor}".monitor destination_ip=${this.address}`);
            if(loadRtpSendModuleAttempt.wasSuccessful) {
                this.moduleId = loadRtpSendModuleAttempt.result;
            }
        }
    }

    /**
     * unload the created rtp-send module
     * */
    unload() {
        if(this.isEnabled()) {
            const unloadModuleAttempt = execute(`pactl unload-module ${this.moduleId}`);
            if(unloadModuleAttempt.wasSuccessful) {
                this.moduleId = null;
            }
        }
    }
}