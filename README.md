# skGuard

skGuard is a powerful route guarding utility for SvelteKit applications. It provides a flexible mechanism to guard routes based on custom validation logic, allowing developers to easily manage route access based on various conditions.

## Features

- Route-specific Checks: Define custom checks for each route in your application.
- Custom Validation: Use your own validation logic to determine access.
- Allow and Block Lists: Specify routes that should always be allowed or blocked.
- Default Behaviors: Set default behaviors for routes not explicitly configured.
- Support for POST Requests: Define custom behaviors for POST requests.

## Installation

Using npm:

```bash
npm install skGuard
```

## Usage

Import the combinedAuthGuard function:

```javascript
import { combinedAuthGuard } from 'skGuard';
```

Define your route configurations and validation logic:

```javascript
const routeConfig = {
	'/protected-route': {
		check: (data) => (data.user ? null : '/login')
	}
};

const validation = (requestData) => {
	return {
		user: requestData.locals.user
	};
};
```

Create the guard:

```javascript
const guard = combinedAuthGuard({
	routeConfig,
	validation
});
```

Use the guard in your routes:
TBC

## API

### combinedAuthGuard

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
