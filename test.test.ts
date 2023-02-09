import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { faker } from "https://deno.land/x/deno_faker@v1.0.3/mod.ts";

import { D_Injector, InstancedService } from "./mod.ts";

Deno.test("Get by ID", async () => {
  class TestClass {}

  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: TestClass,
  });

  const container = await injector.compile();
  const service = container.get<TestClass>("service.class");

  assertInstanceOf(service.instance, TestClass);
});

Deno.test("Find by tag", async () => {
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

  const container = await injector.compile();
  const services = container.findByTag("test");
  const serviceKey = services.keys().next().value;
  const serviceInstance = services.get(serviceKey);

  assertEquals(services.size, 1);
  assertEquals(serviceKey, "service.class");
  assertInstanceOf(serviceInstance?.instance, TestClass);
});

Deno.test(
  "The instance text and number should coincide with injected",
  async () => {
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

    const container = await injector.compile();
    const service = container.get<TestClass>("service.class");

    assertStrictEquals(service.instance.text, randomText);
    assertStrictEquals(service.instance.number, randomNumber);
  }
);

Deno.test(
  "The method execute from TestClass should return the injected text manipulated by the injected service",
  async () => {
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

    const container = await injector.compile();
    const value = container.get<TestClass>("test.class").instance.execute();

    assertStrictEquals(value, "Hello World!");
  }
);

Deno.test("Method create from the Factory class should be called", async () => {
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

  const container = await injector.compile();
  const value = container.get<TestClass>("test.class").instance.execute();

  assertStrictEquals(value, "Hello World!");
});

Deno.test("Async method from factory", async () => {
  class StringFactory {
    public create(): Promise<string> {
      return Promise.resolve("Hello World!");
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
          id: "factory",
          type: "service",
        },
      ],
    })
    .register({
      id: "factory",
      serviceClass: StringFactory,
      method: "create",
    });

  const container = await injector.compile();
  const value = container.get<TestClass>("test.class").instance.execute();

  assertStrictEquals(value, "Hello World!");
});

Deno.test("should find the service with entry-style tag", async () => {
  class TestClass {}

  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: TestClass,
    tags: {
      tagCategory: ["tag1", "tag2"],
    },
  });

  const container = await injector.compile();
  const services = container.findByTag("tag1");

  const service = services.values().next().value as InstancedService<TestClass>;

  assertEquals(services.size, 1);
  assertInstanceOf(service.instance, TestClass);
});

Deno.test(
  "should find the service with entry-style tag filtered by tag key",
  async () => {
    class TestClass {}

    const injector = new D_Injector();
    injector.register({
      id: "service.class",
      serviceClass: TestClass,
      tags: {
        tagCategory: ["tag1", "tag2"],
      },
    });

    const container = await injector.compile();
    const services = container.findByTag("tag1", "tagCategory");

    const service = services.values().next()
      .value as InstancedService<TestClass>;

    assertEquals(services.size, 1);
    assertInstanceOf(service.instance, TestClass);
  }
);

Deno.test(
  "should return empty array so the tag does not exist inside the tag category",
  async () => {
    class TestClass {}

    const injector = new D_Injector();
    injector.register({
      id: "service.class",
      serviceClass: TestClass,
      tags: {
        tagCategory: ["tag1", "tag2"],
        tagCategory2: ["tag3", "tag4"],
      },
    });

    const container = await injector.compile();
    const services = container.findByTag("tag3", "tagCategory");

    assertEquals(services.size, 0);
  }
);

Deno.test("Tags should be accessible from the service", async () => {
  class TestClass {}

  const injector = new D_Injector();
  injector.register<{
    tagCategory: string[];
    tagCategory2: string[];
  }>({
    id: "service.class",
    serviceClass: TestClass,
    tags: {
      tagCategory: ["tag1", "tag2"],
      tagCategory2: ["tag3", "tag4"],
    },
  });

  const container = await injector.compile();
  const service = container.get<TestClass>("service.class");

  assertEquals(service.tags, {
    tagCategory: ["tag1", "tag2"],
    tagCategory2: ["tag3", "tag4"],
  });
});

Deno.test("Shoud add a new service", async () => {
  class TestClass {}
  const injector = new D_Injector();
  const container = await injector.compile();
  container.setNewService("service.class", new TestClass());

  const service = container.get<TestClass>("service.class");

  assertInstanceOf(service.instance, TestClass);
});

Deno.test("Should add a new service with tags", async () => {
  class TestClass {}
  const injector = new D_Injector();
  const container = await injector.compile();
  container.setNewService("service.class", new TestClass(), {
    tagCategory: ["tag1", "tag2"],
  });

  const service = container.findByTag("tag1").values().next().value;

  assertInstanceOf(service.instance, TestClass);
});

Deno.test(
  "Should thorw an error if the service is already registered",
  async () => {
    class TestClass {}
    const injector = new D_Injector();
    const container = await injector.compile();
    container.setNewService("service.class", new TestClass());

    assertThrows(() => {
      container.setNewService("service.class", new TestClass());
    });
  }
);
