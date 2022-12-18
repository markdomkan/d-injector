import { D_Injector } from "./main.ts";

export class ServiceClass {
  public test() {
    console.log("test");
  }
}
export class TestClass {
  constructor(private service: ServiceClass) {}

  public test() {
    this.service.test();
  }
}

const injector = new D_Injector();
injector
  .register({
    id: "service.class",
    serviceClass: ServiceClass,
  })
  .register({
    id: "test.class",
    serviceClass: TestClass,
    args: [
      {
        type: "service",
        id: "service.class",
      },
    ],
  });

const container = injector.build();
container.get<TestClass>("test.class").test();
