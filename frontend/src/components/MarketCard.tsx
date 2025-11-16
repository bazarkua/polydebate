import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BlurText from "@/components/BlurText";
import { useState, useMemo } from "react";

interface Outcome {
  name: string;
  slug?: string;
  price: number;
  shares?: string;
}

interface MarketCardProps {
  id: string;
  question: string;
  description?: string;
  category: string;
  tag_id?: string;
  market_type?: 'binary' | 'categorical';
  outcomes: Outcome[];
  volume: string;
  volume_24h?: string;
  liquidity?: string;
  end_date?: string;
  created_date?: string;
  image_url?: string;
  resolution_source?: string;
  isLive?: boolean;
  period?: "daily" | "monthly";
  isNew?: boolean; // For animation when new cards appear
}

export function MarketCard({
  id,
  question,
  description,
  category,
  tag_id,
  market_type,
  outcomes,
  volume,
  volume_24h,
  liquidity,
  end_date,
  created_date,
  image_url,
  resolution_source,
  isLive = false,
  period = "daily",
  isNew = false,
}: MarketCardProps) {
  const [hoveredIcon, setHoveredIcon] = useState<'save' | 'share' | null>(null);

  // Filter out outcomes with 0 shares and sort by price (highest to lowest)
  const sortedOutcomes = useMemo(() => {
    return [...outcomes]
      .filter((outcome) => {
        // Filter out outcomes with 0 shares, empty shares, or undefined shares
        if (!outcome.shares) return false;
        const sharesNum = parseFloat(outcome.shares);
        return !isNaN(sharesNum) && sharesNum > 0;
      })
      .sort((a, b) => b.price - a.price);
  }, [outcomes]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement save functionality
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
  };

  return (
    <div 
      className="relative group" 
      style={{ 
        overflow: "visible",
        zIndex: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.zIndex = "10";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.zIndex = "1";
      }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-150",
          "border rounded-lg flex flex-col",
          "h-full",
          isNew && "animate-in"
        )}
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--shadow-sm)",
          transform: "translateY(0)",
          willChange: "transform",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--card-bg-hover)";
          e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.15)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--card-bg)";
          e.currentTarget.style.borderColor = "var(--card-border)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        onClick={() => window.location.href = `/market/${id}`}
      >
      <CardHeader 
        className="overflow-hidden rounded-t-lg"
        style={{ 
          paddingBottom: "calc(var(--leading-base) * 0.5em)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Market Image as Icon (if available) */}
            {image_url && (
              <div 
                className="rounded overflow-hidden shrink-0 flex items-center justify-center relative"
                style={{ 
                  width: "48px",
                  height: "48px",
                  backgroundColor: "var(--color-soft-gray)",
                  border: "2px solid var(--card-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <img
                  src={image_url}
                  alt={question}
                  className="w-full h-full object-cover"
                  style={{
                    backgroundColor: "var(--color-soft-gray)",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Subtle overlay to ensure image blends well */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.02) 100%)",
                    borderRadius: "inherit",
                  }}
                />
              </div>
            )}
            <CardTitle 
              className="text-body font-bold flex-1"
              style={{ 
                color: "var(--foreground)",
                lineHeight: "var(--leading-base)",
                fontSize: "var(--text-base)", // 14px - smaller than h2
                fontWeight: "bold",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
              title={description || question}
            >
              {question}
            </CardTitle>
          </div>
          {isLive && (
            <span 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-caption font-medium whitespace-nowrap border shrink-0"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "var(--color-red)",
                borderColor: "rgba(239, 68, 68, 0.2)",
                lineHeight: "var(--leading-base)",
              }}
            >
              <span 
                className="size-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-red)" }}
              />
              LIVE
            </span>
          )}
        </div>
        
        {/* Category and Market Type */}
        <div 
          className="flex items-center gap-2 flex-wrap"
          style={{ marginTop: "calc(var(--leading-tight) * 0.5em)" }}
        >
          <span 
            className="text-caption"
            style={{ 
              color: "var(--foreground-secondary)",
              lineHeight: "var(--leading-base)",
            }}
          >
            {category}
          </span>
          {market_type && (
            <>
              <span 
                className="text-caption"
                style={{ 
                  color: "var(--foreground-secondary)",
                  lineHeight: "var(--leading-base)",
                }}
              >
                •
              </span>
              <span 
                className="text-caption capitalize"
                style={{ 
                  color: "var(--foreground-secondary)",
                  lineHeight: "var(--leading-base)",
                }}
              >
                {market_type}
              </span>
            </>
          )}
        </div>
        
        {/* Time/Date/Duration Row - New row with smaller font */}
        {(end_date || created_date || period) && (
          <div 
            className="flex items-center gap-2 flex-wrap"
            style={{ 
              marginTop: "calc(var(--leading-base) * 0.25em)",
            }}
          >
            {end_date && (
              <div className="flex items-center gap-1">
                <svg
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--foreground-secondary)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span 
                  className="text-caption tabular-nums"
                  style={{ 
                    color: "var(--foreground-secondary)",
                    lineHeight: "var(--leading-base)",
                    fontSize: "0.75rem", // 12px - smaller than caption
                  }}
                >
                  {new Date(end_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
            {period && (
              <>
                {(end_date || created_date) && (
                  <span 
                    className="text-caption"
                    style={{ 
                      color: "var(--foreground-secondary)",
                      lineHeight: "var(--leading-base)",
                    }}
                  >
                    •
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <svg
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--foreground-secondary)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span 
                    className="text-caption capitalize"
                    style={{ 
                      color: "var(--foreground-secondary)",
                      lineHeight: "var(--leading-base)",
                      fontSize: "0.75rem", // 12px - smaller than caption
                    }}
                  >
                    {period}
                  </span>
                </div>
              </>
            )}
            {created_date && (
              <>
                {(end_date || period) && (
                  <span 
                    className="text-caption"
                    style={{ 
                      color: "var(--foreground-secondary)",
                      lineHeight: "var(--leading-base)",
                    }}
                  >
                    •
                  </span>
                )}
                <span 
                  className="text-caption"
                  style={{ 
                    color: "var(--foreground-secondary)",
                    lineHeight: "var(--leading-base)",
                    fontSize: "0.75rem", // 12px - smaller than caption
                  }}
                >
                  Created {new Date(created_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
              </>
            )}
          </div>
        )}
        
        {/* Description (truncated, if available) */}
        {description && (
          <p 
            className="text-caption line-clamp-2"
            style={{ 
              color: "var(--foreground-secondary)",
              lineHeight: "var(--leading-base)",
              marginTop: "calc(var(--leading-base) * 0.25em)",
            }}
            title={description}
          >
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 flex-1 flex flex-col overflow-hidden">
        {/* Outcomes - Show up to 4 outcomes */}
        {sortedOutcomes.length === 2 ? (
          // Half-circle indicator for 2-outcome markets
          <div className="flex flex-col items-center gap-2 py-1">
            {/* SVG Half-circle */}
            <div className="relative" style={{ width: "120px", height: "60px" }}>
              <svg
                width="120"
                height="60"
                viewBox="0 0 140 70"
                className="absolute inset-0"
                style={{ width: "100%", height: "100%" }}
              >
                {/* Background arc (full half-circle) - gray */}
                <path
                  d="M 20 60 A 50 50 0 0 1 120 60"
                  fill="none"
                  stroke="var(--color-soft-gray)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Progress arc - shows first outcome percentage */}
                {(() => {
                  // For Yes/No markets, show the "Yes" outcome percentage
                  // Find which outcome is "Yes" or use first outcome (highest price after sorting)
                  const yesOutcome = sortedOutcomes.find(o => o.name.toLowerCase() === "yes" || o.name.toLowerCase() === "up") || sortedOutcomes[0];
                  const percentage = Math.max(0, Math.min(1, yesOutcome.price)); // clamp 0..1
                  
                  // Red for low percentage (< 50%), green for high (>= 50%)
                  const arcColor = percentage < 0.5 ? "var(--color-red)" : "var(--color-green)";
                  
                  const radius = 50;
                  const centerX = 70; // matches background arc
                  const centerY = 60; // matches background arc
                  
                  // Gauge is a half-circle from left (180°) to right (0°)
                  // For percentage, we fill from left (180°) towards right
                  // 0% = 180° (no fill), 100% = 0° (full fill)
                  const startAngleDeg = 180;
                  const endAngleDeg = 180 - percentage * 180;
                  
                  const startRad = (startAngleDeg * Math.PI) / 180;
                  const endRad = (endAngleDeg * Math.PI) / 180;
                  
                  const startX = centerX + radius * Math.cos(startRad);
                  const startY = centerY - radius * Math.sin(startRad); // NOTE: minus for top half
                  const endX = centerX + radius * Math.cos(endRad);
                  const endY = centerY - radius * Math.sin(endRad); // NOTE: minus for top half
                  
                  const largeArcFlag = 0; // always small arc (≤ 180°)
                  const sweepFlag = 1; // same direction as gray arc
                  
                  if (percentage <= 0) return null;
                  
                  return (
                    <path
                      key="progress-arc"
                      d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`}
                      fill="none"
                      stroke={arcColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  );
                })()}
              </svg>
            </div>
            {/* Percentage display below the half-circle */}
            <div 
              className="text-center"
              style={{ lineHeight: "var(--leading-base)" }}
            >
              {(() => {
                // Find Yes/Up outcome or use first outcome (highest price after sorting)
                const yesOutcome = sortedOutcomes.find(o => o.name.toLowerCase() === "yes" || o.name.toLowerCase() === "up") || sortedOutcomes[0];
                const percentage = Math.round(yesOutcome.price * 100);
                const isYes = yesOutcome.name.toLowerCase() === "yes" || yesOutcome.name.toLowerCase() === "up";
                
                return (
                  <>
                    <div 
                      className="text-h2 font-bold tabular-nums"
                      style={{ 
                        color: "var(--foreground)",
                        lineHeight: "var(--leading-tight)",
                      }}
                    >
                      {percentage}%
                    </div>
                    <div 
                      className="text-caption font-medium"
                      style={{ 
                        color: "var(--foreground)",
                        lineHeight: "var(--leading-base)",
                      }}
                    >
                      {isYes ? "Yes" : yesOutcome.name}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Yes/No indicators (non-clickable) */}
            <div className="flex gap-1.5 w-full">
              {sortedOutcomes.map((outcome, idx) => {
                const isYes = outcome.name.toLowerCase() === "yes" || outcome.name.toLowerCase() === "up";
                const isNo = outcome.name.toLowerCase() === "no" || outcome.name.toLowerCase() === "down";
                
                return (
                  <div 
                    key={outcome.name}
                    className="flex-1 flex items-center justify-center px-2 py-1 rounded border cursor-default" 
                    style={{ 
                      borderColor: isYes ? "var(--color-green)" : isNo ? "var(--color-red)" : "var(--card-border)", 
                      backgroundColor: isYes ? "rgba(39, 174, 96, 0.05)" : isNo ? "rgba(239, 68, 68, 0.05)" : "transparent"
                    }}
                  >
                    <span 
                      className="text-caption font-semibold"
                      style={{ 
                        color: isYes ? "var(--color-green)" : isNo ? "var(--color-red)" : "var(--foreground-secondary)"
                      }}
                    >
                      {outcome.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Regular progress bars for 3+ outcomes
          <div style={{ gap: "calc(var(--leading-base) * 0.5em)" }} className="flex flex-col">
            {sortedOutcomes.slice(0, 4).map((outcome, idx) => {
              const percentage = Math.round(outcome.price * 100);
              const isYes = outcome.name.toLowerCase() === "yes" || idx === 0;
              
              return (
                <div 
                  key={outcome.name} 
                  style={{ 
                    lineHeight: "var(--leading-base)",
                    marginBottom: idx < Math.min(sortedOutcomes.length, 4) - 1 ? "calc(var(--leading-base) * 0.5em)" : "0",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span 
                        className="text-body font-medium block truncate"
                        style={{ 
                          color: "var(--foreground)",
                          lineHeight: "var(--leading-base)",
                        }}
                        title={outcome.name}
                      >
                        {outcome.name}
                      </span>
                      {outcome.shares && (
                        <span 
                          className="text-caption tabular-nums"
                          style={{ 
                            color: "var(--foreground-secondary)",
                            lineHeight: "var(--leading-base)",
                          }}
                        >
                          {parseFloat(outcome.shares).toLocaleString()} shares
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span 
                        className="text-body font-semibold tabular-nums"
                        style={{ 
                          color: "var(--foreground)",
                          lineHeight: "var(--leading-base)",
                        }}
                      >
                        {percentage}%
                      </span>
                      <div className="flex gap-1">
                        <div 
                          className="h-6 px-2 flex items-center justify-center rounded border cursor-default"
                          style={{
                            backgroundColor: "rgba(39, 174, 96, 0.05)",
                            borderColor: "var(--color-green)",
                          }}
                        >
                          <span 
                            className="text-caption font-semibold"
                            style={{ color: "var(--color-green)" }}
                          >
                            Yes
                          </span>
                        </div>
                        <div 
                          className="h-6 px-2 flex items-center justify-center rounded border cursor-default"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.05)",
                            borderColor: "var(--color-red)",
                          }}
                        >
                          <span 
                            className="text-caption font-semibold"
                            style={{ color: "var(--color-red)" }}
                          >
                            No
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="relative h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--color-soft-gray)" }}
                  >
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: isYes ? "var(--color-green)" : "var(--color-primary)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {sortedOutcomes.length > 4 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/market/${id}`;
                }}
                className="text-caption text-left hover:underline transition-all duration-150"
                style={{ 
                  color: "var(--color-primary)",
                  lineHeight: "var(--leading-base)",
                  paddingTop: "calc(var(--leading-base) * 0.25em)",
                }}
              >
                    +{sortedOutcomes.length - 4} more
              </button>
            )}
          </div>
        )}

        {/* Volume, Liquidity, Resolution Source, and Action Icons - Single Row */}
        <div 
          className="flex items-center justify-between gap-2 border-t mt-auto flex-wrap"
          style={{ 
            borderColor: "var(--card-border)",
            paddingTop: "calc(var(--leading-base) * 0.5em)",
          }}
        >
          {/* Left side: Volume, Liquidity, Resolution Source */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span 
                className="text-caption tabular-nums"
                style={{ 
                  color: "var(--foreground-secondary)",
                  lineHeight: "var(--leading-base)",
                }}
              >
                ${volume}
              </span>
              {volume_24h && (
                <>
                  <span 
                    className="text-caption"
                    style={{ 
                      color: "var(--foreground-secondary)",
                      lineHeight: "var(--leading-base)",
                    }}
                  >
                    •
                  </span>
                  <span 
                    className="text-caption tabular-nums"
                    style={{ 
                      color: "var(--foreground-secondary)",
                      lineHeight: "var(--leading-base)",
                    }}
                    title="24h Volume"
                  >
                    ${volume_24h} 24h
                  </span>
                </>
              )}
            </div>
            {liquidity && (
              <>
                <span 
                  className="text-caption"
                  style={{ 
                    color: "var(--foreground-secondary)",
                    lineHeight: "var(--leading-base)",
                  }}
                >
                  •
                </span>
                <span 
                  className="text-caption tabular-nums"
                  style={{ 
                    color: "var(--foreground-secondary)",
                    lineHeight: "var(--leading-base)",
                  }}
                  title="Liquidity"
                >
                  ${liquidity} Liq.
                </span>
              </>
            )}
            {resolution_source && (
              <>
                <span 
                  className="text-caption"
                  style={{ 
                    color: "var(--foreground-secondary)",
                    lineHeight: "var(--leading-base)",
                  }}
                >
                  •
                </span>
                <span 
                  className="text-caption"
                  style={{ 
                    color: "var(--foreground-secondary)",
                    lineHeight: "var(--leading-base)",
                  }}
                  title={`Resolves via: ${resolution_source}`}
                >
                  {resolution_source}
                </span>
              </>
            )}
          </div>
          
          {/* Right side: Save and Share Icons */}
          <div 
            className="flex items-center gap-2"
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setHoveredIcon(null);
            }}
          >
            <button
              onClick={handleSave}
              className="p-1.5 rounded transition-all duration-150"
              style={{ 
                color: "var(--foreground-secondary)",
                backgroundColor: hoveredIcon === 'save' ? "var(--color-soft-gray)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredIcon('save');
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                setHoveredIcon(null);
              }}
              aria-label="Save market"
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ pointerEvents: "none" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded transition-all duration-150"
              style={{ 
                color: "var(--foreground-secondary)",
                backgroundColor: hoveredIcon === 'share' ? "var(--color-soft-gray)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredIcon('share');
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                setHoveredIcon(null);
              }}
              aria-label="Share market"
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ pointerEvents: "none" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

