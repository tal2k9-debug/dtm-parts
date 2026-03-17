import { logger } from "./logger";
import type { LogSource } from "./logger";

// ── Retry with Exponential Backoff ──

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  source: LogSource;
  operation: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 15000, source, operation } = opts;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        const jitter = delay * (0.5 + Math.random() * 0.5);

        await logger.selfHealed(
          source,
          `${operation} נכשל (ניסיון ${attempt + 1}/${maxRetries + 1}), מנסה שוב בעוד ${Math.round(jitter)}ms`,
          `retry attempt ${attempt + 1}`,
          { error: String(err), attempt }
        );

        await new Promise((resolve) => setTimeout(resolve, jitter));
      }
    }
  }

  await logger.error(source, `${operation} נכשל סופית לאחר ${maxRetries + 1} ניסיונות`, {
    error: String(lastError),
  });

  throw lastError;
}

// ── Circuit Breaker ──

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerConfig {
  failureThreshold?: number; // failures before opening
  resetTimeoutMs?: number; // how long to stay open
  halfOpenMaxCalls?: number; // test calls in half-open
  source: LogSource;
  name: string;
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: 5,
      resetTimeoutMs: 60000, // 1 minute
      halfOpenMaxCalls: 1,
      ...config,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.state = "half-open";
        this.halfOpenCalls = 0;
        await logger.info(this.config.source, `Circuit breaker "${this.config.name}" עובר ל-half-open`);
      } else {
        throw new Error(`Circuit breaker "${this.config.name}" פתוח — השירות לא זמין זמנית`);
      }
    }

    if (this.state === "half-open" && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new Error(`Circuit breaker "${this.config.name}" בבדיקה — ממתין לתוצאות`);
    }

    try {
      if (this.state === "half-open") this.halfOpenCalls++;
      const result = await fn();

      // Success — reset
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
        await logger.selfHealed(
          this.config.source,
          `Circuit breaker "${this.config.name}" נסגר — השירות חזר לפעולה`,
          "circuit breaker reset"
        );
      } else if (this.failures > 0) {
        this.failures = 0;
      }

      return result;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.config.failureThreshold || this.state === "half-open") {
        this.state = "open";
        await logger.critical(this.config.source, `Circuit breaker "${this.config.name}" נפתח — ${this.failures} כשלונות רצופים`, {
          error: String(err),
        });
      }

      throw err;
    }
  }

  getState(): CircuitState {
    // Check if should transition from open to half-open
    if (this.state === "open" && Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
      return "half-open";
    }
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

// Singleton circuit breakers for external services
export const mondayCircuit = new CircuitBreaker({
  source: "monday_sync",
  name: "Monday.com API",
  failureThreshold: 3,
  resetTimeoutMs: 120000, // 2 minutes
});

export const whatsappCircuit = new CircuitBreaker({
  source: "whatsapp",
  name: "WhatsApp/Twilio",
  failureThreshold: 5,
  resetTimeoutMs: 300000, // 5 minutes
});

export const pusherCircuit = new CircuitBreaker({
  source: "chat",
  name: "Pusher",
  failureThreshold: 5,
  resetTimeoutMs: 60000,
});

// Helper: get status of all circuits
export function getCircuitStates() {
  return {
    monday: { state: mondayCircuit.getState(), failures: mondayCircuit.getFailures() },
    whatsapp: { state: whatsappCircuit.getState(), failures: whatsappCircuit.getFailures() },
    pusher: { state: pusherCircuit.getState(), failures: pusherCircuit.getFailures() },
  };
}
