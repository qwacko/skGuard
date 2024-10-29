# skGuard

skGuard is a powerful route guarding utility for SvelteKit applications. It provides a flexible mechanism to guard routes based on custom validation logic, allowing developers to easily manage route access based on various conditions.

The key objective is to make it easy to confirm what access is allowed in a single location, and protect all routes across all different ways of accessing pages (client-side or server-side routing)

## Features

- Route-specific Checks: Define custom checks for each route in your application. The same route config can be used across any frontend guards and backend guards.
- Frontend Logic: Generates frontend logic that can be inserted into a `+layout.svelte` or `+page.svelte` page and generate a redirect regardless of whether a server side call is made.
- Client Load function `+page.ts`/`+page.js` : Returns a function that can be used in client load functions to auth guard a specific page / route.
- Backend Logic: Generates logic that can be included in `hooks.server.ts` and `+page.server.ts` files (load and action functions) to protect the endpoints at the server side.
- Route Type Checking: If the backend guard is placed into `+page.server.ts` files then type errors will be generated if a route is defined that doesn't exist in the route config.
- Custom redirect and error logic: Default error logic and redirect logic is implemented, however custom functions can be used if a specific approach is desired (i.e. include logging or a popup).
- Custom Validation: Use your own validation logic to determine access.
- Allow and Block Lists: Specify routes that should always be allowed or blocked.
- Default Behaviors: Set default behaviors for routes not explicitly configured.
- Support for POST Requests: Define custom behaviors for specific page actions (POST Requests).
- Improved Error Handling: Specific error codes and messages for different types of authentication failures.
- Type-Safe Implementation: Comprehensive TypeScript support with strict type checking.

## Installation

```bash
# npm
npm install skGuard

# pnpm
pnpm add skGuard
```

## Usage

### Example

The skGuard code includes examples of all the functionality described below.

### Define Functionality

Import the skGuard function:

```typescript
import { skGuard } from 'skGuard';
```

Define your route configurations and validation logic:

```typescript
const routeConfig = {
  '/protected-route': {
    check: (data) => (data.user ? null : '/login'),
    POSTCheck: {
      'create': (data) => (data.user.isAdmin ? null : 'Admin access required')
    }
  }
};

const validationBackend = (requestData) => {
  return {
    user: requestData.locals.user
  };
};
```

Create the guard:

```typescript
const {
  backend: backendGuard,
  frontend: frontendGuard,
  clientLoad: clientLoadGuard
} = skGuard({
  routeConfig,
  validationBackend,
  allowList: ['/login', '/public'],
  defaultBlockTarget: '/login'
});
```

## Error Handling

skGuard provides specific error codes for different authentication failure scenarios:

```typescript
enum AuthGuardErrorCode {
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',   // Route not found in configuration
  POST_NOT_ALLOWED = 'POST_NOT_ALLOWED',  // POST request not allowed for route
  ACCESS_DENIED = 'ACCESS_DENIED',        // Access denied by validation
  VALIDATION_FAILED = 'VALIDATION_FAILED' // Validation function failed
}
```

You can customize error handling by providing custom error functions:

```typescript
const guard = skGuard({
  // ... other config
  errorFuncBackend: (status, body) => {
    console.error(`Auth Error (${status}):`, body);
    error(status, body);
  },
  errorFuncFrontend: (status, body) => {
    console.error(`Client Auth Error (${status}):`, body);
    // Custom client-side error handling
  }
});
```

## Protecting Through Hooks

You can protect all routes by including the backend guard function into your hooks file as follows (note that a type override is required to avoid type errors on the route id):

```typescript
export const handle: Handle = async ({ event, resolve }) => {
  backendGuard(event as Parameters<typeof authGuard>[0]);

  return await resolve(event);
};
```

### Protecting Through +page.server.ts

Page load functions and actions can be protected by including the backendGuard function into the `+page.server.ts` file. This allows for typechecking of routes, or also a custom validation function to be used if data that is only available on a specific route should be used (i.e. route params such as /[id]/ determine whether a specific user should be able to access a page).

```typescript
import { backendGuard } from '../../authGuardInstance.js';

// Example of using skAuth to guard specific routes.
export const load = (data) => {
  backendGuard(data, (prevAuth) => {
    if (!prevAuth.user || data.params.id === 'idBlocked') {
      return '/server/idAllowed';
    }
    return undefined;
  });

  return {
    routeParam: data.params.id
  };
};
```

Note: The custom validation function is provided with the default validation output, and returns either a url to redirect to, or undefined to allow the current page to be used.

### Protecting Through +layout.svelte

For client side routing protection with the same functionality as server side, a function is available that can be inserted into the `+layout.svelte` or `+page.svelte` file. This will read the route id and provide a redirect or error as necessary.

Note: Due to the fact that client side data is inconsistent across pages, the developer must input the validation function output directly into the function when called in the `.svelte` file (see below).

```svelte
<script lang="ts">
  import { frontendGuard } from '../authGuardInstance.js';
  import { page } from '$app/stores';

  $: frontendGuard($page, { user: true });
</script>
```

If using front end logic, then the configuration of the skGuard must include the logic that is desired for any frontend redirection or error logic. See `redirectFuncFrontend` and `errorFuncFrontend` below.

```typescript
import { goto } from '$app/navigation';
import { skGuard } from '$lib/authGuard.js';

export const {
  backend: backendGuard,
  frontend: frontendGuard,
  clientLoad: clientLoadGuard
} = skGuard({
  routeConfig: {
    // ... route config
  },
  validationBackend: () => ({ user: true }),
  redirectFuncFrontend: (status, location) => goto(location),
  errorFuncFrontend: (status, body) => console.log('Auth Error : ', { status, body })
});
```

## Type Safety

skGuard is built with TypeScript and provides comprehensive type safety:

- Route configuration is type-checked against your validation data
- Custom validation functions are properly typed with your validation data type
- Error handling functions receive proper status code types
- Generic type constraints ensure type safety across the library

## Contributing

We welcome contributions to skGuard! If you find a bug or have a feature request, please open an issue. If you'd like to contribute code, please open a pull request.

## License

MIT
