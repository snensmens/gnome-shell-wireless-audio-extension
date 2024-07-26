#!/bin/bash

BLUEPRINTS_DIR="resources/blueprints"
EXTENSION_DIR="wireless-audio@github.snensmens.com"

blueprint-compiler compile "$BLUEPRINTS_DIR"/settings_general.blp --output "$EXTENSION_DIR"/resources/ui/settings_general.ui
blueprint-compiler compile "$BLUEPRINTS_DIR"/settings_rtp.blp --output "$EXTENSION_DIR"/resources/ui/settings_rtp.ui

cd "$EXTENSION_DIR"
gnome-extensions pack --force --extra-source=resources/ --extra-source=src/
mv "$EXTENSION_DIR".shell-extension.zip ../