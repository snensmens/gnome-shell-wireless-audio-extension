import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import {execute} from "../command.js";

export const GeneralSettings = GObject.registerClass({
    GTypeName: 'GeneralSettings',
    Template: GLib.uri_resolve_relative(import.meta.url, '../../resources/ui/settings_general.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'general_preferences',
        'show_icon',
        'enable_airplay',
        'enable_rtp_sending',
        'enable_rtp_receiving',
        'installation_hint',
    ],
}, class GeneralSettings extends Adw.PreferencesPage {
    constructor(settings, pactlInstalled) {
        super({});

        this.settings = settings;
        this.settings.bind('show-icon', this._show_icon, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.settings.bind('enable-airplay', this._enable_airplay, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.settings.bind('enable-rtp-sending', this._enable_rtp_sending, 'active', Gio.SettingsBindFlags.DEFAULT);
        this.settings.bind('enable-rtp-receiving', this._enable_rtp_receiving, 'active', Gio.SettingsBindFlags.DEFAULT);

        this.settings.connect('changed::enable-rtp-receiving', () => {
            this.showIpAddressIfEnabled();
        });

        this._general_preferences.visible = pactlInstalled;
        this._installation_hint.visible = !pactlInstalled;

        this.showIpAddressIfEnabled();
    }

    showIpAddressIfEnabled() {
        if(this.settings.get_boolean("enable-rtp-receiving")) {
            const fetchIpAdrress = execute(`sh -c "hostname -I | awk '{print $1}'"`);
            if(fetchIpAdrress.wasSuccessful) {
                this._enable_rtp_receiving.set_subtitle(`Verfügbar unter ${fetchIpAdrress.result.trim()}`);
            }
        } else {
            this._enable_rtp_receiving.set_subtitle("");
        }
    }
});
