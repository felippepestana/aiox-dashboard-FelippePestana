'use client';

import React from 'react';

export interface JudgeVotingData {
  area: string;
  favorable: number;
  unfavorable: number;
}

export interface JudgeSentimentPanelProps {
  judgeName: string;
  sentimentScore: number;
  totalCases: number;
  votingData: JudgeVotingData[];
}

export function JudgeSentimentPanel({
  judgeName,
  sentimentScore,
  totalCases,
  votingData,
}: JudgeSentimentPanelProps) {
  function getSentimentColor(score: number): string {
    if (score >= 7) return 'text-green-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getSentimentBg(score: number): string {
    if (score >= 7) return 'bg-green-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  const maxTotal = Math.max(...votingData.map((d) => d.favorable + d.unfavorable), 1);

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{judgeName}</h3>
          <p className="text-xs text-[#6b7a8d] mt-0.5">{totalCases} casos analisados</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6b7a8d]">Sentimento</p>
          <p className={`text-xl font-bold ${getSentimentColor(sentimentScore)}`}>
            {sentimentScore.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="w-full h-2 rounded-full bg-[#1a2332] mb-5">
        <div
          className={`h-2 rounded-full ${getSentimentBg(sentimentScore)}`}
          style={{ width: `${(sentimentScore / 10) * 100}%` }}
        />
      </div>

      {/* Voting patterns - horizontal bar chart */}
      <div className="space-y-3">
        <p className="text-xs text-[#6b7a8d] uppercase tracking-wider font-semibold">
          Padrao de Votacao por Area
        </p>
        {votingData.map((data) => {
          const total = data.favorable + data.unfavorable;
          const favPct = total > 0 ? (data.favorable / total) * 100 : 0;
          const barWidth = (total / maxTotal) * 100;

          return (
            <div key={data.area} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white">{data.area}</span>
                <span className="text-[#6b7a8d]">
                  {data.favorable}F / {data.unfavorable}D
                </span>
              </div>
              <div className="flex h-4 rounded-md overflow-hidden bg-[#1a2332]" style={{ width: `${barWidth}%` }}>
                <div
                  className="bg-green-500/80 h-full transition-all"
                  style={{ width: `${favPct}%` }}
                />
                <div
                  className="bg-red-500/80 h-full transition-all"
                  style={{ width: `${100 - favPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1a2332]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500/80" />
          <span className="text-xs text-[#6b7a8d]">Favoravel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/80" />
          <span className="text-xs text-[#6b7a8d]">Desfavoravel</span>
        </div>
      </div>
    </div>
  );
}
