import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {execute} from './command.js';


export class TCPDiscoverer {
    enable() {
        console.log("enable tcp discovery")
        if (!this.isEnabled()) {
            const enableTCPAttempt = execute('pactl load-module module-zeroconf-discover');
            if (!enableTCPAttempt.wasSuccessful) {
                Main.notifyError('Wireless Audio', `Failed to enable discovery: ${enableTCPAttempt.error}`);
            }
        }
    }
    
    disable() {
        console.log("disableing tcp discovery")
        execute('pactl unload-module module-zeroconf-discover');
    }
    
    isEnabled() {
        const enabledModulesQuery = execute('pactl list modules');
        if (enabledModulesQuery.wasSuccessful) {
            return (enabledModulesQuery.result.search("module-zeroconf-discover") >= 0);
        } else {
            console.log(`failed to fetch loaded modules: ${enabledModulesQuery.error}`)
        }
    }
}

export class TCP {
    enable() {}
    
    disable() {}
    
    isEnabled() {}
}
