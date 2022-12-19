import { D_Injector } from "./mod.ts";

export class ServiceClass {
  public test(text: string) {
    return text;
  }
}
export class TestClass {
  constructor(private service: ServiceClass, private text: string) {}

  public test() {
    return this.service.test(this.text);
  }
}

Deno.test("Get by ID", () => {
  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: ServiceClass,
  });

  const container = injector.compile();
  const value = container
    .get<ServiceClass>("service.class")
    .test("Hello World");

  if (value !== "Hello World") {
    throw new Error("Value is not equal to Hello World");
  }
});

Deno.test("Find by tag", () => {
  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: ServiceClass,
    tags: ["test"],
  });

  const container = injector.compile();
  const value = container
    .findByTag<ServiceClass>("test")[0]
    .test("Hello World");

  if (value !== "Hello World") {
    throw new Error("Value is not equal to Hello World");
  }
});

Deno.test("Injection with all possible elements", () => {
  const injector = new D_Injector();
  injector
    .register({
      id: "test.class",
      serviceClass: TestClass,
      args: [
        {
          type: "service",
          id: "service.class",
        },
        {
          type: "value",
          value: "Hello World",
        },
      ],
    })
    .register({
      id: "service.class",
      serviceClass: ServiceClass,
      tags: ["test"],
    });

  const container = injector.compile();
  const value = container.get<TestClass>("test.class").test();

  if (value !== "Hello World") {
    throw new Error("Value is not equal to Hello World");
  }
});
