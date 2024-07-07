import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

export const GeneralSettings = GObject.registerClass({
    GTypeName: 'GeneralSettings',
    Template: GLib.uri_resolve_relative(import.meta.url, '../../resources/ui/settings_general.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'show_icon',
    ],
}, class GeneralSettings extends Adw.PreferencesPage {
    constructor(settings) {
        super({});

        this.settings = settings;
        
        this.settings.bind('show-icon', this._show_icon, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
});
