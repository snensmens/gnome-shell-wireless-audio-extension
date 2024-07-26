#! /bin/bash

sh pack.sh

gnome-extensions install wireless-audio@github.snensmens.com.shell-extension.zip --force
rm wireless-audio@github.snensmens.com.shell-extension.zip
