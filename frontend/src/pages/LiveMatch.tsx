import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import GlassCard from "../components/GlassCard";
import AnimatedScore from "../components/AnimatedScore";
import PageEntrance from "../components/PageEntrance";
import { Activity, Clock, Trophy } from "lucide-react";
import { useNavigate } from "react-router";
import { API_URL } from "../services/api";

export default function LiveMatch() {
  const [matches, setMatches] = useState<any[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [scorePulse, setScorePulse] = useState(false);
  const [lobbyLoading, setLobbyLoading] = useState(true);
  const navigate = useNavigate();

  const getProcessedStats = (ballLog: any[]) => {
    const batting: Record<string, any> = {};
    const bowling: Record<string, any> = {};

    ballLog.forEach((ball) => {
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

  const stats = matchData?.ballLog
    ? getProcessedStats(matchData.ballLog)
    : { batting: {}, bowling: {} };

  // Trigger score pulse animation
  const triggerScorePulse = () => {
    setScorePulse(true);
    setTimeout(() => setScorePulse(false), 800);
  };

  // 1. Fetching available matches for the Spectator Lobby
  useEffect(() => {
    if (activeMatchId) return; // Don't fetch lobby if already inside a match

    const fetchMatches = async () => {
      try {
        const res = await fetch(`${API_URL}/match`);
        const data = await res.json();
        setMatches(data.data || []);
      } catch (err) {
        console.log("Failed to load match lobby.");
      } finally {
        setLobbyLoading(false);
      }
    };
    fetchMatches();
  }, [activeMatchId]);

  // 2a. Fetch current match data via REST (works for both live & completed matches)
  useEffect(() => {
    if (!activeMatchId) return;

    const fetchMatchData = async () => {
      try {
        const res = await fetch(`${API_URL}/match/${activeMatchId}`);
        const data = await res.json();
        if (data.data) {
          setMatchData(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch match data", err);
      }
    };
    fetchMatchData();
  }, [activeMatchId]);

  // 2b. Connecting to the WebSocket when a match is clicked (for live updates)
  useEffect(() => {
    if (!activeMatchId) return;

    setConnectionStatus("Connecting...");

    const newSocket = io(API_URL);

    newSocket.on("connect", () => {
      setConnectionStatus("Live");
      // Connecting to specific match room
      newSocket.emit("joinMatch", { matchId: activeMatchId });
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus("Disconnected");
    });

    newSocket.on("scoreUpdated", (data) => {
      setMatchData(data);
      triggerScorePulse();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [activeMatchId]);

  // -------------------------
  // VIEW: MATCH LOBBY
  // -------------------------

  if (!activeMatchId) {
    return (
      <PageEntrance className="py-12 max-w-6xl mx-auto min-h-screen">
        <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-10 pb-4 border-b border-white/10">
          Tournament <span className="text-glow text-neon">Lobby</span>
        </h1>

        {lobbyLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="h-5 w-20 bg-white/5 rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 w-28 bg-white/5 rounded animate-pulse" />
                  <div className="h-4 w-8 bg-white/5 rounded animate-pulse" />
                  <div className="h-6 w-28 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-xl font-heading">
            No matches scheduled currently!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((m) => {
              const isCompleted = m.status === "COMPLETED";

              return (
                <div
                  key={m._id}
                  onClick={() => {
                    if (isCompleted) {
                      navigate(`/match/${m._id}`);
                    } else {
                      setActiveMatchId(m._id);
                    }
                  }}
                  className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-md overflow-hidden group
                    ${
                      isCompleted
                        ? "bg-white/5 border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100"
                        : "bg-[#141b2a]/80 border-neon/30 hover:border-neon shadow-lg hover:shadow-[0_0_20px_rgba(178,255,5,0.2)]"
                    }`}
                >
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <span
                      className={`text-xs font-bold tracking-widest px-3 py-1 rounded-full flex items-center gap-2 ${isCompleted ? "bg-gray-700 text-gray-300" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
                    >
                      {!isCompleted && <span className="live-pulse-dot" />}
                      {isCompleted ? "HISTORY" : "LIVE NOW"}
                    </span>
                    <span className="text-gray-400 text-sm font-heading flex items-center gap-2">
                      {isCompleted ? (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {m.date ? new Date(m.date).toLocaleDateString() : "Today"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white font-heading text-2xl relative z-10">
                    <div className="flex-1 truncate text-left">
                      {m.teamA?.name || "Team A"}
                    </div>
                    <div className="text-neon mx-4 font-black text-sm opacity-50">
                      VS
                    </div>
                    <div className="flex-1 truncate text-right">
                      {m.teamB?.name || "Team B"}
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <span className="font-heading tracking-widest text-white text-xl">
                        VIEW SCORECARD
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageEntrance>
    );
  }

  // -------------------------
  // VIEW: WEBSOCKET SCOREBOARD
  // -------------------------

  return (
    <PageEntrance className="py-12 max-w-6xl mx-auto min-h-screen">
      <div className="mb-4">
        <button
          onClick={() => setActiveMatchId(null)}
          className="text-neon hover:underline text-sm font-bold tracking-widest"
        >
          ← BACK TO LOBBY
        </button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold font-display text-white">
          Real-Time <span className="text-glow text-neon">Scorecard</span>
        </h1>
        <div
          className={`px-4 py-1 flex items-center gap-2 rounded-full font-bold text-sm ${connectionStatus === "Live" ? "bg-red-500/20 text-red-500 border border-red-500" : "bg-gray-800 text-gray-400"}`}
        >
          {connectionStatus === "Live" && (
            <span className="live-pulse-dot" />
          )}
          <span>{connectionStatus}</span>
        </div>
      </div>

      <GlassCard
        padding="py-16"
        className={`text-center text-white relative overflow-hidden transition-shadow duration-300 gradient-mesh-scorecard ${scorePulse ? "score-update-pulse" : ""}`}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon/10 rounded-full blur-[100px] pointer-events-none"></div>
        {matchData ? (
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Innings 1 */}
            <div>
              <h3 className="text-sm font-bold tracking-widest text-gray-500 mb-2 uppercase">
                1st Innings
              </h3>
              <div className="text-7xl font-heading font-black tracking-tighter text-glow text-neon">
                <AnimatedScore value={matchData.innings1?.score ?? 0} />
                <span className="text-3xl text-white opacity-50">
                  / <AnimatedScore value={matchData.innings1?.wickets ?? 0} />
                </span>
              </div>
              <p className="text-lg text-gray-400 tracking-widest mt-2">
                OVERS: {matchData.innings1?.overs ?? 0}
              </p>
            </div>

            {/* Innings 2 */}
            {(matchData.currentInnings >= 2 ||
              (matchData.innings2?.score ?? 0) > 0) && (
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold tracking-widest text-gray-500 mb-2 uppercase">
                  2nd Innings
                </h3>
                <div className="text-7xl font-heading font-black tracking-tighter text-glow text-neon">
                  <AnimatedScore value={matchData.innings2?.score ?? 0} />
                  <span className="text-3xl text-white opacity-50">
                    / <AnimatedScore value={matchData.innings2?.wickets ?? 0} />
                  </span>
                </div>
                <p className="text-lg text-gray-400 tracking-widest mt-2">
                  OVERS: {matchData.innings2?.overs ?? 0}
                </p>
              </div>
            )}

            {/* Result Summary */}
            {matchData.resultSummary && (
              <p className="text-xl text-neon font-heading tracking-widest mt-4 px-6 py-3 bg-neon/10 rounded-full border border-neon/30">
                {matchData.resultSummary}
              </p>
            )}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-4 text-gray-400">
            <Activity className="w-16 h-16 opacity-50 mb-4 animate-bounce" />
            <p className="text-2xl font-heading">
              Waiting for live match data...
            </p>
            <p>The scorer hasn't pushed any updates yet.</p>
          </div>
        )}

        <div className="w-full mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 text-left border-t border-white/10 pt-12">
          {/*Batting table*/}
          <div>
            <h4 className="text-neon font-heading font-bold mb-6 tracking-widest text-sm uppercase">
              Batting Squad
            </h4>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[10px] uppercase tracking-widest font-black border-b border-white/10">
                    <th className="pb-4">Batsman</th>
                    <th className="pb-4">R</th>
                    <th className="pb-4">B</th>
                    <th className="pb-4">4s</th>
                    <th className="pb-4">6s</th>
                    <th className="pb-4 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(stats.batting).map(
                    ([name, player]: [string, any]) => (
                      <tr
                        key={name}
                        className="group hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 font-bold text-white flex flex-col">
                          {name}{" "}
                          <span className="text-[10px] text-gray-500 font-normal uppercase">
                            {player.out ? "Out" : "Not Out"}
                          </span>
                        </td>
                        <td className="py-4 text-neon font-black">
                          {player.runs}
                        </td>
                        <td className="py-4 text-gray-400">{player.balls}</td>
                        <td className="py-4 text-gray-400">{player.fours}</td>
                        <td className="py-4 text-gray-400">{player.sixes}</td>
                        <td className="py-4 text-gray-500 text-right text-xs">
                          {((player.runs / (player.balls || 1)) * 100).toFixed(
                            1,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOWLING TABLE */}
          <div>
            <h4 className="text-neon font-heading font-bold mb-6 tracking-widest text-sm uppercase">
              Bowling Attack
            </h4>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[10px] uppercase tracking-widest font-black border-b border-white/10">
                    <th className="pb-4">Bowler</th>
                    <th className="pb-4">O</th>
                    <th className="pb-4">R</th>
                    <th className="pb-4">W</th>
                    <th className="pb-4 text-right">ECON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(stats.bowling).map(
                    ([name, player]: [string, any]) => (
                      <tr
                        key={name}
                        className="group hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 font-bold text-white">{name}</td>
                        <td className="py-4 text-gray-400">
                          {/* Calculating over notation (e.g. 3.2) from total balls */}
                          {Math.floor(player.balls / 6)}.{player.balls % 6}
                        </td>
                        <td className="py-4 text-gray-400">{player.runs}</td>
                        <td className="py-4 text-neon font-black">
                          {player.wickets}
                        </td>
                        <td className="py-4 text-gray-500 text-right text-xs">
                          {/* Calculating Economy Rate */}
                          {(player.runs / (player.balls / 6 || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </GlassCard>
    </PageEntrance>
  );
}
