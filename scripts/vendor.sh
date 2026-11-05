#!/usr/bin/env bash
# Naplní public/vendor/: OpenSCAD WASM (oficiální snapshot, ověřený SHA-256),
# three.js a fflate z node_modules. Spouštět z kořene projektu po `npm install`.
set -euo pipefail

OPENSCAD_VERSION="${OPENSCAD_VERSION:-2026.11.01}"
ZIP="OpenSCAD-${OPENSCAD_VERSION}-WebAssembly-web.zip"
URL="https://files.openscad.org/snapshots/${ZIP}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl -sSfL -o "$tmp/$ZIP" "$URL"
curl -sSfL -o "$tmp/$ZIP.sha256" "$URL.sha256"
(cd "$tmp" && sha256sum -c "$ZIP.sha256")

mkdir -p public/vendor/openscad public/vendor/three/addons
unzip -o -q "$tmp/$ZIP" -d public/vendor/openscad

cp node_modules/three/build/three.module.js node_modules/three/build/three.core.js public/vendor/three/
cp node_modules/three/examples/jsm/controls/OrbitControls.js \
   node_modules/three/examples/jsm/loaders/STLLoader.js public/vendor/three/addons/
cp node_modules/fflate/esm/browser.js public/vendor/fflate.js

echo "OK: public/vendor/ (OpenSCAD ${OPENSCAD_VERSION})"
