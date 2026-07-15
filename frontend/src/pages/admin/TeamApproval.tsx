import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import GlassCard from "../../components/GlassCard";
import { ShieldAlert, CheckCircle, Clock } from "lucide-react";
import PageEntrance from "../../components/PageEntrance";
import { useToastStore } from "../../store/useToastStore";

export default function TeamApproval() {
  const { token, user } = useAuthStore();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

  const fetchTeams = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/tournament/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTeams(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [token]);

  const handleApprove = async (teamId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/tournament/teams/${teamId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        addToast("success", "Team approved successfully!");
        fetchTeams();
      } else {
        const errorData = await res.json();
        addToast("error", `Failed to approve team: ${errorData.message}`);
      }
    } catch (err) {
      addToast("error", "Error approving team.");
    }
  };

  // Permission Guard
  if (!token || user?.role !== "admin") {
    return (
      <div className="py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-4xl text-white font-heading font-bold mb-4">RESTRICTED AREA</h1>
        <p className="text-gray-400">Only authorized Admins can approve teams.</p>
      </div>
    );
  }

  return (
    <PageEntrance className="py-12 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold font-display text-white mb-8">
        Team <span className="text-glow text-neon">Approval Dashboard</span>
      </h1>
      
      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-panel p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-3" />
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="h-10 w-36 bg-white/5 rounded-lg animate-pulse" />
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="h-3 w-24 bg-white/5 rounded animate-pulse mb-3" />
                <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {teams.length === 0 && (
             <div className="text-gray-500 italic">No teams registered yet.</div>
          )}
          {teams.map((team) => {
            // Determine if team is already approved based on backend logic
            const isApproved = team.paymentStatus === "APPROVED" || team.isApproved;

            return (
              <GlassCard key={team._id} padding="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-heading text-white">{team.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 uppercase font-black tracking-widest">Status:</span>
                      {isApproved ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 px-3 py-1 border border-green-500/20 rounded-full">
                          <CheckCircle className="w-3 h-3" /> APPROVED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 px-3 py-1 border border-yellow-500/20 rounded-full">
                          <Clock className="w-3 h-3" /> PENDING APPROVAL
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  {!isApproved && (
                    <button
                      onClick={() => handleApprove(team._id)}
                      className="bg-neon/20 hover:bg-neon text-neon hover:text-black border border-neon/50 transition-colors font-bold py-3 px-8 rounded-lg text-sm tracking-widest uppercase w-full md:w-auto cursor-pointer"
                    >
                      APPROVE TEAM
                    </button>
                  )}
                </div>
                
                {/* Squad Snippet */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                    Registered Squad ({team.players?.length || 0})
                  </span>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    {team.players?.map((p: any) => p.name).join(", ")}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </PageEntrance>
  );
}
