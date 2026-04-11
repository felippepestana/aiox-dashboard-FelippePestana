/**
 * CNJ SINAPSES Client
 * Client for the National AI Model Hosting and Auditability Platform.
 * 150+ AI models deployed by 29 courts and councils.
 * Supports precedent analysis, case classification, and theme matching.
 */

export interface SinapsesModel {
  id: string;
  name: string;
  tribunal: string;
  description: string;
  type: 'classification' | 'extraction' | 'prediction' | 'similarity';
  version: string;
  accuracy: number;
  lastUpdated: string;
}

export interface SinapsesClassification {
  modelId: string;
  input: string;
  classifications: {
    label: string;
    confidence: number;
    metadata?: Record<string, unknown>;
  }[];
  processingTime: number;
}

export interface SinapsesSimilarity {
  modelId: string;
  sourceText: string;
  results: {
    documentId: string;
    score: number;
    excerpt: string;
  }[];
  processingTime: number;
}

export class SinapsesClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl?: string; apiKey: string }) {
    this.baseUrl = config.baseUrl || 'https://sinapses.cnj.jus.br/api/v1';
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options?: { method?: string; body?: unknown }
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options?.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`SINAPSES API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * List available AI models.
   */
  async listModels(type?: string): Promise<SinapsesModel[]> {
    const endpoint = type ? `/models?type=${type}` : '/models';
    return this.request(endpoint);
  }

  /**
   * Classify a document using a specific model.
   * Useful for theme classification (VICTOR-like), document type identification.
   */
  async classify(modelId: string, text: string): Promise<SinapsesClassification> {
    return this.request(`/models/${modelId}/classify`, {
      method: 'POST',
      body: { text },
    });
  }

  /**
   * Find similar documents using a similarity model.
   * Useful for PEDRO-like precedent matching.
   */
  async findSimilar(
    modelId: string,
    text: string,
    limit?: number
  ): Promise<SinapsesSimilarity> {
    return this.request(`/models/${modelId}/similarity`, {
      method: 'POST',
      body: { text, limit: limit || 10 },
    });
  }

  /**
   * Extract entities from legal text.
   * Useful for identifying parties, dates, values, legal references.
   */
  async extractEntities(
    modelId: string,
    text: string
  ): Promise<{
    entities: { type: string; value: string; position: number; confidence: number }[];
  }> {
    return this.request(`/models/${modelId}/extract`, {
      method: 'POST',
      body: { text },
    });
  }
}
