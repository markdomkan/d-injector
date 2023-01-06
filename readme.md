# Introduction

D-injector is a really simple and tinny dependency injection library for Deno or Node.js.

# Installation

## Deno

```ts
import { Injector } from "https://deno.land/x/d_injector/mod.ts";

//...
```

## Node.js

```shell
    npm install @markdomkan/d-injector

```

or

```shell
    yarn add @markdomkan/d-injector

```

## Configuration

You can inject other classes that must be instanced as in the previous examples. Numbers, strings, booleans, arrays, objects... can be injected as well.

The system also supports the injection of results of callings to methods of services; factories.

See the examples below.

_If you need more information, you can see the test files._

## Usage

### Simple example

Inject a service into a class and get it from the container using his id.

```ts
// Import the injector, if you are in Deno, you will have some like this:
//
// import { Injector } from "https://deno.land/x/d_injector@1.0/mod.ts";
//
// if you are in Node.js, you will have something like this:
//
// import { Injector } from "@markdomkan/d-injector";

import { TestClass } from "./test-class.ts";
import { ServiceClass } from "./service-class.ts";

const injector = new D_Injector();
injector
  .register({
    id: "test.class",
    serviceClass: TestClass,
    tags: {
      "tag-category": ["tag1"],
      TagCategory: ["tag2", "tag3"],
    },
    args: [
      {
        type: "service",
        id: "service.class",
      },
    ],
  })
  .register({
    id: "service.class",
    serviceClass: ServiceClass,
  });

const container = injector.compile();
const myTestClassInstance = container.get<TestClass>("test.class");

myTestClassInstance.instance.someAwesomeMethod();

// You can also get the tags of the service. Usefull to get some extra information about the service.
myTestClassInstance.tags.tagCategory; // ["tag1"]
```

### Adding some tags

You can add some tags to your services, and then you can find them by tag. The tags can be a string array or `Record<string, string[]>`. The "Record" mode is useful if you want to add some categories to your tags.

```ts
const injector = new D_Injector();
injector
  .register({
    id: "service.1",
    serviceClass: ServiceClassOne,
    tags: ["super-tag"],
  })

  .register({
    id: "service.2",
    serviceClass: ServiceClassTwo,
    tags: ["super-tag", "awesome-tag"],
  })

  .register({
    id: "service.3",
    serviceClass: ServiceClassTwo,
    tags: {
      specialCategoryTags: ["super-tag", "awesome-tag"],
      otherCategoryTags: ["simply-tag"],
    },
  })

  .register({
    id: "service.4",
    serviceClass: ServiceClassThree,
    tags: ["awesome-tag"],
  });

const container = injector.compile();

const allInjectedServicesWithSuperTagMap =
  container.findByTag<ServiceClass>("super-tag"); // service.1, service.2, service.3

const allInjectedServicesWithAwesomeTagMap =
  container.findByTag<ServiceClass>("awesome-tag"); // service.2, service.3, service.4

// If you use the "Record" mode, you can find the services by category and tag.
const only3InjectedService = container.findByTag<ServiceClass>(
  "awesome-tag",
  "specialCategoryTags"
); // service.3
```

### Factory

You can use a factory classes to create your services. You only need to add the method name to the register method. The D-injector will instance the factory class with all arguments and then call the method. The result of the method is what the D-injector will inject.

```ts
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
```
