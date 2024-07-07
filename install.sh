#! /bin/bash

blueprint-compiler compile ./resources/blueprints/settings_general.blp --output ./wireless-audio@github.snensmens.com/resources/ui/settings_general.ui

zip -r -q wireless-audio@github.snensmens.com.zip wireless-audio@github.snensmens.com
gnome-extensions install wireless-audio@github.snensmens.com.zip --force
rm wireless-audio@github.snensmens.com.zip

echo "installation done"
