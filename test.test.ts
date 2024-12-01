
import { faker } from '@faker-js/faker';
import { expect, test } from "bun:test";
import { D_Injector, type InstancedService } from "./index.ts";

test("Get by ID", async () => {
  class TestClass { }

  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: TestClass,
  });

  const container = await injector.compile();
  const service = container.get<TestClass>("service.class");

  expect(service.instance).toBeInstanceOf(TestClass);
});

test("Find by tag", async () => {
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
  const serviceInstance = services.get(serviceKey as string);

  expect(services.size).toBe(1);
  expect(serviceKey).toBe("service.class");
  expect(serviceInstance?.instance).toBeInstanceOf(TestClass);
});

test(
  "The instance text and number should coincide with injected",
  async () => {
    class TestClass {
      constructor(public text: string, public number: number) { }
    }

    const randomText = faker.lorem.word();
    const randomNumber = faker.number.int();

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

    expect(service.instance.text).toBe(randomText);
    expect(service.instance.number).toBe(randomNumber);
  }
);

test(
  "The method execute from TestClass should return the injected text manipulated by the injected service",
  async () => {
    class ServiceClass {
      public addExclamation(text: string) {
        return `${text}!`;
      }
    }
    class TestClass {
      constructor(private service: ServiceClass, private text: string) { }

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
    expect(value).toBe("Hello World!");
  }
);

test("Method create from the Factory class should be called", async () => {
  class StringFactory {
    public create() {
      return "Hello World!";
    }
  }

  class TestClass {
    constructor(private text: string) { }

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

  expect(value).toBe("Hello World!");
});

test("Async method from factory", async () => {
  class StringFactory {
    public create(): Promise<string> {
      return Promise.resolve("Hello World!");
    }
  }

  class TestClass {
    constructor(private text: string) { }

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

  expect(value).toBe("Hello World!");
});

test("should find the service with entry-style tag", async () => {
  class TestClass { }

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

  expect(services.size).toBe(1);
  expect(service.instance).toBeInstanceOf(TestClass);
});

test(
  "should find the service with entry-style tag filtered by tag key",
  async () => {
    class TestClass { }

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

    expect(services.size).toBe(1);
    expect(service.instance).toBeInstanceOf(TestClass);
  }
);

test(
  "should return empty array so the tag does not exist inside the tag category",
  async () => {
    class TestClass { }

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

    expect(services.size).toBe(0);
  }
);

test("Tags should be accessible from the service", async () => {
  class TestClass { }

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

  expect(service.tags).toStrictEqual(
    {
      tagCategory: ["tag1", "tag2"],
      tagCategory2: ["tag3", "tag4"],
    }
  );
});

test("Shoud add a new service", async () => {
  class TestClass { }
  const injector = new D_Injector();
  const container = await injector.compile();
  container.setNewService("service.class", new TestClass());

  const service = container.get<TestClass>("service.class");

  expect(service.instance).toBeInstanceOf(TestClass);
});

test("Should add a new service with tags", async () => {
  class TestClass { }
  const injector = new D_Injector();
  const container = await injector.compile();
  container.setNewService("service.class", new TestClass(), {
    tagCategory: ["tag1", "tag2"],
  });

  const service = container.findByTag("tag1").values().next().value;

  expect(service?.instance).toBeInstanceOf(TestClass);
});

test(
  "Should thorw an error if the service is already registered",
  async () => {
    class TestClass { }
    const injector = new D_Injector();
    const container = await injector.compile();
    container.setNewService("service.class", new TestClass());

    expect(() => {
      container.setNewService("service.class", new TestClass());
    }).toThrow();
  }
);


test("Should override the service", async () => {
  class TestClass { }
  class TestClass2 { }
  const injector = new D_Injector();
  injector.register({
    id: "service.class",
    serviceClass: TestClass,
  });
  injector.override({
    id: "service.class",
    serviceClass: TestClass2,
  });
  const container = await injector.compile();
  const service = container.get<TestClass2>("service.class");

  expect(service.instance).toBeInstanceOf(TestClass2);
})

test("Should thorw error if service is not registered when trying to override", async () => {
  class TestClass { }
  const injector = new D_Injector();
  expect(() => {
    injector.override({
      id: "service.class",
      serviceClass: TestClass,
    });
  }).toThrow("Service service.class is not registered");
})