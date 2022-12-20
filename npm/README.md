# Introduction

D-injector is a really simple and tinny dependency injection library for Deno or Node.js.

# Installation

## Deno

```ts
import { Injector } from "https://deno.land/x/d_injector@1.0/mod.ts";

//...
```

## Node.js

```shell
    npm install @markdomkan/wall_e

```

or

```shell
    yarn add @markdomkan/wall_e

```

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
// import { Injector } from "@markdomkan/wall_e";

import { TestClass } from "./test-class.ts";
import { ServiceClass } from "./service-class.ts";

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
    ],
  })
  .register({
    id: "service.class",
    serviceClass: ServiceClass,
    tags: ["test"],
  });

const container = injector.compile();
const myTestClassInstance = container.get<TestClass>("test.class");
myTestClassInstance.someAwesomeMethod();
```

### Adding some tags

You can add some tags to your services, and then you can find them by tag.

```ts
const injector = new D_Injector();
injector
  .register({
    id: "service.class",
    serviceClass: ServiceClassOne,
    tags: ["super-tag"],
  })

  .register({
    id: "service.class",
    serviceClass: ServiceClassTwo,
    tags: ["super-tag", "awesome-tag"],
  })

  .register({
    id: "service.class",
    serviceClass: ServiceClassThree,
    tags: ["awesome-tag"],
  });

const container = injector.compile();
const allInjectedServicesWithSuperTag =
  container.findByTag<ServiceClass>("super-tag");

const allInjectedServicesWithAwesomeTag =
  container.findByTag<ServiceClass>("awesome-tag");
```

### Using a factory

You can use a factory to create your services.

```ts
const injector = new D_Injector();
injector.register({
  id: "service.class",
  factory: () => {
    return new ServiceClass();
  },
});

const container = injector.compile();
```
