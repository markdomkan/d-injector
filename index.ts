type ServiceClass = new (...args: any[]) => any;
type Arguments = ServiceArg | OtherArg;
type Tags<
  T extends Record<string, Array<string>> = Record<string, Array<string>>
> = Array<string> | T;
type ServiceArg = {
  type: "service";
  id: string;
};
type OtherArg = {
  type: "value";
  value: unknown;
};
type Service<T extends Tags = Tags> = {
  id: string;
  serviceClass: ServiceClass;
  method?: string;
  args?: Arguments[];
  tags?: T;
};
type RegisteredService = Required<Omit<Service, "id" | "method">> &
  Pick<Service, "method">;
type RegisteredServiceWithId = RegisteredService & Pick<Service, "id">;
export type InstancedService<T = unknown> = { instance: T; tags?: Tags };

export class D_Container {
  constructor(private services: Record<string, InstancedService>) { }

  /**
   * Registers a new service in the container.
   * @param id - The unique identifier for the service.
   * @param service - The service instance to register.
   * @param tags - Optional tags for categorizing the service.
   * @throws Error if the service with the given id is already registered.
   */
  public setNewService<T>(id: string, service: T, tags?: Tags): void {
    if (this.services[id]) {
      throw new Error(`Service ${id} already registered`);
    }

    this.services[id] = { instance: service, tags };
  }

  /**
   * Retrieves a service by its identifier.
   * @param id - The unique identifier of the service.
   * @returns The instanced service associated with the id.
   * @throws Error if the service is not registered.
   */
  public get<T>(id: string): InstancedService<T> {
    const service = this.services[id];
    if (!service) {
      throw new Error(`Service ${id} not registered`);
    }
    return service as InstancedService<T>;
  }

  /**
   * Finds all services that match a specific tag.
   * @param tag - The tag to search for.
   * @param tagKey - Optional key if tags are organized under specific keys.
   * @returns A map of service IDs to their corresponding instanced services that match the tag.
   */
  public findByTag(
    tag: string,
    tagKey?: string
  ): Map<string, InstancedService> {
    return new Map(
      Object.entries(this.services).filter(([_, { tags }]) => {
        if (!tags) {
          return false;
        }

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

  /**
   * Registers a service with the injector.
   * @param service - The service configuration to register.
   * @returns The injector instance for chaining.
   * @throws Error if a service with the given id is already registered.
   */
  public register<T extends Tags = Tags>({
    id,
    serviceClass,
    args,
    tags,
    method,
  }: Service<T>): this {
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


  public override<T extends Tags = Tags>({ id,
    serviceClass,
    args,
    tags,
    method,
  }: Service<T>): this {
    if (!this.services[id]) {
      throw new Error(`Service ${id} is not registered`);
    }

    this.services[id] = {
      serviceClass,
      args: args ?? [],
      tags: tags ?? [],
      method,
    };

    return this;
  }


  /**
   * Compiles and initializes all registered services.
   * @returns A promise that resolves to a container containing all instanced services.
   * @throws Error if some services cannot be instantiated due to missing dependencies.
   */
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
          if (this.instancedServices[arg.id] === undefined) {
            this.buildersSubscriber[arg.id] = [
              ...(this.buildersSubscriber[arg.id] ?? []),
              async () => {
                if (
                  service.args.find(
                    (arg) =>
                      arg.type === "service" &&
                      this.instancedServices[arg.id] === undefined
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
    const expectedServices = Object.keys(this.services);
    const actualServices = Object.keys(this.instancedServices);

    if (expectedServices.length !== actualServices.length) {
      const missingServices = expectedServices.filter(
        (service) => !actualServices.includes(service)
      );

      const noneDepsServices = [];

      for (const missingService of missingServices) {
        if (this.services[missingService].args === undefined) {
          noneDepsServices.push(missingService);
          continue;
        }

        if (
          this.services[missingService].args.filter(
            (arg) =>
              (arg.type === "service" && !missingService.includes(arg.id)) ||
              arg.type === "value"
          ).length === 0
        ) {
          noneDepsServices.push(missingService);
          continue;
        }
      }

      throw new Error(
        `This services can't be instanced: ${missingServices.join(
          ", "
        )}. Posible worng services: ${noneDepsServices.join(", ")}`
      );
    }

    return new D_Container(this.instancedServices);
  }

  /**
   * Builds and instantiates a registered service.
   * @param service - The registered service with its identifier.
   * @returns A promise that resolves when the service is successfully built.
   */
  private async buildService(service: RegisteredServiceWithId): Promise<void> {
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
        instance: await instance[service.method](),
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

    const promises = this.buildersSubscriber[service.id]?.map((subscriber) =>
      subscriber()
    );

    await Promise.all(promises || []);
  }
}
