import GObject from 'gi://GObject';
import Json from 'gi://Json';

import {execute} from './command.js';


export class RtpReceiveController {
    constructor() {
        this.moduleId = null;
    }
    
    enable() {
        const enableRtpReceivingAttempt = execute(`pactl load-module module-rtp-recv latency_msec=15 sap_address=0.0.0.0`);
        if(enableRtpReceivingAttempt.wasSuccessful) {
            this.moduleId = enableRtpReceivingAttempt.result;
        }
    }
    
    disable() {
        if(this.moduleId) {
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
        
        rtpSettings.groups.forEach((group) => {
            this.groups.push(new RtpGroup({
                name: group.name,
                devices: group.devices
            }));
        });
        
        this.groups.forEach((group) => {
            group.load();
        });
    }
    
    disable() {
        this.groups.forEach((group) => {
            group.unload();
        });
    }
}

class RtpGroup {
    constructor({name, devices}) {
        this.name = name;
        this.moduleName = name.replace(/\s+/g, '');
        this.moduleId = null;
        
        this.devices = devices.map((device) => new RtpDevice({
            monitor: this.moduleName,
            address: device.address
        }));
    }
    
    load() {
        const loadModuleAttempt = execute(`pactl load-module module-null-sink sink_name="${this.moduleName}" sink_properties="'device.description=\\"${this.name}\\"'"`);
        if(loadModuleAttempt.wasSuccessful) {
            this.moduleId = loadModuleAttempt.result;
            
            this.devices.forEach(device => device.load());
        }
    }
    
    unload() {
        this.devices.forEach(device => device.unload());
        
        if(this.moduleId) {
            execute(`pactl unload-module ${this.moduleId}`);
        }
    }
}


class RtpDevice {
    constructor({monitor, address}) {
        this.monitor = monitor;
        this.address = address;
        this.moduleId = null;
    }
    
    load() {
        const loadRtpSendModuleAttempt = execute(`pactl load-module module-rtp-send source="${this.monitor}".monitor destination_ip=${this.address}`);
        if(loadRtpSendModuleAttempt.wasSuccessful) {
            this.moduleId = loadRtpSendModuleAttempt.result;
        }
    }
    
    unload() {
        if(this.moduleId) {
            execute(`pactl unload-module ${this.moduleId}`);
        }
    }
}