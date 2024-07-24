import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Json from 'gi://Json';


export const RTPSettings = GObject.registerClass({
    GTypeName: 'RTPSettings',
    Template: GLib.uri_resolve_relative(import.meta.url, '../../resources/ui/settings_rtp.ui', GLib.UriFlags.NONE),
    InternalChildren: [
        'control',
        'add_group_button',
    ],
}, class RTPSettings extends Adw.PreferencesPage {
    constructor(settings) {
        super({});
        
        this.groups = [];
        
        this.settings = settings;
        
        this._add_group_button.connect("activated", () => {
            this.showInputDialog({
                heading: "Add new group",
                body: "The groupname will be shown in the sound-output-chooser",
                label: "Groupname",
                onConfirm: (name) => {
                    this.addRtpGroup({
                        name: name
                    });
                    this.saveConfiguration();
                }
            });
        });
        
        const rtpSettings = JSON.parse( Json.to_string(Json.gvariant_serialize(this.settings.get_value("rtp-devices")), false) );
        
        rtpSettings.groups.forEach((group) => {
            this.addRtpGroup({
                name: group.name,
                devices: group.devices
            });
        });

    }

    addRtpGroup({name, devices}) {
        const group = new RtpGroup({
            name: name,
            devices: devices ? devices : [],
            onAddDevice: (self) => this.showDeviceDialog({
                heading: "Add device",
                body: `Add a new device to ${self.name}`,
                onConfirm: (device) => {
                    self.addDevice(device);
                    this.saveConfiguration();
                }
            }),
            onEditGroup: (self) => this.showInputDialog({
                heading: "Edit group",
                body: "Edit Groupname",
                label: "Groupname",
                text: self.name,
                onConfirm: (editedName) => {
                    self.setName(editedName);
                    this.saveConfiguration();
                }
            }),
            onEditDevice: (device) => this.showDeviceDialog({
                heading: "Edit device",
                body: "Edit device properties",
                name: device.name,
                address: device.address,
                onConfirm: (changed) => {
                    device.setName(changed.name);
                    device.setAddress(changed.address);
                    this.saveConfiguration();
                }
            }),
            onGroupDeleted: (group) => this.deleteGroup(group),
            onDeviceDeleted: () => this.saveConfiguration()
        });
        
        this.groups.push(group);
        this.add(group);
    }
    
    deleteGroup(group) {
        this.remove(group);
        this.groups = this.groups.filter(item => item !== group)
        this.saveConfiguration();
    }
    
    saveConfiguration() {
        this.settings.set_value("rtp-devices", Json.gvariant_deserialize(
            Json.from_string(JSON.stringify({groups: this.groups})),
            null
        ));
    }
    
    showInputDialog({heading, body, label, text, onConfirm}) {
        const dialog = new Adw.AlertDialog({
            heading: heading,
            body: body,
            close_response: "cancel",
        });
        
        const box = new Gtk.ListBox();
        box.add_css_class("boxed-list");
        dialog.set_extra_child(box);
        
        const inputField = new Adw.EntryRow({
            title: label,
            text: text ? text : ""
        });
        
        inputField.connect("changed", () => {
            dialog.set_response_enabled("confirm", this.isValidInput(inputField.get_text()));
        });
        box.append(inputField);
        
        dialog.add_response("cancel", "Cancel");
        dialog.add_response("confirm", "Confirm");
        dialog.set_response_appearance("confirm", Adw.ResponseAppearance.SUGGESTED);
        dialog.set_response_enabled("confirm", false);
        
        dialog.connect("response", (_, result) => {
            if(result === "confirm") {
                onConfirm(inputField.get_text());
            }
        });
        
        dialog.choose(this, null, null);
    }
    
    showDeviceDialog({heading, body, name, address, onConfirm}) {
        const dialog = new Adw.AlertDialog({
            heading: heading,
            body: body,
            close_response: "cancel",
        });
        
        const box = new Gtk.ListBox();
        box.add_css_class("boxed-list");
        dialog.set_extra_child(box);
        
        const nameField = new Adw.EntryRow({
            title: "Devicename",
            text: name ? name : ""
        });
        box.append(nameField);
        
        const addressField = new Adw.EntryRow({
            title: "IP-Address",
            text: address ? address : ""
        });
        box.append(addressField);
        
        nameField.connect("changed", () => {
            dialog.set_response_enabled("confirm", this.isValidInput(nameField.get_text()) && this.isValidInput(addressField.get_text()));
        });
        
        addressField.connect("changed", () => {
            dialog.set_response_enabled("confirm", this.isValidInput(nameField.get_text()) && this.isValidInput(addressField.get_text()));
        });
        
        dialog.add_response("cancel", "Cancel");
        dialog.add_response("confirm", "Confirm");
        dialog.set_response_appearance("confirm", Adw.ResponseAppearance.SUGGESTED);
        dialog.set_response_enabled("confirm", false);
        
        dialog.connect("response", (_, result) => {
            if(result === "confirm") {
                onConfirm({
                    name: nameField.get_text(),
                    address: addressField.get_text()
                });
            }
        });
        
        dialog.choose(this, null, null);
    }
    
    isValidInput(input) {
        return input.trim() !== "" && !input.includes("'") && !input.includes("\\") && !input.includes("\"")
    }
});

