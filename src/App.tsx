import React, { useState, useEffect, useMemo } from "react";
import { Autocomplete } from "./components/Autocomplete";
import { initializeGraph, dijkstra, Station } from "./lib/graph";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Scale,
  Loader2,
  ArrowRight,
  Home,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

enum AppStep {
  INPUT,
  LOADING,
  RESULTS,
}

interface SearchParams {
  workplaceA: string;
  workplaceB: string;
  budget: number;
  ratio: number;
  lambda: number;
}

interface StationResult extends Station {
  timeA: number;
  timeB: number;
  score: number;
  aiReason: string;
}

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [graph] = useState(() => initializeGraph());
  const stations = useMemo(() => graph.getAllStations(), [graph]);

  const [params, setParams] = useState<SearchParams>({
    workplaceA: "",
    workplaceB: "",
    budget: 150000,
    ratio: 50,
    lambda: 0.5,
  });

  const [results, setResults] = useState<StationResult[]>([]);

  const handleSearch = () => {
    if (!params.workplaceA || !params.workplaceB) {
      alert("両方の職場を入力してください。");
      return;
    }
    if (
      !graph.nodes.has(params.workplaceA) ||
      !graph.nodes.has(params.workplaceB)
    ) {
      alert("入力された駅が見つかりません。サジェストから選択してください。");
      return;
    }

    setStep(AppStep.LOADING);

    setTimeout(() => {
      calculateResults();
      setStep(AppStep.RESULTS);
    }, 1500);
  };

  const calculateResults = () => {
    const distA = dijkstra(graph, params.workplaceA);
    const distB = dijkstra(graph, params.workplaceB);

    let wA = 1.0;
    let wB = 1.0;
    const { ratio, lambda, budget } = params;

    if (ratio < 50) {
      wA = 1.0 + (50 - ratio) / 25;
      wB = Math.max(0.5, 1.0 - (50 - ratio) / 50);
    } else if (ratio > 50) {
      wB = 1.0 + (ratio - 50) / 25;
      wA = Math.max(0.5, 1.0 - (ratio - 50) / 50);
    }

    const scoredStations: StationResult[] = [];

    stations.forEach((station) => {
      const timeA = distA.get(station.id);
      const timeB = distB.get(station.id);

      if (
        timeA === undefined ||
        timeB === undefined ||
        timeA === Infinity ||
        timeB === Infinity
      )
        return;

      const scoreSum = wA * timeA + wB * timeB;
      const scoreFair = Math.max(wA * timeA, wB * timeB);
      const weightedTimeScore = lambda * scoreFair + (1 - lambda) * scoreSum;

      let displayScore = 100 - (weightedTimeScore / 120) * 100;

      if (station.rent > budget) {
        displayScore -= 15;
      }

      scoredStations.push({
        ...station,
        timeA,
        timeB,
        score: Math.max(0, Math.min(100, displayScore)),
        aiReason: generateMockAIReasons(station.name, timeA, timeB),
      });
    });

    scoredStations.sort((a, b) => b.score - a.score);
    setResults(scoredStations.slice(0, 10));
  };

  const generateMockAIReasons = (
    name: string,
    timeA: number,
    timeB: number,
  ) => {
    const diff = Math.abs(timeA - timeB);
    if (diff <= 5) {
      return `${name}は両方の職場へのアクセスが均等で、公平性を重視するお二人にぴったりです。周辺環境も落ち着いており、同棲生活のスタートに最適です。`;
    } else if (timeA < timeB) {
      return `Aさんの職場に近い${name}。Bさんの通勤時間は少し長くなりますが、駅周辺の充実した商業施設が生活をサポートします。`;
    } else {
      return `Bさんの職場へのアクセスが良好な${name}。休日は二人で出かけやすい立地で、バランスの取れたライフスタイルが実現できます。`;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-800">
              FairNest2<span className="text-emerald-600">-graph</span>
            </h1>
          </div>
          {step === AppStep.RESULTS && (
            <button
              onClick={() => setStep(AppStep.INPUT)}
              className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
            >
              条件を変更する
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {step === AppStep.INPUT && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                  希望条件を入力
                </h2>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Autocomplete
                      label="職場A (駅名)"
                      placeholder="例: 新宿"
                      stations={stations}
                      value={params.workplaceA}
                      onChange={(val) =>
                        setParams({ ...params, workplaceA: val })
                      }
                    />
                    <Autocomplete
                      label="職場B (駅名)"
                      placeholder="例: 東京"
                      stations={stations}
                      value={params.workplaceB}
                      onChange={(val) =>
                        setParams({ ...params, workplaceB: val })
                      }
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-stone-700 mb-4">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> 家賃予算 (1LDK)
                      </span>
                      <span className="text-emerald-600 font-semibold">
                        {(params.budget / 10000).toFixed(1)} 万円
                      </span>
                    </label>
                    <input
                      type="range"
                      min="80000"
                      max="300000"
                      step="5000"
                      value={params.budget}
                      onChange={(e) =>
                        setParams({ ...params, budget: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-xs text-stone-400 mt-2">
                      <span>8万円</span>
                      <span>30万円</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-stone-700 mb-4">
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> 通勤時間の比重
                      </span>
                      <span className="text-emerald-600 font-semibold">
                        {params.ratio === 50
                          ? "均等"
                          : params.ratio < 50
                            ? `A重視 (${100 - params.ratio}:${params.ratio})`
                            : `B重視 (${100 - params.ratio}:${params.ratio})`}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={params.ratio}
                      onChange={(e) =>
                        setParams({ ...params, ratio: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-xs text-stone-400 mt-2">
                      <span>Aさんの負担を減らす</span>
                      <span>Bさんの負担を減らす</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-stone-700 mb-4">
                      <span className="flex items-center gap-2">
                        <Scale className="w-4 h-4" /> 公平性重視度 (Lambda)
                      </span>
                      <span className="text-emerald-600 font-semibold">
                        {params.lambda.toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={params.lambda}
                      onChange={(e) =>
                        setParams({ ...params, lambda: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-xs text-stone-400 mt-2">
                      <span>合計時間重視 (0.0)</span>
                      <span>格差是正重視 (1.0)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSearch}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    最適な駅を検索する
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === AppStep.LOADING && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-6" />
              <h3 className="text-xl font-medium text-stone-800 mb-2">
                最適な駅を探索中...
              </h3>
              <p className="text-stone-500">
                広域グラフから数千のルートを計算しています
              </p>
            </motion.div>
          )}

          {step === AppStep.RESULTS && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                    おすすめの駅 Top 10
                  </h2>

                  <div className="space-y-4">
                    {results.map((station, index) => (
                      <div
                        key={station.id}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? "bg-amber-100 text-amber-700" : index === 1 ? "bg-stone-100 text-stone-600" : index === 2 ? "bg-orange-50 text-orange-700" : "bg-stone-50 text-stone-400"}`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-stone-800">
                                {station.name}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />{" "}
                                  {(station.rent / 10000).toFixed(1)}万円
                                </span>
                                <span className="flex items-center gap-1">
                                  <Shield className="w-4 h-4" /> 治安{" "}
                                  {station.safetyScore}/5
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-lg">
                            <div className="text-center">
                              <div className="text-xs text-stone-500 mb-0.5">
                                Aさん
                              </div>
                              <div className="font-semibold text-stone-800">
                                {station.timeA}分
                              </div>
                            </div>
                            <div className="text-stone-300">-</div>
                            <div className="text-center">
                              <div className="text-xs text-stone-500 mb-0.5">
                                Bさん
                              </div>
                              <div className="font-semibold text-stone-800">
                                {station.timeB}分
                              </div>
                            </div>
                            <div className="ml-4 pl-4 border-l border-stone-200 text-center">
                              <div className="text-xs text-stone-500 mb-0.5">
                                スコア
                              </div>
                              <div className="font-bold text-emerald-600 text-lg">
                                {station.score.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-50/50 rounded-xl p-4 text-sm text-stone-700 leading-relaxed border border-emerald-100">
                          <div className="flex items-center gap-2 font-medium text-emerald-800 mb-2">
                            <Sparkles className="w-4 h-4" />
                            AIのおすすめ理由
                          </div>
                          {station.aiReason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 sticky top-24">
                    <h3 className="text-lg font-semibold mb-6">
                      通勤時間の分布
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            type="number"
                            dataKey="timeA"
                            name="Aさんの通勤時間"
                            unit="分"
                            tick={{ fontSize: 12 }}
                            label={{
                              value: "Aさんの通勤時間 (分)",
                              position: "insideBottom",
                              offset: -10,
                              fontSize: 12,
                            }}
                          />
                          <YAxis
                            type="number"
                            dataKey="timeB"
                            name="Bさんの通勤時間"
                            unit="分"
                            tick={{ fontSize: 12 }}
                            label={{
                              value: "Bさんの通勤時間 (分)",
                              angle: -90,
                              position: "insideLeft",
                              fontSize: 12,
                            }}
                          />
                          <Tooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border border-stone-200 shadow-md rounded-lg text-sm">
                                    <p className="font-bold mb-1">
                                      {data.name}
                                    </p>
                                    <p>Aさん: {data.timeA}分</p>
                                    <p>Bさん: {data.timeB}分</p>
                                    <p>スコア: {data.score.toFixed(1)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter name="Stations" data={results}>
                            {results.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.score >= 80 ? "#059669" : "#3b82f6"}
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-4 text-sm text-stone-500">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                        <span>スコア80以上</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>その他</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
