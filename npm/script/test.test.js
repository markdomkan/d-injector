"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestClass = exports.ServiceClass = void 0;
const dntShim = __importStar(require("./_dnt.test_shims.js"));
const mod_js_1 = require("./mod.js");
class ServiceClass {
    test(text) {
        return text;
    }
}
exports.ServiceClass = ServiceClass;
class TestClass {
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
exports.TestClass = TestClass;
dntShim.Deno.test("Get by ID", () => {
    const injector = new mod_js_1.D_Injector();
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
    const injector = new mod_js_1.D_Injector();
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
    const injector = new mod_js_1.D_Injector();
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
