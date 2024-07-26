import Json from 'gi://Json';

import {execute} from './command.js';


export class RtpReceiveController {
    constructor() {
        this.moduleId = null;
        this.isEnabled = () => this.moduleId != null;
    }
    
    enable() {
        if(!this.isEnabled()) {
            const enableRtpReceivingAttempt = execute(`pactl load-module module-rtp-recv latency_msec=15 sap_address=0.0.0.0`);
            if(enableRtpReceivingAttempt.wasSuccessful) {
                this.moduleId = enableRtpReceivingAttempt.result;
            }
        }
    }
    
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
    
    enable() {
        this.groups = [];
        
        const rtpSettings = JSON.parse(Json.to_string(Json.gvariant_serialize(this.settings.get_value("rtp-devices")), false));

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
    
    disable() {
        this.groups.forEach((group) => {
            group.unload();
            group = null;
        });
        this.groups = [];
    }

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
    
    load() {
        if(!this.isEnabled()) {
            const loadModuleAttempt = execute(`pactl load-module module-null-sink sink_name="${this.moduleName}" sink_properties="'device.description=\\"${this.name}\\"'"`);
            if(loadModuleAttempt.wasSuccessful) {
                this.moduleId = loadModuleAttempt.result;
            }
        }
    }

    loadDevices() {
        if(this.isEnabled()) {
            this.devices.forEach(device => device.load());
        }
    }

    unload() {
        this.unloadDevices();

        if(this.isEnabled()) {
            execute(`pactl unload-module ${this.moduleId}`);
            this.moduleId = null;
        }
    }

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

    load() {
        if(!this.isEnabled()) {
            const loadRtpSendModuleAttempt = execute(`pactl load-module module-rtp-send source="${this.monitor}".monitor destination_ip=${this.address}`);
            if(loadRtpSendModuleAttempt.wasSuccessful) {
                this.moduleId = loadRtpSendModuleAttempt.result;
            }
        }
    }
    
    unload() {
        if(this.isEnabled()) {
            const unloadModuleAttempt = execute(`pactl unload-module ${this.moduleId}`);
            if(unloadModuleAttempt.wasSuccessful) {
                this.moduleId = null;
            }
        }
    }
}