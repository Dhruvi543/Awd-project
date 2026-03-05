/**
 * Utility for structured logging of Soft Delete Lifecycle events.
 * Logs are outputted as JSON for easy ingestion by ELK, Datadog, etc.
 */

export const logLifecycleEvent = (eventData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "info",
    ...eventData
  };
  
  // In a real production system, this would pipe to a logger like Winston or Pino.
  // We use console.log to output the structured JSON directly into standard out.
  console.log(JSON.stringify(logEntry));
};
