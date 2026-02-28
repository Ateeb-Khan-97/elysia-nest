type ResponseMapperOptions = {
	status: number;
	message: string;
	data: unknown;
};

export function ResponseMapper(options?: Partial<ResponseMapperOptions>) {
	const responseOptions: ResponseMapperOptions = {
		status: options?.status || 200,
		message: options?.message || 'OK',
		data: options?.data || null,
	};

	return Response.json(
		{
			success: responseOptions.status >= 200 && responseOptions.status < 300,
			status: responseOptions.status,
			message: responseOptions.message,
			data: responseOptions.data,
		},
		{ status: responseOptions.status },
	);
}
