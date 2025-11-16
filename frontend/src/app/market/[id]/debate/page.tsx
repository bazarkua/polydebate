"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Market, type Model, type DebateStartResponse, type DebateMessage, type DebateResults } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Link from "next/link";

type DebateStatus = 'setup' | 'starting' | 'streaming' | 'completed' | 'error';

export default function DebatePage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [rounds, setRounds] = useState(3);
  const [status, setStatus] = useState<DebateStatus>('setup');
  const [debateId, setDebateId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [debateResults, setDebateResults] = useState<DebateResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch market details and available models
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [marketData, modelsData] = await Promise.all([
          apiClient.getMarket(marketId),
          apiClient.getModels(),
        ]);
        setMarket(marketData);
        // Filter to only supported models
        setModels(modelsData.models.filter(m => m.supported));
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (marketId) {
      fetchData();
    }
  }, [marketId]);

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        if (prev.length >= 4) {
          return prev; // Max 4 models
        }
        return [...prev, modelId];
      }
    });
  };

  const handleStartDebate = async () => {
    if (selectedModels.length === 0) {
      setError('Please select at least one AI model');
      return;
    }

    try {
      setStatus('starting');
      setError(null);
      setMessages([]);
      setCurrentRound(0);

      const response: DebateStartResponse = await apiClient.startDebate({
        market_id: marketId,
        model_ids: selectedModels,
        rounds: rounds,
      });

      setDebateId(response.debate_id);
      setStatus('streaming');

      // Start SSE stream
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const eventSource = new EventSource(`${API_BASE_URL}/api/debate/${response.debate_id}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('debate_started', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        handleStreamEvent('debate_started', data);
      });

      eventSource.addEventListener('model_thinking', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        handleStreamEvent('model_thinking', data);
      });

      eventSource.addEventListener('message', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        handleStreamEvent('message', data);
      });

      eventSource.addEventListener('round_complete', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        handleStreamEvent('round_complete', data);
      });

      eventSource.addEventListener('debate_complete', async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        handleStreamEvent('debate_complete', data);
        eventSource.close();
        eventSourceRef.current = null;

        // Fetch results
        try {
          const results = await apiClient.getDebateResults(response.debate_id);
          setDebateResults(results);
          setStatus('completed');
        } catch (err) {
          console.error('Error fetching results:', err);
        }
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data || '{}');
          handleStreamEvent('error', data);
        } catch (err) {
          console.error('Error parsing error event:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        if (eventSource.readyState === EventSource.CLOSED) {
          setError('Connection to debate stream lost');
        }
      };

    } catch (err) {
      console.error('Error starting debate:', err);
      setError(err instanceof Error ? err.message : 'Failed to start debate');
      setStatus('error');
    }
  };

  const handleStreamEvent = (eventType: string, data: any) => {
    switch (eventType) {
      case 'message':
        setMessages(prev => [...prev, data as DebateMessage]);
        break;
      case 'round_complete':
        setCurrentRound(data.next_round || data.round + 1);
        break;
      case 'debate_complete':
        setCurrentRound(data.total_rounds || rounds);
        break;
      case 'error':
        setError(data.message || 'An error occurred during the debate');
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <LoadingSpinner size="lg" />
        <p style={{ color: "var(--foreground-secondary)" }}>Loading market details...</p>
      </div>
    );
  }

  if (error && status === 'setup') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--color-red)" }}>Error</h1>
          <p className="mb-6" style={{ color: "var(--foreground-secondary)" }}>{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 rounded"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-white)" }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Market Not Found</h1>
          <Link
            href="/"
            className="inline-block px-6 py-2 rounded"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-white)" }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-block mb-4 text-sm"
            style={{ color: "var(--color-primary)" }}
          >
            ← Back to Markets
          </Link>
          <h1 className="text-3xl font-bold mb-2">{market.question}</h1>
          {market.description && (
            <p className="text-base" style={{ color: "var(--foreground-secondary)" }}>
              {market.description}
            </p>
          )}
        </div>

        {/* Setup Phase */}
        {status === 'setup' && (
          <div className="space-y-6">
            {/* Market Info */}
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <h2 className="text-xl font-semibold mb-4">Market Information</h2>
              <div className="space-y-2">
                {market.outcomes.map((outcome, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span>{outcome.name}</span>
                    <span className="font-medium">{(outcome.price * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <h2 className="text-xl font-semibold mb-4">
                Select AI Models ({selectedModels.length}/4)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {models.map((model) => (
                  <label
                    key={model.id}
                    className="flex items-center gap-3 p-3 rounded cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: selectedModels.includes(model.id)
                        ? "var(--color-primary)"
                        : "var(--color-charcoal)",
                      color: "var(--color-white)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.id)}
                      onChange={() => handleModelToggle(model.id)}
                      disabled={!selectedModels.includes(model.id) && selectedModels.length >= 4}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm opacity-80">{model.provider}</div>
                    </div>
                    {model.is_free && (
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                        Free
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Rounds Configuration */}
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <h2 className="text-xl font-semibold mb-4">Number of Rounds</h2>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRounds(num)}
                    className="px-4 py-2 rounded font-medium transition-colors"
                    style={{
                      backgroundColor: rounds === num ? "var(--color-primary)" : "var(--color-charcoal)",
                      color: "var(--color-white)",
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartDebate}
              disabled={selectedModels.length === 0}
              className="w-full py-4 rounded-lg font-semibold text-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-white)",
              }}
            >
              Start AI Debate
            </button>
          </div>
        )}

        {/* Streaming Phase */}
        {status === 'streaming' && (
          <div className="space-y-6">
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Live Debate</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm">Round {currentRound} of {rounds}</span>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" />
                    <p className="mt-4" style={{ color: "var(--foreground-secondary)" }}>
                      Waiting for AI models to respond...
                    </p>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded"
                      style={{
                        backgroundColor: "var(--color-charcoal)",
                        color: "var(--color-white)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{message.model_name}</div>
                        <div className="text-sm opacity-80">
                          Round {message.round} • {message.message_type}
                        </div>
                      </div>
                      <p className="mb-3">{message.text}</p>
                      {Object.keys(message.predictions).length > 0 && (
                        <div className="flex gap-4 text-sm">
                          {Object.entries(message.predictions).map(([outcome, percentage]) => (
                            <div key={outcome}>
                              <span className="opacity-80">{outcome}:</span>{" "}
                              <span className="font-semibold">{percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completed Phase */}
        {status === 'completed' && debateResults && (
          <div className="space-y-6">
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <h2 className="text-2xl font-semibold mb-6">Debate Results</h2>

              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Summary</h3>
                <p className="mb-4" style={{ color: "var(--foreground-secondary)" }}>
                  {debateResults.summary.overall}
                </p>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Consensus</h4>
                  <p style={{ color: "var(--foreground-secondary)" }}>
                    {debateResults.summary.consensus}
                  </p>
                </div>
              </div>

              {/* Final Predictions */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Final Predictions</h3>
                <div className="space-y-3">
                  {Object.entries(debateResults.final_predictions).map(([modelName, data]) => (
                    <div
                      key={modelName}
                      className="p-4 rounded"
                      style={{
                        backgroundColor: "var(--color-charcoal)",
                        color: "var(--color-white)",
                      }}
                    >
                      <div className="font-semibold mb-2">{modelName}</div>
                      <div className="flex gap-4 mb-2">
                        {Object.entries(data.predictions).map(([outcome, percentage]) => (
                          <div key={outcome}>
                            <span className="opacity-80">{outcome}:</span>{" "}
                            <span className="font-semibold">{percentage}%</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm opacity-80">Change: {data.change}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Rationales */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Model Rationales</h3>
                <div className="space-y-4">
                  {debateResults.summary.model_rationales.map((rationale, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded"
                      style={{
                        backgroundColor: "var(--color-charcoal)",
                        color: "var(--color-white)",
                      }}
                    >
                      <div className="font-semibold mb-2">{rationale.model}</div>
                      <p className="mb-2">{rationale.rationale}</p>
                      <div className="text-sm">
                        <div className="font-semibold mb-1">Key Arguments:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {rationale.key_arguments.map((arg, argIdx) => (
                            <li key={argIdx}>{arg}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStatus('setup');
                  setMessages([]);
                  setDebateResults(null);
                  setDebateId(null);
                }}
                className="px-6 py-2 rounded font-medium"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-white)",
                }}
              >
                Start New Debate
              </button>
              <Link
                href="/"
                className="px-6 py-2 rounded font-medium inline-block"
                style={{
                  backgroundColor: "var(--color-charcoal)",
                  color: "var(--color-white)",
                }}
              >
                Back to Markets
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && error && (
          <div
            className="p-6 rounded-lg text-center"
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--color-red)",
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-red)" }}>
              Error
            </h2>
            <p className="mb-4" style={{ color: "var(--foreground-secondary)" }}>
              {error}
            </p>
            <button
              onClick={() => {
                setStatus('setup');
                setError(null);
              }}
              className="px-6 py-2 rounded font-medium"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-white)",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

