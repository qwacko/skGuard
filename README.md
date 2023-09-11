# skGuard

skGuard is a powerful route guarding utility for SvelteKit applications. It provides a flexible mechanism to guard routes based on custom validation logic, allowing developers to easily manage route access based on various conditions.

## Features

- Route-specific Checks: Define custom checks for each route in your application. The same route config can be used across any frontend guards and backend guards.
- Frontend Logic: Generates frontend logic that can be inserted into a `+layout.svelte` or `+page.svelte` page and generate a redirect regardless of whether a server side call is made.
- Client Load function `+page.ts`/`+page.js` : Returns a function that can be used in client load functions to auth guard a specific page / route.
- Backend Logic: Generates logic that can be included in `hooks.server.ts` and `+page.server.ts` files (load and action functions) to protect the endpoints at the server side.
- Route Type Checking: If the backend guard is placed into `+page.server.ts` files then type errors will be generated if a route is defined that doesn't exist in the route config.
- Custom redirect and error logic : Default error logic and redirect logic is implemented, however custom functions can be used if a specific approach is desired (i.e. include logging or a popup).
- Custom Validation: Use your own validation logic to determine access.
- Allow and Block Lists: Specify routes that should always be allowed or blocked.
- Default Behaviors: Set default behaviors for routes not explicitly configured.
- Support for POST Requests: Define custom behaviors for specific page actions (POST Requests).

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

```javascript
import { skGuard } from 'skGuard';
```

Define your route configurations and validation logic:

```javascript
const routeConfig = {
	'/protected-route': {
		check: (data) => (data.user ? null : '/login')
	}
};

const validationBackend = (requestData) => {
	return {
		user: requestData.locals.user
	};
};
```

Create the guard:

```javascript
const {
	backend: backendGuard,
	frontend: frintendGuard,
	clientLoad: clientLoadGuard
} = skGuard({
	routeConfig,
	validationBackend
});
```

## Protecting Through Hooks

You can protect all routes by including the bankend guard function into your hooks file as follows (note that a type override is required to avoid type errors on the route id):

```typescript
export const handle: Handle = async ({ event, resolve }) => {
	backendGuard(event as Parameters<typeof authGuard>[0]);

	return await resolve(event);
};
```

### Protecting Through +page.server.ts

Page load functions and actions can be protected by including the backendGuard fuction into the `+page.server.ts` file. This allows for typechecking of routes, or also a custom validation function to be used if data that is only available on a specific route should be used (i.e. route params such as /[id]/ determine whether a specific user should be able to access a page).

```typescript
import { authGuard } from '../../authGuardInstance.js';

#Example of using skAuth to guard specific routes.
export const load = (data) => {
	authGuard(data, (prevAuth) => {
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

### Protecting throuhg +layout.svelte

For client side routing protection with the same functionality as server side, a function is available that can be inserted into the `+layout.svelte` or `+page.svelte` file. THis will read the route id and provide a redirect or error as necessary.

Note: Due to the fact that client side data is inconsitent across pages, the developer must input the validation function output directly into the function when called in the `.svelte` file (see below).

```svelte
<script lang="ts">
	import { authGuardFrontend } from '../authGuardInstance.js';
	import { page } from '$app/stores';

	$: authGuardFrontend($page, { user: true });
</script>
```

if using front end logic, then the configuration of the skGuard must include the logic that is desired for any frontend redirection or error logic. See `redirectFuncFrontend` and `errorFuncFrontend` below.

```typescript
import { goto } from '$app/navigation';
import { skGuard } from '$lib/authGuard.js';

export const {
	backend: authGuard,
	frontend: authGuardFrontend,
	clientLoad: authGuardClientLoad
} = skGuard({
	routeConfig: {
		...
	}
	validationBackend: () => ({ user: true }),
	redirectFuncFrontend: (status, location) => goto(location),
	errorFuncFrontend: (status, body) => console.log('Auth Error : ', { status, body })
});

```

## API

### skGuard

The main function of skGuard. It takes in a configuration object and returns a function to guard routes.

Parameters

- routeConfig: Configuration object defining checks for each route.
- validation: Function to validate the request data.
- allowList: (Optional) List of routes that should always be allowed.
- blockList: (Optional) List of routes that should always be blocked.
- defaultAllow: (Optional) Default behavior when a route is not found in the config (true to allow, false to block).
- defaultBlockTarget: (Optional) Default redirect target when a route is blocked.
- routeNotFoundMessage: (Optional) Error message when a route is not found in the config.
- defaultAllowPOST: (Optional) Default behavior for POST requests when not explicitly configured.
- postNotAllowedMessage: (Optional) Error message for disallowed POST requests.

## Contributing

We welcome contributions to skGuard! If you find a bug or have a feature request, please open an issue. If you'd like to contribute code, please open a pull request.

## License

MIT
