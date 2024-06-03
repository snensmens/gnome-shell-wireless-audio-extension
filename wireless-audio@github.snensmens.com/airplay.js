import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {execute} from './command.js';


export class AirPlayController {
    enable() {
        console.log("enable airplay discovery")
        if (!this.isEnabled()) {
            const enableAirPlayAttempt = execute('pactl load-module module-raop-discover');
            if (!enableAirPlayAttempt.wasSuccessful) {
                Main.notifyError('Wireless Audio', `Failed to enable AirPlay discovery: ${enableAirPlayAttempt.error}`);
            }
        }
    }
    
    disable() {
        console.log("disableing airplay discovery")
        execute('pactl unload-module module-raop-discover');
    }
    
    isEnabled() {
        const enabledModulesQuery = execute('pactl list modules');
        if (enabledModulesQuery.wasSuccessful) {
            return (enabledModulesQuery.result.search("module-raop-discover") >= 0);
        } else {
            console.log(`failed to fetch loaded modules: ${enabledModulesQuery.error}`)
        }
    }
}
