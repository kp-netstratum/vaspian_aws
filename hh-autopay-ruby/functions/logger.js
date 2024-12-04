const winston = require('winston');

const logger = winston.createLogger({
    level: 'info', // Default log level
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'application.log' }) // Log to a file as well
    ]
});

module.exports = logger;
