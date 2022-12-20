type ServiceClass = new (...args: any[]) => any;
type Arguments = ServiceArg | OtherArg;
type ServiceArg = {
    id: string;
    type: "service";
};
type OtherArg = {
    value: unknown;
    type: "value";
};
type Service = {
    id: string;
    serviceClass: ServiceClass;
    args?: Arguments[];
    tags?: string[];
};
type ServiceInstance = {
    instance: unknown;
    tags: string[];
};
export declare class D_Container {
    private services;
    constructor(services: Record<string, ServiceInstance>);
    get<T>(id: string): T;
    findByTag<T>(tag: string): T[];
}
export declare class D_Injector {
    private instancedServices;
    private buildersSubscriber;
    private services;
    register({ id, serviceClass, args, tags }: Service): this;
    compile(): D_Container;
    private buildService;
}
export {};
