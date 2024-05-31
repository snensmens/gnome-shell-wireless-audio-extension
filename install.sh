#! /bin/bash

zip -r -q airplay-audio@github.snensmens.com.zip airplay-audio@github.snensmens.com

gnome-extensions install airplay-audio@github.snensmens.com.zip --force

rm airplay-audio@github.snensmens.com.zip

echo "done"
