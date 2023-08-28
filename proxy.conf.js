var winston = require("winston");

function logProvider() {
  return winston.createLogger({
    level: "debug",
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.simple()
    ),
    transports: [new winston.transports.Console()],
  });
}

const PROXY_CONFIG = [
  {
    context: ["/api"],
    target: '"http://localhost:9090/',
    secure: false,
    logLevel: "debug",
    pathRewrite: { "^/api": "" },
    changeOrigin: true,
    logProvider,
  },
];
module.exports = PROXY_CONFIG;
