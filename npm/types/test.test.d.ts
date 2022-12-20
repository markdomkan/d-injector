export declare class ServiceClass {
    test(text: string): string;
}
export declare class TestClass {
    private service;
    private text;
    constructor(service: ServiceClass, text: string);
    test(): string;
}
