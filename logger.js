const { createLogger, transports, format } = require('winston');
const path = require('path');

const logsDirectory = path.join(__dirname, 'logs');

// Crear la carpeta 'logs' si no existe
const fs = require('fs');
if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory);
}

const customFormat = format.printf(info => {
    return `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`;
});

const infoLogger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logsDirectory, 'eventLogger.log'), level: 'info', maxsize: 5242880, maxFiles: 5 }) // 5MB max size per file, 5 files max
    ]
});

const errorLogger = createLogger({
    level: 'error',
    format: format.combine(
        format.timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logsDirectory, 'errorLogger.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }) // 5MB max size per file, 5 files max
    ]
});

module.exports = { infoLogger, errorLogger };
