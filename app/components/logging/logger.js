// const winston = require('winston')
//
// module.exports = winston.createLogger({
//   transports: [
//     new (winston.transports.Console)({'timestamp':true}),
//     new winston.transports.File({ filename: '/var/log/nodejs/winston.log' })
//   ]
// });

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

module.exports = createLogger({
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.Console()]
})
