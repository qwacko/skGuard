# skGuard

skGuard is a powerful route guarding utility for SvelteKit applications. It provides a flexible mechanism to guard routes based on custom validation logic, allowing developers to easily manage route access based on various conditions.

The key objective is to make it easy to confirm what access is allowed in a single location, and protect all routes across all different ways of accessing pages (client-side or server-side routing)

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

```typescript
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

```typescript
const {
	backend: backendGuard,
	frontend: frontendGuard,
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

For client side routing protection with the same functionality as server side, a function is available that can be inserted into the `+layout.svelte` or `+page.svelte` file. THis will read the route id and provide a redirect or error as necessary.

Note: Due to the fact that client side data is inconsitent across pages, the developer must input the validation function output directly into the function when called in the `.svelte` file (see below).

```svelte
<script lang="ts">
	import { frontendGuard } from '../authGuardInstance.js';
	import { page } from '$app/stores';

	$: frontendGuard($page, { user: true });
</script>
```

if using front end logic, then the configuration of the skGuard must include the logic that is desired for any frontend redirection or error logic. See `redirectFuncFrontend` and `errorFuncFrontend` below.

```typescript
import { goto } from '$app/navigation';
import { skGuard } from '$lib/authGuard.js';

export const {
	backend: backendGuard,
	frontend: frontendGuard,
	clientLoad: clientLoadGuard
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

#### Route Config

The route configuration object defines the route behaviour for all routes that the route guard is to be used for. This is an object where the keys are the route name (including hidden routes, and layout groups, i.e. /blog/(primary)/view/[id]/ would be used rather than /blog/view/1234). Within each object item, there is the following functionality:

- check function : This takes in the output of the validation functionality, and will return undefined if access is allowed, or a url address that the user will be redirected to if not.
- POSTCheck : This is an object of different POST endpoints which can be individually checked. If the specific POST address is not found, then the "default" item will be used. This returns undefined for authorised, and any text will be returned as an error message.

```typescript
// Example route config (simple)
routeConfig: {
	'/users/[id]': {
		check: ({user}) => user ?   undefined : "/login",
		POSTCheck: {
			default: ({user}) => user.admin ? undefined : "Access Denied"
		}
	}
}
```

Because the routeConfig is a javascript object, it is possibly to defined specific filtering as a function and re-use the same functionality across multiple routes.

#### Parameters

- routeConfig: Configuration object defining checks for each route. Uses type `RouteConfigObject`.
- validationBackend: Function to produces the validation data that the functions in the routeConfig will be checked against. This provides access to the request informaiton, including locals. If items such as database access are necessary, then these may be included into the funciton.
- allowList: (Optional) List of routes that should always be allowed (array of strings). Note that allowList overrides blockList if the same route appears in both.
- blockList: (Optional) List of routes that should always be blocked (array of strings). Note that allowList overrides blockList if the same route appears in both.
- defaultAllow: (Optional) Default behavior when a route is not found in the config (true to allow, false to block).
- defaultBlockTarget: (Optional) Default redirect target when a route is not found or in the blockList.
- routeNotFoundMessage: (Optional) Error message when a route is not found in the config.
- defaultAllowPOST: (Optional) Default behavior for POST requests when not explicitly configured.
- postNotAllowedMessage: (Optional) Error message for disallowed POST requests.
- redirectFuncBackend: (Optional) Funciton called whenever a redirect is required in the backend logic. By default this uses the sveltekit redirection function.
- errorFuncBackend: (Optional) Function called whenever a route is not found, and there is no default redirect location. THis is called for every error in a POST request as redirects are not valid.
- redirectFuncFrontend: (Optional) Function used in client load function or .svelte file when a redirect is required. If either of these frontend use cases are utilised, then a redirect will not work unless these are customised, the default functionality is to log the redirect.
- errorFuncFrontend: (Optional) Functionality when an error is received in the frontend. Defaults to console logging the errors, but it is likely that a user of this would need to configure different behaviour.

## Contributing

We welcome contributions to skGuard! If you find a bug or have a feature request, please open an issue. If you'd like to contribute code, please open a pull request.

## License

MIT
