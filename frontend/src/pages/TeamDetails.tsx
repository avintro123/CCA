import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import GlassCard from "../components/GlassCard";
import PageEntrance from "../components/PageEntrance";
import { Trophy, ArrowLeft, Users, ShieldAlert, Award, Star, Mail, CheckCircle } from "lucide-react";

interface TeamMember {
  name: string;
  role: "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER";
  isCaptain: boolean;
}

interface TeamInfo {
  _id: string;
  name: string;
  captainId?: {
    name: string;
    email: string;
  };
  status: string;
  players: TeamMember[];
}

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchTeamData = async () => {
      try {
        const [tRes, mRes] = await Promise.all([
          fetch(`http://localhost:3000/tournament/teams/${id}`),
          fetch("http://localhost:3000/match"),
        ]);
        const tData = await tRes.json();
        const mData = await mRes.json();

        if (tData.data) {
          setTeam(tData.data);
        }
        if (mData.data) {
          setMatches(mData.data);
        }
      } catch (err) {
        console.error("Failed to load team profiles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-neon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <PageEntrance className="py-12 max-w-4xl mx-auto text-center min-h-[60vh] flex flex-col items-center justify-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold font-display text-white mb-4">Team Not Found</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-neon hover:underline flex items-center gap-2 font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </PageEntrance>
    );
  }

  // Calculate Win/Loss/Played
  const teamMatches = matches.filter(
    (m) =>
      m.status === "COMPLETED" &&
      (m.teamA?._id === team._id || m.teamB?._id === team._id)
  );

  const wins = teamMatches.filter((m) => m.winner === team._id || m.winner?._id === team._id).length;
  const losts = teamMatches.length - wins;
  const winRate = teamMatches.length > 0 ? Math.round((wins / teamMatches.length) * 100) : 0;

  // Monogram generation
  const monogram = team.name ? team.name.slice(0, 2).toUpperCase() : "TM";

  return (
    <PageEntrance className="py-12 max-w-5xl mx-auto min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="text-neon hover:underline flex items-center gap-2 font-bold tracking-widest text-xs uppercase mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to standings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Profile Card left */}
        <div className="lg:col-span-1">
          <GlassCard padding="p-8" className="text-center h-full flex flex-col items-center justify-between gradient-mesh-scorecard">
            <div className="flex flex-col items-center">
              {/* Monogram Badge */}
              <div className="w-24 h-24 rounded-3xl bg-neon/10 border-2 border-neon flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(178,255,5,0.2)]">
                <span className="text-4xl font-display font-black text-neon text-glow">{monogram}</span>
              </div>
              <h1 className="text-3xl font-bold font-display text-white mb-2">{team.name}</h1>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-6 ${
                team.status === "APPROVED"
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              }`}>
                {team.status === "APPROVED" ? "APPROVED FOR TOURNAMENT" : "PENDING APPROVAL"}
              </span>
            </div>

            {/* Captain details */}
            {team.captainId && (
              <div className="w-full pt-6 border-t border-white/5 text-left flex flex-col gap-3">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">CAPTAIN DETAILS</span>
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-white font-bold text-sm">{team.captainId.name}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-xs">
                  <Mail className="w-4 h-4" />
                  <span>{team.captainId.email}</span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Stats card right */}
        <div className="lg:col-span-2">
          <GlassCard padding="p-8" className="h-full flex flex-col justify-between gradient-mesh-subtle">
            <div>
              <h2 className="text-2xl font-bold font-display text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <Award className="text-neon" />
                Tournament Stats
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
                  <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Played</span>
                  <div className="text-4xl font-display font-black text-white mt-1">{teamMatches.length}</div>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-2xl text-center">
                  <span className="text-[10px] font-black tracking-widest text-green-500 uppercase">Wins</span>
                  <div className="text-4xl font-display font-black text-green-400 mt-1">{wins}</div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl text-center">
                  <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">Losses</span>
                  <div className="text-4xl font-display font-black text-red-400 mt-1">{losts}</div>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-gray-300">Win Rate Percentage</span>
                  <span className="text-xl font-display font-black text-neon text-glow">{winRate}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neon to-accent-purple rounded-full transition-all duration-1000"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-6 italic">
              Wins yield 2 points. Match records update live in real-time.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Roster Listing */}
      <GlassCard padding="p-8" className="mb-8">
        <h2 className="text-2xl font-bold font-display text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <Users className="text-neon" />
          Roster Squad ({team.players?.length || 0})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.players?.map((player, idx) => {
            const isCap = player.isCaptain;
            let roleClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
            if (player.role === "BATSMAN") roleClass = "bg-neon/10 text-neon border-neon/20";
            if (player.role === "BOWLER") roleClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            if (player.role === "ALL_ROUNDER") roleClass = "bg-accent-purple/10 text-accent-purple border-accent-purple/20";
            if (player.role === "WICKET_KEEPER") roleClass = "bg-accent-pink/10 text-accent-pink border-accent-pink/20";

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex justify-between items-center transition-all duration-300 hover:-translate-y-1 ${
                  isCap ? "bg-neon/5 border-neon/30" : "bg-white/5 border-white/10"
                }`}
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {player.name}
                    {isCap && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                        CAP
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-full mt-1.5 inline-block ${roleClass}`}>
                    {player.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </PageEntrance>
  );
}
