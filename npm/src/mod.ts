// deno-lint-ignore no-explicit-any
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

type ServiceInstance = { instance: unknown; tags: string[] };

export class D_Container {
  constructor(private services: Record<string, ServiceInstance>) {}

  public get<T>(id: string): T {
    const service = this.services[id];
    if (!service) {
      throw new Error(`Service ${id} not registered`);
    }
    return service.instance as T;
  }

  public findByTag<T>(tag: string): T[] {
    return Object.values(this.services)
      .filter(({ tags }) => tags.includes(tag))
      .map(({ instance }) => instance) as T[];
  }
}

export class D_Injector {
  private instancedServices: Record<string, ServiceInstance> = {};
  private buildersSubscriber: Record<string, (() => void)[]> = {};
  private services: Record<string, Required<Omit<Service, "id">>> = {};

  public register({ id, serviceClass, args, tags }: Service): this {
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

  public compile(): D_Container {
    servicesFor: for (const [key, service] of Object.entries(this.services)) {
      if (
        service.args.length === 0 ||
        service.args.every(({ type }) => type === "value")
      ) {
        this.buildService({ id: key, ...service });
        continue;
      }

      let instancedArgs: unknown[] = [];

      for (const arg of service.args) {
        if (arg.type === "service") {
          if (this.instancedServices[arg.id] === undefined) {
            this.buildersSubscriber[arg.id] = [
              ...(this.buildersSubscriber[arg.id] ?? []),
              () => {
                if (
                  service.args.find(
                    (arg) =>
                      arg.type === "service" &&
                      this.instancedServices[arg.id] === undefined
                  ) === undefined
                ) {
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
        } else {
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

  private buildService(service: Required<Service>): void {
    this.instancedServices[service.id] = {
      tags: service.tags,
      instance: new service.serviceClass(
        ...service.args.map((arg) =>
          arg.type === "value"
            ? arg.value
            : this.instancedServices[arg.id].instance
        )
      ),
    };
    this.buildersSubscriber[service.id]?.forEach((subscriber) => subscriber());
  }
}
