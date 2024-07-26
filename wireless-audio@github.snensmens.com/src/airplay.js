import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {execute} from './command.js';


export class AirPlayController {
    constructor() {
        this.moduleId = null;
        this.isEnabled = () => this.moduleId != null;
        
        // check if airplay-discovery-module is already loaded
        const enabledModulesQuery = execute(`sh -c "pactl list modules short | grep module-raop-discover | awk '{print $1}'"`);

        if (enabledModulesQuery.wasSuccessful) {
            if (enabledModulesQuery.result !== '') {
                this.moduleId = enabledModulesQuery.result.trim();
            }
        }
    }

    enable() {
        if (!this.isEnabled()) {
            const enableAirPlayAttempt = execute('pactl load-module module-raop-discover');

            if (enableAirPlayAttempt.wasSuccessful) {
                this.moduleId = enableAirPlayAttempt.result;
            }
        }
    }
    
    disable() {
        if (this.isEnabled()) {
            execute(`pactl unload-module ${this.moduleId}`);
            this.moduleId = null;
        }
    }
}
