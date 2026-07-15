import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import GlassCard from "../components/GlassCard";
import PageEntrance from "../components/PageEntrance";
import { Trophy, Clock, ArrowLeft, Users, Calendar, Shield } from "lucide-react";
import { API_URL } from "../services/api";

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeInningsTab, setActiveInningsTab] = useState<1 | 2>(1);

  useEffect(() => {
    if (!id) return;
    const fetchMatch = async () => {
      try {
        const res = await fetch(`${API_URL}/match/${id}`);
        const data = await res.json();
        if (data.data) {
          setMatch(data.data);
          // If match is live or has 2nd innings, default to current innings
          if (data.data.currentInnings === 2) {
            setActiveInningsTab(2);
          }
        }
      } catch (err) {
        console.error("Failed to fetch match details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  const getProcessedStats = (ballLog: any[]) => {
    const batting: Record<string, any> = {};
    const bowling: Record<string, any> = {};

    ballLog.forEach((ball) => {
      // Process only for the currently viewed innings tab
      if (ball.innings !== activeInningsTab) return;

      if (!batting[ball.batsmanName]) {
        batting[ball.batsmanName] = {
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          out: false,
        };
      }

      batting[ball.batsmanName].runs += ball.runs;
      batting[ball.batsmanName].balls += 1;

      if (ball.runs === 4) batting[ball.batsmanName].fours += 1;
      if (ball.runs === 6) batting[ball.batsmanName].sixes += 1;
      if (ball.isWicket && ball.dismissedPlayer === ball.batsmanName) {
        batting[ball.batsmanName].out = true;
      }

      // bowling stats
      if (!bowling[ball.bowlerName]) {
        bowling[ball.bowlerName] = { balls: 0, runs: 0, wickets: 0 };
      }

      bowling[ball.bowlerName].balls += 1;
      bowling[ball.bowlerName].runs += ball.runs + (ball.extras || 0);

      if (ball.isWicket) {
        bowling[ball.bowlerName].wickets += 1;
      }
    });
    return { batting, bowling };
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <PageEntrance className="py-12 max-w-4xl mx-auto text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold font-display text-white mb-4">Match Not Found</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-neon hover:underline flex items-center gap-2 font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </PageEntrance>
    );
  }

  const { batting, bowling } = getProcessedStats(match.ballLog || []);
  const isCompleted = match.status === "COMPLETED";
  const currentInningsData = activeInningsTab === 1 ? match.innings1 : match.innings2;

  // Filter ball timeline for current innings tab
  const inningsBalls = (match.ballLog || []).filter((b: any) => b.innings === activeInningsTab);

  return (
    <PageEntrance className="py-12 max-w-5xl mx-auto min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="text-neon hover:underline flex items-center gap-2 font-bold tracking-widest text-xs uppercase mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to matches
      </button>

      {/* Match Header Details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/10 pb-8">
        <div>
          <span
            className={`text-xs font-bold tracking-widest px-3 py-1 rounded-full flex items-center gap-2 w-fit mb-4 ${
              isCompleted
                ? "bg-gray-700 text-gray-300 border border-gray-600"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isCompleted ? "COMPLETED" : "LIVE NOW"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-white flex items-center gap-4 flex-wrap">
            <span className="cursor-pointer hover:text-neon transition-colors" onClick={() => navigate(`/team/${match.teamA?._id}`)}>
              {match.teamA?.name}
            </span>
            <span className="text-neon/50 text-2xl font-black">VS</span>
            <span className="cursor-pointer hover:text-neon transition-colors" onClick={() => navigate(`/team/${match.teamB?._id}`)}>
              {match.teamB?.name}
            </span>
          </h1>
        </div>
        <div className="flex flex-col gap-2 text-gray-400 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neon" />
            <span>{match.date ? new Date(match.date).toLocaleDateString() : "Match Day"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neon" />
            <span>{match.totalOvers} Overs Match</span>
          </div>
        </div>
      </div>

      {/* Match Result Banner */}
      {isCompleted && match.resultSummary && (
        <GlassCard padding="p-8" className="mb-8 border-yellow-500/20 text-center gradient-mesh-scorecard">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-display font-black text-white mb-2">Match Result</h2>
          <p className="text-neon text-xl font-heading font-bold tracking-wide">{match.resultSummary}</p>
        </GlassCard>
      )}

      {/* Innings Tabs Selector */}
      <div className="flex gap-4 mb-6 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveInningsTab(1)}
          className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wider transition-all cursor-pointer ${
            activeInningsTab === 1
              ? "bg-neon text-black shadow-[0_0_15px_rgba(178,255,5,0.3)]"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          1st Innings Scorecard
        </button>
        {(match.currentInnings >= 2 || (match.innings2?.score ?? 0) > 0) && (
          <button
            onClick={() => setActiveInningsTab(2)}
            className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wider transition-all cursor-pointer ${
              activeInningsTab === 2
                ? "bg-neon text-black shadow-[0_0_15px_rgba(178,255,5,0.3)]"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            2nd Innings Scorecard
          </button>
        )}
      </div>

      {/* Scorecard Box */}
      <GlassCard padding="p-8" className="mb-8 gradient-mesh-subtle">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 pb-6 border-b border-white/5">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
              {activeInningsTab === 1 ? "1st Innings Scorecard" : "2nd Innings Scorecard"}
            </span>
            <div className="text-5xl font-display font-black text-neon text-glow mt-1">
              {currentInningsData?.score ?? 0}
              <span className="text-2xl text-white/40 font-heading"> / {currentInningsData?.wickets ?? 0}</span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">OVERS</span>
            <div className="text-3xl font-heading font-black text-white mt-1">
              {currentInningsData?.overs ?? 0}.{currentInningsData?.ballsInCurrentOver ?? 0}
              <span className="text-sm font-medium text-gray-500"> / {match.totalOvers} ov</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Batting details */}
          <div>
            <h4 className="text-neon font-display font-bold mb-6 tracking-widest text-sm uppercase">Batting Squad</h4>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[10px] uppercase tracking-widest font-black border-b border-white/10">
                    <th className="pb-4">Batsman</th>
                    <th className="pb-4">Runs</th>
                    <th className="pb-4">Balls</th>
                    <th className="pb-4">4s</th>
                    <th className="pb-4">6s</th>
                    <th className="pb-4 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.keys(batting).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 italic text-sm">
                        No batting records for this innings.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(batting).map(([name, player]: [string, any]) => (
                      <tr key={name} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-bold text-white flex flex-col">
                          {name}
                          <span className="text-[10px] text-gray-500 font-normal uppercase">
                            {player.out ? "Out" : "Not Out"}
                          </span>
                        </td>
                        <td className="py-4 text-neon font-black">{player.runs}</td>
                        <td className="py-4 text-gray-400">{player.balls}</td>
                        <td className="py-4 text-gray-400">{player.fours}</td>
                        <td className="py-4 text-gray-400">{player.sixes}</td>
                        <td className="py-4 text-gray-500 text-right text-xs font-heading">
                          {((player.runs / (player.balls || 1)) * 100).toFixed(1)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bowling details */}
          <div>
            <h4 className="text-neon font-display font-bold mb-6 tracking-widest text-sm uppercase">Bowling Attack</h4>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[10px] uppercase tracking-widest font-black border-b border-white/10">
                    <th className="pb-4">Bowler</th>
                    <th className="pb-4">Overs</th>
                    <th className="pb-4">Runs</th>
                    <th className="pb-4">Wickets</th>
                    <th className="pb-4 text-right">Economy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.keys(bowling).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 italic text-sm">
                        No bowling records for this innings.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(bowling).map(([name, player]: [string, any]) => (
                      <tr key={name} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-bold text-white">{name}</td>
                        <td className="py-4 text-gray-400 font-heading">
                          {Math.floor(player.balls / 6)}.{player.balls % 6}
                        </td>
                        <td className="py-4 text-gray-400">{player.runs}</td>
                        <td className="py-4 text-neon font-black">{player.wickets}</td>
                        <td className="py-4 text-gray-500 text-right text-xs font-heading">
                          {(player.runs / (player.balls / 6 || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Innings Ball by Ball timeline details */}
      <GlassCard padding="p-6">
        <h3 className="text-sm font-black tracking-[3px] uppercase text-gray-500 mb-4">Innings Ball Log</h3>
        {inningsBalls.length === 0 ? (
          <div className="text-center text-gray-600 py-8 text-sm italic">
            No ball logs recorded for this innings.
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            {inningsBalls.map((ball: any, idx: number) => {
              let chipClass = "bg-white/10 text-white border-white/10";
              let label = String(ball.runs);

              if (ball.isWicket) {
                chipClass = "bg-red-600/30 text-red-400 border-red-500/40";
                label = "W";
              } else if (ball.extraType) {
                chipClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
                const extraAbbr: Record<string, string> = {
                  wide: "Wd",
                  WIDE: "Wd",
                  noBall: "Nb",
                  NO_BALL: "Nb",
                  legBye: "Lb",
                  LEG_BYE: "Lb",
                  bye: "B",
                  BYE: "B",
                };
                label = `${ball.runs}${extraAbbr[ball.extraType] || "e"}`;
              } else if (ball.runs === 4) {
                chipClass = "bg-neon/20 text-neon border-neon/40";
              } else if (ball.runs === 6) {
                chipClass = "bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]";
              } else if (ball.runs === 0) {
                chipClass = "bg-white/5 text-gray-500 border-white/5";
              }

              const showOverSep = idx > 0 && ball.over !== inningsBalls[idx - 1].over;

              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  {showOverSep && <div className="w-px h-8 bg-white/20 mx-1"></div>}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border ${chipClass} transition-transform hover:scale-110`}
                    title={`Over ${ball.over}.${ball.ball} — ${ball.batsmanName} vs ${ball.bowlerName}`}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </PageEntrance>
  );
}
