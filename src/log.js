const path = require('path');
const chalk = require('chalk');

const colors = {self: ['ffd3fb', 'e8bbe4', 'd3a5cf'], rule: ['d1ecf9', 'bad5e2', 'a7c5d3']};

function log(...args){
    const caller = _getCallerRule();
    args = args.map((s, i) =>{
        const color = caller ? colors.rule[i>2?2:i] : colors.self[i>2?2:i];
        if(typeof s != 'string') s = JSON.stringify(s, false, 2);
        return chalk.hex(`#${color}`)(s)
    });
    if(caller) args.unshift(caller);
    args.unshift(chalk.hex('#AAA')(moment().format()));
    console.log(...args);
}

function _getCallerRule() {
    var originalFunc = Error.prepareStackTrace;
    var callerfile;
    try {
        var err = new Error();
        var currentfile;
        Error.prepareStackTrace = function (err, stack) { return stack; };
        currentfile = err.stack.shift().getFileName();
        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();
            if(currentfile !== callerfile) break;
        }
    } catch (e) {}
    Error.prepareStackTrace = originalFunc; 
    return callerfile && callerfile.endsWith('rules.js') ? path.basename(callerfile, path.extname(callerfile)) : null;
}

module.exports = log;