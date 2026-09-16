/**
 * JARVIS v2.0 — SSE Streaming Service
 * Handles Server-Sent Events for real-time AI response streaming.
 * Provides token-by-token delivery with step tracking and metadata.
 */

const BASE_URL = 'http://localhost:8000/api';

export interface StreamStep {
  step_index?: number;
  title: string;
  tool?: string;
  status: string;
  message?: string;
}

export interface StreamMeta {
  intent?: string;
  model_used?: string;
  mode_used?: string;
  route_reason?: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
}

export interface StreamCallbacks {
  onStatus?: (status: string, message?: string) => void;
  onStep?: (step: StreamStep) => void;
  onMeta?: (meta: StreamMeta) => void;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string, meta?: StreamMeta) => void;
  onError?: (error: string) => void;
}

export class JarvisSSEService {
  private controller: AbortController | null = null;

  /**
   * Stream a chat message from JARVIS via SSE.
   * Returns a promise that resolves with the full reply text when done.
   */
  async streamChat(
    message: string,
    sessionId: string = 'default',
    mode: string = 'auto',
    modelOverride?: string,
    callbacks: StreamCallbacks = {}
  ): Promise<{ text: string; meta?: StreamMeta }> {
    // Abort any previous stream
    this.abort();
    this.controller = new AbortController();

    let fullText = '';
    let lastMeta: StreamMeta | undefined;

    try {
      const response = await fetch(`${BASE_URL}/stream/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          mode,
          model_override: modelOverride || null
        }),
        signal: this.controller.signal
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Stream request failed: ${response.status} — ${errText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null — SSE not supported?');
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const event = JSON.parse(dataStr);
            
            switch (event.type) {
              case 'status':
                callbacks.onStatus?.(event.status, event.message);
                break;

              case 'step':
                callbacks.onStep?.(event.step as StreamStep);
                break;

              case 'meta':
                lastMeta = {
                  intent: event.intent,
                  model_used: event.model_used,
                  mode_used: event.mode_used,
                  route_reason: event.route_reason,
                  sources: event.sources || []
                };
                callbacks.onMeta?.(lastMeta);
                break;

              case 'token':
                if (event.token) {
                  fullText += event.token;
                  callbacks.onToken?.(event.token);
                }
                break;

              case 'done':
                callbacks.onComplete?.(fullText, lastMeta);
                return { text: fullText, meta: lastMeta };

              case 'error':
                callbacks.onError?.(event.message || 'Unknown stream error');
                throw new Error(event.message || 'Stream error from server');
            }
          } catch (parseErr) {
            // Ignore malformed SSE lines
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      // Stream ended without 'done' event
      callbacks.onComplete?.(fullText, lastMeta);
      return { text: fullText, meta: lastMeta };

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { text: fullText, meta: lastMeta };
      }
      callbacks.onError?.(err.message || String(err));
      throw err;
    } finally {
      this.controller = null;
    }
  }

  /**
   * Abort the current stream (user pressed Stop).
   */
  abort(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  /**
   * Test SSE connectivity.
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/stream/ping`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const jarvisSSEService = new JarvisSSEService();