const RtpGroup = GObject.registerClass({
        GTypeName: 'RtpGroup',
        InternalChildren: [],
    }, class RtpGroup extends Adw.PreferencesGroup {
        constructor({name, devices, onAddDevice, onEditGroup, onEditDevice, onGroupDeleted, onDeviceDeleted}) {
            super({
                title: name
            });
            
            this.name = name;
            this.devices = [];
            this.onEditDevice = onEditDevice;
            this.onDeviceDeleted = onDeviceDeleted;
            
            const box = new Gtk.Box();
            box.add_css_class("linked");
            this.set_header_suffix(box);
            
            const addButton = new Gtk.Button({icon_name: "list-add-symbolic", halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER});
            addButton.connect("clicked", () => onAddDevice(this));
            box.append(addButton);
            
            const editButton = new Gtk.Button({icon_name: "edit-symbolic", halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER});
            editButton.connect("clicked", () => onEditGroup(this));
            box.append(editButton);
            
            const deleteButton = new Gtk.Button({icon_name: "edit-delete-symbolic", halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER});
            deleteButton.connect("clicked", () => onGroupDeleted(this));
            box.append(deleteButton);
            
            devices.forEach((device) => {
                this.addDevice({
                    name: device.name,
                    address: device.address,
                });
            });
        }
        
        setName(name) {
            this.name = name;
            this.set_title(name);
        }
        
        addDevice({name, address}) {
            const device = new RtpDevice({
                name: name,
                address: address,
                onEdit: (device) => this.onEditDevice(device),
                onDelete: (device) => this.deleteDevice(device)
            });
            
            this.devices.push(device);
            this.add(device);
        }
        
        deleteDevice(device) {
            this.devices = this.devices.filter(item => item !== device)
            this.remove(device);
            
            this.onDeviceDeleted();
        }
        
        toJSON() {
            return {
                name: this.name,
                devices: this.devices
            };
        }
});


const RtpDevice = GObject.registerClass({
        GTypeName: 'RtpDevice',
        InternalChildren: [],
    }, class RtpDevice extends Adw.ActionRow {
        constructor({name, address, onEdit, onDelete}) {
            super({
                title: name,
                subtitle: address
            });
            
            this.name = name;
            this.address = address;
            
            const editButton = new Gtk.Button({icon_name: "edit-symbolic", halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER});
            editButton.connect("clicked", () => onEdit(this));
            this.add_suffix(editButton);
            
            const deleteButton = new Gtk.Button({icon_name: "edit-delete-symbolic", halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER})
            deleteButton.connect("clicked", () => onDelete(this));
            this.add_suffix(deleteButton);
        }
        
        setName(name) {
            this.name = name;
            this.set_title(name);
        }
        
        setAddress(address) {
            this.address = address;
            this.set_subtitle(address);
        }
        
        toJSON() {
            return {
                name: this.name,
                address: this.address
            };
        }
    });