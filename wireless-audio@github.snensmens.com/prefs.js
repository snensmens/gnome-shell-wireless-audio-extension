import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WirelessAudioPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a preferences page, with a single group
        const generalSettingsPage = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(generalSettingsPage);
        
        const generalGroup = new Adw.PreferencesGroup({
            title: _('General Settings'),
        });
        generalSettingsPage.add(generalGroup);
        const activateOnStartup = new Adw.SwitchRow({
            title: _('Activate Wireless Audio on Startup'),
        });
        generalGroup.add(activateOnStartup);
        const showTopbarIcon = new Adw.SwitchRow({
            title: _('Display Icon in Topbar'),
        });
        generalGroup.add(showTopbarIcon);
        
        const discoveringGroup = new Adw.PreferencesGroup({
            title: _('Discovering'),
            description: _('Select the services you want to discover'),
        });
        generalSettingsPage.add(discoveringGroup);

        const discoverAirplay = new Adw.SwitchRow({
            title: _('Discover AirPlay devices'),
        });
        discoveringGroup.add(discoverAirplay);
        
        const discoverTCP = new Adw.SwitchRow({
            title: _('Discover devices exposed as audio receivers'),
        });
        discoveringGroup.add(discoverTCP);
        
        const receivingGroup = new Adw.PreferencesGroup({
            title: _('Receiving'),
            description: _('Select if you want to expose this device as audio receiver'),
        });
        generalSettingsPage.add(receivingGroup);
        
        const exposeTCP = new Adw.SwitchRow({
            title: _('Make this device discoverable as audio receiver'),
            subtitle: _('Your Device will be discoverable in your local Network')
        });
        receivingGroup.add(exposeTCP);
        
        // Create a settings object and bind the row to the `show-indicator` key
        window._settings = this.getSettings();
        window._settings.bind('activate-on-startup', activateOnStartup, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-topbar-icon', showTopbarIcon, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('discover-airplay', discoverAirplay, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('discover-tcp', discoverTCP, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('expose-tcp', exposeTCP, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}
