import apiClient from './api-client';

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantToolCall {
  name: string;
  arguments: Record<string, any>;
  result: any;
}

export interface AssistantQueryResult {
  answer: string;
  toolCalls: AssistantToolCall[];
}

export const assistantApi = {
  async query(
    question: string,
    history: AssistantHistoryMessage[] = [],
  ): Promise<AssistantQueryResult> {
    const { data } = await apiClient.post<AssistantQueryResult>('/assistant/query', {
      question,
      history,
    });
    return data;
  },
};
