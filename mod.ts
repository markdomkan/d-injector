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
  method?: string;
  args?: Arguments[];
  tags?: string[];
};

type RegisteredService = Required<Omit<Service, "id" | "method">> &
  Pick<Service, "method">;

type RegisteredServiceWithId = RegisteredService & Pick<Service, "id">;

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

  public findByTag(tag: string): Map<string, unknown> {
    return new Map(
      Object.entries(this.services)
        .filter(([_, { tags }]) => tags.includes(tag))
        .map(([key, { instance }]) => [key, instance])
    );
  }
}

export class D_Injector {
  private instancedServices: Record<string, ServiceInstance> = {};
  private buildersSubscriber: Record<string, (() => void)[]> = {};
  private services: Record<
    string,
    Required<Omit<Service, "id" | "method">> & Pick<Service, "method">
  > = {};

  public register({ id, serviceClass, args, tags, method }: Service): this {
    if (this.services[id]) {
      throw new Error(`Service ${id} already registered`);
    }

    this.services[id] = {
      serviceClass,
      args: args ?? [],
      tags: tags ?? [],
      method,
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
        }
      }

      this.buildService({ id: key, ...service });
    }

    return new D_Container(this.instancedServices);
  }

  private buildService(service: RegisteredServiceWithId): void {
    if (service.method) {
      const instance = new service.serviceClass(
        ...service.args.map((arg) =>
          arg.type === "value"
            ? arg.value
            : this.instancedServices[arg.id].instance
        )
      );

      this.instancedServices[service.id] = {
        tags: service.tags,
        instance: instance[service.method](),
      };
    } else {
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
    }

    this.buildersSubscriber[service.id]?.forEach((subscriber) => subscriber());
  }
}
