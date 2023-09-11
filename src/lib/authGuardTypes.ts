export type allowedFunction<UserValidationOutput extends Record<string, boolean | string>> = (
	data: UserValidationOutput
) => string | undefined | null;

export type RouteConfig<UserValidationOutput extends Record<string, boolean | string>> = {
	check: allowedFunction<UserValidationOutput>;
	POSTCheck?: Record<string, allowedFunction<UserValidationOutput>>;
};

export type RouteConfigObjectType<UserValidationOutput extends Record<string, boolean | string>> = {
	[key: string]: RouteConfig<UserValidationOutput>;
};
