import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { faker } from "https://deno.land/x/deno_faker@v1.0.3/mod.ts";

import { D_Injector } from "./mod.ts";

Deno.test("Get by ID", () => {
  class TestClass {}

  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: TestClass,
  });

  const container = injector.compile();
  const service = container.get<TestClass>("service.class");

  assertInstanceOf(service, TestClass);
});

Deno.test("Find by tag", () => {
  class TestClass {
    public test(text: string) {
      return text;
    }
  }

  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: TestClass,
    tags: ["test"],
  });

  const container = injector.compile();
  const services = container.findByTag<TestClass>("test");

  assertEquals(services.length, 1);
  assertInstanceOf(services[0], TestClass);
});

Deno.test("The instance text and number should coincide with injected", () => {
  class TestClass {
    constructor(public text: string, public number: number) {}
  }

  const randomText = faker.lorem.word();
  const randomNumber = faker.random.number();

  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: TestClass,
    args: [
      {
        type: "value",
        value: randomText,
      },
      {
        type: "value",
        value: randomNumber,
      },
    ],
  });

  const container = injector.compile();
  const service = container.get<TestClass>("service.class");

  assertStrictEquals(service.text, randomText);
  assertStrictEquals(service.number, randomNumber);
});

Deno.test(
  "The method execute from TestClass should return the injected text manipulated by the injected service",
  () => {
    class ServiceClass {
      public addExclamation(text: string) {
        return `${text}!`;
      }
    }
    class TestClass {
      constructor(private service: ServiceClass, private text: string) {}

      public execute() {
        return this.service.addExclamation(this.text);
      }
    }

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
    const value = container.get<TestClass>("test.class").execute();

    assertStrictEquals(value, "Hello World!");
  }
);

Deno.test("Method create from the Factory class should be called", () => {
  class StringFactory {
    public create() {
      return "Hello World!";
    }
  }

  class TestClass {
    constructor(private text: string) {}

    public execute() {
      return this.text;
    }
  }

  const injector = new D_Injector();
  injector
    .register({
      id: "test.class",
      serviceClass: TestClass,
      args: [
        {
          type: "service",
          id: "factory",
        },
      ],
    })
    .register({
      id: "factory",
      serviceClass: StringFactory,
      method: "create",
    });

  const container = injector.compile();
  const value = container.get<TestClass>("test.class").execute();

  assertStrictEquals(value, "Hello World!");
});
