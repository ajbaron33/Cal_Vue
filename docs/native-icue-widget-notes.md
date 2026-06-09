# Native iCUE / XENEON Widget Notes

## Goal

Package CalVue as a native iCUE widget instead of relying on the Web URL widget.

## Current Status

- CalVue works as a React/Vite web app.
- CalVue renders successfully inside iCUE using the Web URL widget.
- Web URL widgets appear to have a minimum size of Medium.
- Native widget packaging is needed for true Small / Medium / Large support.

## Correct Tooling

The Stream Deck CLI (`npx sd`) is **not** the correct tool for XENEON/iCUE widgets.

The correct CLI appears to be:

icuewidget

Expected commands:

icuewidget init
icuewidget validate
icuewidget package

## Required Next Step

Install CORSAIR's WidgetBuilder Kit on Windows and verify:

icuewidget --help

## Expected Native Widget Files

widget/
  index.html
  manifest.json
  icon.svg

Final package output:

CalVue.icuewidget

## Open Questions

- Exact manifest schema
- Required icon dimensions
- Can React build output be packaged directly?
- Does localStorage work?
- Native Small widget support?
