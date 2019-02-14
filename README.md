# openHAB 2 js rules

This is an stand-alone, or external, rule-engine for [openHAB 2](https://www.openhab.org/).
I've created this mostly because I was unable to create rules dynamic enough for my needs.
For example, my heating rules fulfill the following:

- Have day, night, and away (nobody's home) temperatures
- Trigger nighttime early for the bedrooms
- Have dynamic day temperatures, based on the weather
- Save the manually changed day temperature in relation to the temperature outside
- Trigger the "away" state once all smart phones leave the WiFi
- Don't trigger night temperature in the living room if the TV is still running
- Don't trigger night temperature in the office if the PC is still running

You can find this ruleset under `example-rules/heating.rules.js`.

## Installation

Install by cloning this repo and its dependencies via `npm install`.

## Configuration

Copy `.env.example` to `.env` and edit the server address. Start the engine by typing `node .`.

Note: You should use some init script to start the engine after a reboot.

## Creating rules

Copy and rename `example-rules/template.rules.js` into the rules directory. The new file has to have the
suffix `rules.js`. If you change the file it will be automatically reloaded by the rule engine.
Any errors and log messages will be printed out by the main process.
