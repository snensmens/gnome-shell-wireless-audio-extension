import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';


export const RTPSettings = GObject.registerClass({
    GTypeName: 'RTPSettings',
    Template: GLib.uri_resolve_relative(import.meta.url, '../../resources/ui/settings_rtp.ui', GLib.UriFlags.NONE),
    InternalChildren: [
    ],
}, class RTPSettings extends Adw.PreferencesPage {
    constructor(preferences) {
        super({});
        console.log("++++++", import.meta.url)
        this.preferences = preferences;
    }
});
