export declare class AppController {
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
    getHello(): {
        message: string;
        version: string;
        docs: string;
    };
}
