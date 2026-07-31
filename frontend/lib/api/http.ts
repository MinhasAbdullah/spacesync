import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonData<T>(data: T, status = 200, meta?: unknown) {
  return NextResponse.json(meta === undefined ? { data } : { data, meta }, {
    status,
  });
}

export function jsonMessage(message: string, status = 200) {
  return NextResponse.json({ data: { message } }, { status });
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  return schema.parse(body);
}

export function parseQuery<T>(request: Request, schema: ZodType<T>) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return schema.parse(params);
}

export async function parseParams<T>(
  paramsPromise: Promise<unknown>,
  schema: ZodType<T>,
) {
  return schema.parse(await paramsPromise);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request did not match the expected schema.",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  const externalError = error as {
    name?: string;
    status?: number;
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  if (
    externalError?.name?.includes("Auth") ||
    (externalError?.status && externalError.status >= 400 && externalError.status < 500)
  ) {
    const status = externalError.status === 401 ? 401 : 400;
    return NextResponse.json(
      {
        error: {
          code: externalError.code ?? "AUTH_ERROR",
          message: externalError.message ?? "Authentication request failed.",
        },
      },
      { status },
    );
  }

  const databaseError = externalError;

  if (databaseError?.code === "23P01") {
    return NextResponse.json(
      {
        error: {
          code: "BOOKING_CONFLICT",
          message: "This resource is already booked for the requested time.",
          details: databaseError.details,
        },
      },
      { status: 409 },
    );
  }

  if (databaseError?.code === "23505") {
    return NextResponse.json(
      {
        error: {
          code: "DUPLICATE_RECORD",
          message: "A record with the same unique value already exists.",
          details: databaseError.details,
        },
      },
      { status: 409 },
    );
  }

  if (databaseError?.code === "23503") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REFERENCE",
          message: "A referenced record does not exist or is still in use.",
          details: databaseError.details,
        },
      },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred.",
      },
    },
    { status: 500 },
  );
}

export function throwIfDatabaseError(error: unknown) {
  if (error) throw error;
}
