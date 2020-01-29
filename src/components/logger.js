/* eslint-disable require-jsdoc */
const winston = require('winston');
const path = require('path');
const stackTrace = require('stack-trace');
const {format} = winston;

let mod = module;
while (mod.parent) {
    mod = mod.parent;
}
const rootDir = path.dirname(mod.filename);
const formatCallSite = cs => [
    path.relative(rootDir, cs.getFileName()),
    cs.getLineNumber(),
].join(':');

const getCallSite = () => {
    const stack = stackTrace.get().reverse();
    const index = stack.findIndex(v =>
        v.getFunctionName() === 'winston.<computed>'
        && ['info', 'error', 'debug', 'warn'].includes(v.getMethodName()));
    const site = stack[index - 1];
    return site && formatCallSite(site);
};

const myFormat = format.printf(info => {
    const at = getCallSite();
    const data = info[Symbol.for('splat')] || [];
    let additional;
    if (data.length > 1) {
        additional = `\n${data.map((val, i) => `    [${i}] :${JSON.stringify(val)}`).join('\n')}`;
    } else if (data.length > 0) {
        additional = `\n  data :${JSON.stringify(data[0])}`;
    }
    if (info instanceof Error) {
        return `${info.timestamp} ${at} ${info.level}: ${info.message} ${info.stack}`;
    }
    if (additional) {
        return `${info.timestamp} ${at} ${info.level}: ${info.message} ${additional}`;
    }
    return `${info.timestamp} ${at} ${info.level}: ${info.message}`;
});

winston.configure({
    format: format.combine(
        format.timestamp(),
        format.colorize(),
        myFormat,
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

module.exports = winston;
