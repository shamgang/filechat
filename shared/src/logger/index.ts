import pino from "pino";
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({ config: {
  connectionString: process.env.NEXT_PUBLIC_APP_INSIGHTS_CONN ?? process.env.APP_INSIGHTS_CONN
} });
appInsights.loadAppInsights();

function mapPinoToAppInsightsLevel(pinoLevel: number): SeverityLevel {
  if (pinoLevel <= 20) {
    return SeverityLevel.Verbose;         // trace (10) and debug (20)
  } else if (pinoLevel <= 30) {
    return SeverityLevel.Information;     // info (30)
  } else if (pinoLevel <= 40) {
    return SeverityLevel.Warning;         // warn (40)
  } else if (pinoLevel <= 50) {
    return SeverityLevel.Error;           // error (50)
  } else {
    return SeverityLevel.Critical;        // fatal (60 or higher)
  }
}

function logToAppInsightsCommon(msg: string | object | Error | unknown, level: number) {
  let outgoingMsg: string | Error;
  let outgoingLevel = level;

  if (msg instanceof Error) {
    outgoingMsg = msg;
  } else if (typeof msg === 'object') {
    outgoingMsg = JSON.stringify(msg);
  } else if (typeof msg === 'string') {
    outgoingMsg = msg;
  } else {
    outgoingMsg = `Logging error: unexpected log message type: ${typeof msg}`;
    outgoingLevel = 50;
  }

  const appInsightsLevel: SeverityLevel = mapPinoToAppInsightsLevel(outgoingLevel);

  if (typeof outgoingMsg === 'string') {
    appInsights.trackTrace({ message: outgoingMsg, severityLevel: appInsightsLevel });
  } else if (outgoingMsg instanceof Error) {
    appInsights.trackException({ exception: outgoingMsg, severityLevel: appInsightsLevel });
  }
}

function logToAppInsightsServer(this: pino.Logger, args: Parameters<pino.LogFn>, method: pino.LogFn, level: number): void {
  method.apply(this, args);

  // Parameters<LogFn> incorrectly assumes the first overload,
  // so we have to relax type of first argument to account for other overloads that may be used.
  logToAppInsightsCommon(args[0], level);
};

function logToAppInsightsClient(level: pino.Level, logEvent: pino.LogEvent): void {
  const levelNumber: number = pino.levels.values[level];
  logToAppInsightsCommon(logEvent.messages[0], levelNumber);
}

export const logger = pino({
  base: {
    sentFrom: typeof window === "undefined" ? 'server' : 'client',
    nodeEnv: process.env.NODE_ENV
  },
  hooks: {
    logMethod: logToAppInsightsServer
  },
  browser: {
    transmit: {
      send: logToAppInsightsClient
    }
  }
});