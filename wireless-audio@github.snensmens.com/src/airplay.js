import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {execute} from './command.js';


export class AirPlayController {
    constructor() {
        this.moduleID = null;
        this.isEnabled = () => this.moduleID != null;
        
        // check if airplay-discovery-module is already loaded
        const enabledModulesQuery = execute('sh -c "pactl list modules short | grep module-raop-discover | awk \'{print $1}\'"');

        if (enabledModulesQuery.wasSuccessful) {
            if (enabledModulesQuery.result !== '') {
                this.moduleID = enabledModulesQuery.result.trim();
            }
        } else {
            console.log(`[gnome-wireless-audio-extension] failed to fetch loaded modules: ${enabledModulesQuery.error}`)
        }
    }

    enable() {
        if (!this.isEnabled()) {
            const enableAirPlayAttempt = execute('pactl load-module module-raop-discover');

            if (enableAirPlayAttempt.wasSuccessful) {
                this.moduleID = enableAirPlayAttempt.result;
            } else {
                console.error(enableAirPlayAttempt.error)
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
