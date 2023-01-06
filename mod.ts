// deno-lint-ignore no-explicit-any
export type ServiceClass = new (...args: any[]) => any;

export type Arguments = ServiceArg | OtherArg;
export type Tags = Array<string> | Record<string, Array<string>>;

export type ServiceArg = {
  type: "service";
  ref: string;
};

export type OtherArg = {
  type: "value";
  value: unknown;
};

export type Service = {
  id: string;
  serviceClass: ServiceClass;
  method?: string;
  args?: Arguments[];
  tags?: Tags;
};

type RegisteredService = Required<Omit<Service, "id" | "method">> &
  Pick<Service, "method">;

type RegisteredServiceWithId = RegisteredService & Pick<Service, "id">;

export type InstancedService<T = unknown> = { instance: T; tags: Tags };

export class D_Container {
  constructor(private services: Record<string, InstancedService>) {}

  public get<T>(id: string): { instance: T; tags: Tags } {
    const service = this.services[id];
    if (!service) {
      throw new Error(`Service ${id} not registered`);
    }
    return service as InstancedService<T>;
  }

  public findByTag(tag: string, tagKey?: string): Map<string, InstancedService> {
    return new Map(
      Object.entries(this.services).filter(([_, { tags }]) => {
        if (tags instanceof Array) {
          return tags.includes(tag);
        }

        if (tagKey === undefined) {
          return Object.values(tags).flat().includes(tag);
        }

        return tags[tagKey]?.includes(tag);
      })
    );
  }
}

export class D_Injector {
  private instancedServices: Record<string, InstancedService> = {};
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

  public async compile(): Promise<D_Container> {
    servicesFor: for (const [key, service] of Object.entries(this.services)) {
      if (
        service.args.length === 0 ||
        service.args.every(({ type }) => type === "value")
      ) {
        await this.buildService({ id: key, ...service });
        continue;
      }

      for (const arg of service.args) {
        if (arg.type === "service") {
          if (this.instancedServices[arg.ref] === undefined) {
            this.buildersSubscriber[arg.ref] = [
              ...(this.buildersSubscriber[arg.ref] ?? []),
              async () => {
                if (
                  service.args.find(
                    (arg) =>
                      arg.type === "service" &&
                      this.instancedServices[arg.ref] === undefined
                  ) === undefined
                ) {
                  await this.buildService({ id: key, ...service });
                }
              },
            ];
            continue servicesFor;
          }
        }
      }

      await this.buildService({ id: key, ...service });
    }

    return new D_Container(this.instancedServices);
  }

  private async buildService(service: RegisteredServiceWithId): Promise<void> {
    if (service.method) {
      const instance = new service.serviceClass(
        ...service.args.map((arg) =>
          arg.type === "value"
            ? arg.value
            : this.instancedServices[arg.ref].instance
        )
      );

      this.instancedServices[service.id] = {
        tags: service.tags,
        instance: await instance[service.method](),
      };
    } else {
      this.instancedServices[service.id] = {
        tags: service.tags,
        instance: new service.serviceClass(
          ...service.args.map((arg) =>
            arg.type === "value"
              ? arg.value
              : this.instancedServices[arg.ref].instance
          )
        ),
      };
    }

    const promises = this.buildersSubscriber[service.id]?.map((subscriber) =>
      subscriber()
    );

    await Promise.all(promises || []);
  }
}
