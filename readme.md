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

The D-injector is configured using the `register` method. This method receives an object with the following properties:

- `id`: The id of the service. This id is used to get the service from the container.
- `serviceClass`: The class of the service. This class will be instantiated by the container.
- `args`: The arguments that the service needs to be instantiated. The arguments can be services, factories, or values.
- `tags`: The tags of the service. The tags can be used to find the services by tag. The tags can be a string array or `Record<string, string[]>`. The "Record" mode is useful if you want to add some categories to your tags.

### Arguments

The arguments can be services, factories, or values.

#### Service

The service argument is used to inject a service into another service. The service argument is an object with the following properties:

- `type`: The type of the argument. In this case, the type is `service`.
- `ref`: The id of the service that you want to inject.

#### Factory

The factory argument is used to inject the result of a factory method. The factory argument is an object with the following properties:

- `type`: The type of the argument. In this case, the type is `service`.
- `ref`: The id of the service that you want to inject.
- `method`: The name of the method that you want to call.

#### Value

The value argument is used to inject a value into a service. The value argument is an object with the following properties:

- `type`: The type of the argument. In this case, the type is `value`.
- `value`: The value that you want to inject. This value can be a number, a string, a boolean, an array, an object, or a function.

## Container

The container is the object that you will use to get the services from the container. The container has the following methods:

- `get`: This method receives the id of the service that you want to get.
- `findByTag`: This method receives the tag that you want to find. The method returns a map with the services that have the tag. The map has the id of the service as key and the service instance as value. if you use the "Record" mode, you can add the category of the tag as second parameter.

All methods return the InstancedService Object. This object has the following properties:

- `instance`: The instance of the service.
- `tags`: The tags of the service.

_If you need more information or code examples, you can see the test files._

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
        ref: "service.class",
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

You can add some tags to your services, and then you can find them by tag.

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
        ref: "factory",
      },
    ],
  })
  .register({
    id: "factory",
    serviceClass: StringFactory,
    method: "create",
  });
```
