// deno-lint-ignore no-explicit-any
type ClassType = new (...args: any[]) => any;

type ArgumentsType = RegisterType | OtherType;

type RegisterType = {
  id: string;
  type: "service";
};

type OtherType = {
  value: unknown;
  type: "value";
};

export class D_Container {
  constructor(private services: Record<string, unknown>) {}

  public get<T>(id: string): T {
    const service = this.services[id];
    if (!service) {
      throw new Error(`Service ${id} not registered`);
    }
    return service as T;
  }
}

export class D_Injector {
  private services: Record<
    string,
    { serviceClass: ClassType; args: ArgumentsType[] }
  > = {};

  public register({
    id,
    serviceClass,
    args,
  }: {
    id: string;
    serviceClass: ClassType;
    args?: ArgumentsType[];
  }): this {
    if (this.services[id]) {
      throw new Error(`Service ${id} already registered`);
    }

    this.services[id] = {
      serviceClass,
      args: args ?? [],
    };

    return this;
  }

  public build(): D_Container {
    const instancedServices: Record<string, unknown> = {};
    const buildersSubscriber: Record<string, () => void> = {};

    for (const [key, { args, serviceClass }] of Object.entries(this.services)) {
      if (args.length === 0 || args.every(({ type }) => type === "value")) {
        instancedServices[key] = new serviceClass(...args);
        buildersSubscriber[key]();
        continue;
      }

      let serviceCount = 0;
      const instancedArgs: Record<string, unknown> = {};
      for (const arg of args) {
        if (arg.type === "service") {
          serviceCount++;
          if (instancedServices[arg.id] !== undefined) {
            instancedArgs[arg.id] = instancedServices[arg.id];
          }
        }
      }

      if (serviceCount === Object.keys(instancedArgs).length) {
        instancedServices[key] = new serviceClass(
          ...Object.values(instancedArgs)
        );
        buildersSubscriber[key]();
        continue;
      }
    }

    return new D_Container(instancedServices);
  }
}
