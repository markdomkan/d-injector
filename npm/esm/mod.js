export class D_Container {
    constructor(services) {
        Object.defineProperty(this, "services", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: services
        });
    }
    get(id) {
        const service = this.services[id];
        if (!service) {
            throw new Error(`Service ${id} not registered`);
        }
        return service.instance;
    }
    findByTag(tag) {
        return Object.values(this.services)
            .filter(({ tags }) => tags.includes(tag))
            .map(({ instance }) => instance);
    }
}
export class D_Injector {
    constructor() {
        Object.defineProperty(this, "instancedServices", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "buildersSubscriber", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "services", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
    }
    register({ id, serviceClass, args, tags }) {
        if (this.services[id]) {
            throw new Error(`Service ${id} already registered`);
        }
        this.services[id] = {
            serviceClass,
            args: args ?? [],
            tags: tags ?? [],
        };
        return this;
    }
    compile() {
        servicesFor: for (const [key, service] of Object.entries(this.services)) {
            if (service.args.length === 0 ||
                service.args.every(({ type }) => type === "value")) {
                this.buildService({ id: key, ...service });
                continue;
            }
            let instancedArgs = [];
            for (const arg of service.args) {
                if (arg.type === "service") {
                    if (this.instancedServices[arg.id] === undefined) {
                        this.buildersSubscriber[arg.id] = [
                            ...(this.buildersSubscriber[arg.id] ?? []),
                            () => {
                                if (service.args.find((arg) => arg.type === "service" &&
                                    this.instancedServices[arg.id] === undefined) === undefined) {
                                    this.buildService({ id: key, ...service });
                                }
                            },
                        ];
                        continue servicesFor;
                    }
                    instancedArgs = [
                        ...instancedArgs,
                        this.instancedServices[arg.id].instance,
                    ];
                }
                else {
                    instancedArgs = [...instancedArgs, arg.value];
                }
            }
            this.instancedServices[key] = {
                tags: service.tags,
                instance: new service.serviceClass(...instancedArgs),
            };
        }
        return new D_Container(this.instancedServices);
    }
    buildService(service) {
        this.instancedServices[service.id] = {
            tags: service.tags,
            instance: new service.serviceClass(...service.args.map((arg) => arg.type === "value"
                ? arg.value
                : this.instancedServices[arg.id].instance)),
        };
        this.buildersSubscriber[service.id]?.forEach((subscriber) => subscriber());
    }
}
