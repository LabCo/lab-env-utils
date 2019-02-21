import * as winston from "winston"
export type NodeEnv = "production" | "development" | "test"

export abstract class PartialEnv {

  private static VALID_NODE_ENV = new Set<NodeEnv>(["development", "production", "test"])
  
  protected logger: winston.Logger;

  private _nodeEnv:NodeEnv;
  get nodeEnv() { return this._nodeEnv }

  private _port:number;
  get port() { return this._port }

  private _sessionSecret:string;
  get sessionSecret() { return this._sessionSecret }

  private _serverHost: string;
  get serverHost() { return this._serverHost }

  private _fromEmail: string;
  get fromEmail() { return this._fromEmail }

  constructor(defaults: {port: number, host: string, fromEmail: string }, loggerLevel?: string, ) {
    const loggerLevelNotNull = loggerLevel || "debug"

    const myFormat = winston.format.printf(info => {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    });
    const loggerOptions: winston.LoggerOptions = {
      format: winston.format.combine(
        winston.format.colorize({message: true}),
        winston.format.label({ label: 'ENV' }),
        winston.format.timestamp(),
        myFormat
      ),
      transports: [new winston.transports.Console()],
      level: loggerLevelNotNull
    }
    this.logger = winston.createLogger(loggerOptions)

    this._sessionSecret = this.parseEnvAsString( "SESSION_SECRET" )
    this._nodeEnv = this.parseEnvAsString( "NODE_ENV", { allowed: PartialEnv.VALID_NODE_ENV } )
    this._port = this.parseEnvAsNumber("PORT", { defaultValue: defaults.port })
    this._serverHost = this.parseEnvAsString( "SERVER_HOST", { defaultValue: defaults.host } )
    this._fromEmail = this.parseEnvAsString( "FROM_EMAIL", { defaultValue: defaults.fromEmail } )
  }

  protected parseEnvAsString<T extends string>(envVarName: string, options?: { defaultValue?:T, allowed?: Set<T> }): T {
    const parsed = this.parseEnvAsStringOrNull(envVarName, options)
    if(parsed == null) { 
      throw new Error(`${envVarName} must be defined`)
    }

    return parsed;
  }

  protected parseEnvAsStringOrNull<T extends string>(envVarName: string, options?: { defaultValue?:T | null, allowed?: Set<T> }): T | null {
    if(envVarName == null) { throw new Error("envVarName is null") }

    const valueStr = process.env[envVarName] as T
    if(valueStr == null && options != null && options.defaultValue !== undefined) {
      this.logger.warn(`${envVarName} not defined, using default ${options.defaultValue}`);
      return options.defaultValue;
    } else if(valueStr == null) {
      throw new Error(`${envVarName} must be defined`)
    }

    if(options && options.allowed && !options.allowed.has(valueStr)) {
      this.logger.error(`unsupported NODE_ENV value ${valueStr}`)
      throw new Error(`unsupported NODE_ENV value ${valueStr}`) 
    }

    return valueStr
  }

  protected parseEnvAsNumber<T extends string>(envVarName: string, options?: { defaultValue?:number, max?:number, min?:number}): number {
    const parsed = this.parseEnvAsNumberOrNull(envVarName, options)
    if(parsed == null) { 
      throw new Error(`${envVarName} must be defined`)
    }
    return parsed;
  }

  protected parseEnvAsNumberOrNull(envVarName: string, options?: { defaultValue?:number | null, max?:number, min?:number }): number | null {
    if(envVarName == null) { throw new Error("envVarName is null") }

    const valueStr = process.env[envVarName]
    if(valueStr == null && options != null && options.defaultValue !== undefined) {
      this.logger.warn(`${envVarName} not defined, using default ${options.defaultValue}`);
      return options.defaultValue;
    } else if(valueStr == null) {
      throw new Error(`${envVarName} must be defined`)
    }
    const value = parseInt(valueStr)

    if(value == null || Number.isNaN(value) ) {
      throw new Error(`${envVarName} value ${valueStr} is not a number`)
    }
    if(options != null && options.min != null && value < options.min) {
      throw new Error(`${envVarName} value ${valueStr} must be at least ${options.min}`);
    }
    if(options != null && options.max != null && value > options.max) {
      throw new Error(`${envVarName} value ${valueStr} must be no greater than ${options.max}`);
    }

    return value
  }

}