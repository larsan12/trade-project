/* eslint-disable require-jsdoc */
const winston = require('winston');
const {format} = winston;


const myFormat = format.printf(info => {
    if (info instanceof Error) {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message} ${info.stack}`;
    }
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

// TODO
const filename = module.filename.split('/').slice(-1);

winston.configure({
    format: format.combine(
        format.label({label: filename}),
        winston.format.splat(),
        format.timestamp(),
        format.colorize(),
        myFormat,
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

module.exports = winston;
