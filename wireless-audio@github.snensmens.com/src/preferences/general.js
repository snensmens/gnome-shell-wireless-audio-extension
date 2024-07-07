import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

export const GeneralSettings = GObject.registerClass({
    GTypeName: 'GeneralSettings',
    Template: GLib.uri_resolve_relative(import.meta.url, '../../resources/ui/settings_general.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'general_preferences',
        'show_icon',
        'installation_hint',
    ],
}, class GeneralSettings extends Adw.PreferencesPage {
    constructor(settings, pactlInstalled) {
        super({});

        this.settings = settings;
        this.settings.bind('show-icon', this._show_icon, 'active', Gio.SettingsBindFlags.DEFAULT);

        this._general_preferences.visible = pactlInstalled;
        this._installation_hint.visible = !pactlInstalled;
    }
});
