import { AlertTriangle, Clock, User } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function UpcomingSubscriptionsBentoCard({ className, delay }: { className?: string; delay?: number }) {
  // Mock data
  const expirations = [
    { id: 1, name: "Damian Coronel", date: "23/04", days: 1, type: "Urgente" },
    { id: 2, name: "Lucas Gomez", date: "25/04", days: 3, type: "Próximo" },
    { id: 3, name: "Sofia Rodriguez", date: "28/04", days: 6, type: "Próximo" },
  ];

  return (
    <BentoCard className={cn("flex flex-col h-full", className)} delay={delay}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-2xl">
            <Clock className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black tracking-tight">Suscripciones</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Próximos Vencimientos</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {expirations.map((exp) => (
          <div 
            key={exp.id} 
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-all border border-gray-100/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-black">{exp.name}</p>
                <p className="text-[10px] text-gray-400 font-medium">Vence el {exp.date}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[9px] font-black uppercase tracking-tighter rounded-lg border-none px-2",
                  exp.type === "Urgente" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                )}
              >
                {exp.type}
              </Badge>
              <span className="text-[9px] font-bold text-gray-300">en {exp.days} {exp.days === 1 ? 'día' : 'días'}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full py-3 rounded-2xl bg-gray-50 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100 hover:text-black transition-all">
         Ver Todos los Vencimientos
      </button>
    </BentoCard>
  );
}
