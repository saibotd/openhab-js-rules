/*
You may put you imports here.

Some common libs and functions are available right away:
axios, _ (lodash), moment, fs, path, log, cron
 
*/


// Logging
log('one', 'two', ['three'], { four: 4 });

// Using cron (check src/cron.js)
const isWeekDay = cron.isBetween('30 06 * * 1-4', '22 30 * * 1-4');

// Access openHAB items
const temperatureOutside = Item.ThermostatOutside.state;
Item.TemperatureOffice.set(22);

/*
Lifecycle functions
*/

function init(){
    /*
    Triggered once at launch
    and everytime the file is edited
    */
}

function update(){
    /*
    Triggered once every minute
    */
}

function onEvent({event, item, oldState, newState}){
    /*
    Triggered at every event openHAB receives
    */
}

function quit(){
    /*
    Put your cleanup code here
    */
}

/*
Every rule has to export these four functions
*/
module.exports = {
    init,
    update,
    onEvent,
    quit
}