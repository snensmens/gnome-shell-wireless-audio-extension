import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {execute} from './command.js';


export class AirPlayController {
    constructor(settings) {
        this.moduleID = null;
        this.isEnabled = () => this.moduleID != null;
        
        // check if airplay-discovery is already activated
        const enabledModulesQuery = execute('sh -c "pactl list modules short | grep module-raop-discover | awk \'{print $1}\'"');
        if (enabledModulesQuery.wasSuccessful) {
            if (enabledModulesQuery.result !== '') {
                this.moduleID = enabledModulesQuery.result.trim();
            }
        } else {
            console.log(`failed to fetch loaded modules: ${enabledModulesQuery.error}`)
        }
        
        settings.connect('changed::enable-airplay', () => {
            settings.get_boolean('enable-airplay') && settings.get_boolean('active') ? this.enable() : this.disable();
        });
        
        settings.connect('changed::active', () => {
            settings.get_boolean('enable-airplay') && settings.get_boolean('active') ? this.enable() : this.disable();
        });
        
        if (settings.get_boolean('enable-airplay') && settings.get_boolean('active')) {
            this.enable();
        }
    }

    enable() {
        if (!this.isEnabled()) {
            const enableAirPlayAttempt = execute('pactl load-module module-raop-discover');
            if (!enableAirPlayAttempt.wasSuccessful) {
                Main.notifyError('Wireless Audio', `Failed to enable AirPlay discovery: ${enableAirPlayAttempt.error}`);
            }
            else {
                this.moduleID = enableAirPlayAttempt.result;
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
