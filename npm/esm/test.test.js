import * as dntShim from "./_dnt.test_shims.js";
import { D_Injector } from "./mod.js";
export class ServiceClass {
    test(text) {
        return text;
    }
}
export class TestClass {
    constructor(service, text) {
        Object.defineProperty(this, "service", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: service
        });
        Object.defineProperty(this, "text", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: text
        });
    }
    test() {
        return this.service.test(this.text);
    }
}
dntShim.Deno.test("Get by ID", () => {
    const injector = new D_Injector();
    injector.register({
        id: "service.class",
        serviceClass: ServiceClass,
    });
    const container = injector.compile();
    const value = container
        .get("service.class")
        .test("Hello World");
    if (value !== "Hello World") {
        throw new Error("Value is not equal to Hello World");
    }
});
dntShim.Deno.test("Find by tag", () => {
    const injector = new D_Injector();
    injector.register({
        id: "service.class",
        serviceClass: ServiceClass,
        tags: ["test"],
    });
    const container = injector.compile();
    const value = container
        .findByTag("test")[0]
        .test("Hello World");
    if (value !== "Hello World") {
        throw new Error("Value is not equal to Hello World");
    }
});
dntShim.Deno.test("Injection with all possible elements", () => {
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
    const value = container.get("test.class").test();
    if (value !== "Hello World") {
        throw new Error("Value is not equal to Hello World");
    }
});
