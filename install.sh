#! /bin/bash

zip -r -q wireless-audio@github.snensmens.com.zip wireless-audio@github.snensmens.com

gnome-extensions install wireless-audio@github.snensmens.com.zip --force

rm wireless-audio@github.snensmens.com.zip

echo "done"
