const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
};

export const logger = {
    info: (message, data) => log('INFO', message, data),
    warn: (message, data) => log('WARN', message, data),
    error: (message, data) => log('ERROR', message, data),
    debug: (message, data) => log('DEBUG', message, data),
};