import { NextResponse } from "next/server";
import { logger } from "./logger";
import type { LogSource } from "./logger";

type HandlerFn = (request: Request, context?: unknown) => Promise<NextResponse>;

// Wraps an API handler with consistent error handling and logging
export function withErrorHandling(source: LogSource, handler: HandlerFn): HandlerFn {
  return async (request: Request, context?: unknown) => {
    const start = Date.now();
    try {
      const response = await handler(request, context);

      // Log slow requests
      const duration = Date.now() - start;
      if (duration > 5000) {
        await logger.warn(source, `בקשה איטית: ${request.method} ${new URL(request.url).pathname} (${duration}ms)`, {
          method: request.method,
          url: request.url,
          duration,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      await logger.error(source, `שגיאה לא מטופלת: ${String(error)}`, {
        method: request.method,
        url: request.url,
        duration,
        error: error instanceof Error ? error.stack : String(error),
      });

      return NextResponse.json(
        { error: "שגיאת שרת פנימית" },
        { status: 500 }
      );
    }
  };
}
