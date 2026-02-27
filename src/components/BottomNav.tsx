import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, CalendarCheck, Brain, FileText } from "lucide-react";

const tabs = [
  { path: "/onboarding", label: "Check-In", icon: Sparkles },
  { path: "/log", label: "Log", icon: CalendarCheck },
  { path: "/insights", label: "Insights", icon: Brain },
  { path: "/report", label: "Report", icon: FileText },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-50">
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
