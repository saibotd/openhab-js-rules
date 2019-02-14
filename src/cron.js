const cronParser = require('cron-parser');
const moment = require('moment-timezone');

const cron = {
    parser: cronParser,
    parse: cronParser.parseExpression,
    isNow: (expression, time = moment()) => { 
        const interval = cronParser.parseExpression(expression);
        const _time = moment(interval.prev().toDate());
        return time.diff(_time, 'seconds') < 60;
    },
    isAfter: (expression, time=moment()) => {
        const _time = moment(cronParser.parseExpression(expression).prev().toDate());
        return _time.isSame(time, 'day') && time.isAfter(_time);
    },
    isBefore: (expression, time=moment()) => {
        const _time = moment(cronParser.parseExpression(expression).next().toDate());
        return _time.isSame(time, 'day') && time.isBefore(_time);
    },
    isBetween(expressionStart, expressionEnd, time=moment()){
        return cron.isAfter(expressionStart, time) && cron.isBefore(expressionEnd, time);
    }
}

module.exports = cron;