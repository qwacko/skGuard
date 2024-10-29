/**
 * Custom error codes for different authentication failure scenarios
 */
export enum AuthGuardErrorCode {
	ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
	POST_NOT_ALLOWED = 'POST_NOT_ALLOWED',
	ACCESS_DENIED = 'ACCESS_DENIED',
	VALIDATION_FAILED = 'VALIDATION_FAILED'
}

/**
 * Function type for route validation that returns either:
 * - undefined/null if access is allowed
 * - a string URL to redirect to if access is denied
 */
export type allowedFunction<UserValidationOutput extends Record<string, boolean | string>> = (
	data: UserValidationOutput
) => string | undefined | null;

/**
 * Configuration for a specific route, including:
 * - check: Main validation function for the route
 * - POSTCheck: Optional record of validation functions for POST requests
 */
export type RouteConfig<UserValidationOutput extends Record<string, boolean | string>> = {
	/** Main validation function that runs for all requests to this route */
	check: allowedFunction<UserValidationOutput>;
	/**
	 * Optional POST request validation functions.
	 * Keys are POST action identifiers, with 'default' as fallback.
	 * Each function returns undefined if allowed, or error message if denied.
	 */
	POSTCheck?: Record<string, allowedFunction<UserValidationOutput>>;
};

/**
 * Complete route configuration object mapping route paths to their configs.
 * Example:
 * ```typescript
 * {
 *   '/users': {
 *     check: ({user}) => user ? undefined : '/login',
 *     POSTCheck: {
 *       'create': ({user}) => user.isAdmin ? undefined : 'Admin access required'
 *     }
 *   }
 * }
 * ```
 */
export type RouteConfigObjectType<UserValidationOutput extends Record<string, boolean | string>> = {
	[key: string]: RouteConfig<UserValidationOutput>;
};

/**
 * Internal result type used by the core authentication logic
 */
export type CoreAuthResult =
	| { type: 'redirect'; redirectAddress: string }
	| { type: 'error'; errorMessage: string; code: AuthGuardErrorCode }
	| { type: 'authorised' };
