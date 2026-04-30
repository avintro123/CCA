import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchStandings } from "../services/api";
import GlassCard from "../components/GlassCard";

interface TeamStanding {
  teamId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  points: number;
}

export default function Standings() {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings()
      .then(setStandings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12">
      <div className="flex items-center gap-4 mb-8">
        <Trophy className="text-neon w-10 h-10" />
        <h1 className="text-4xl font-bold font-heading text-white">
          Tournament <span className="text-glow text-neon">Standings</span>
        </h1>
      </div>

      <GlassCard padding="p-0" className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-dark-border">
              <th className="p-4 font-heading font-medium text-gray-400">
                Pos
              </th>
              <th className="p-4 font-heading font-medium text-gray-400">
                Team
              </th>
              <th className="p-4 font-heading font-medium text-gray-400 text-center">
                P
              </th>
              <th className="p-4 font-heading font-medium text-gray-400 text-center">
                W
              </th>
              <th className="p-4 font-heading font-medium text-gray-400 text-center">
                L
              </th>
              <th className="p-4 font-heading font-medium text-gray-400 text-right">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-gray-400">
                  No teams approved yet.
                </td>
              </tr>
            ) : (
              standings.map((team, index) => (
                <tr
                  key={team.teamId}
                  className="border-b border-dark-border/50 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 font-bold font-heading text-gray-400">
                    {index + 1}
                  </td>
                  <td className="p-4 font-bold tracking-wide text-white">
                    {team.name}
                  </td>
                  <td className="p-4 text-center text-gray-300">
                    {team.played}
                  </td>
                  <td className="p-4 text-center text-green-400">{team.won}</td>
                  <td className="p-4 text-center text-red-400">{team.lost}</td>
                  <td className="p-4 text-right font-bold text-neon text-xl">
                    {team.points}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
