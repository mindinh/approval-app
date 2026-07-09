import cds from '@sap/cds';

export class Logger {
    private logger: any;

    constructor(label: string) {
        this.logger = cds.log(label);
    }

    info(message: string, ...args: any[]) {
        this.logger.info(message, ...args);
    }

    warn(message: string, ...args: any[]) {
        this.logger.warn(message, ...args);
    }

    error(message: string, ...args: any[]) {
        this.logger.error(message, ...args);
    }

    debug(message: string, ...args: any[]) {
        this.logger.debug(message, ...args);
    }
}
