import { useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, Brain, FileText, User } from "lucide-react";

const tabs = [
  { path: "/log", label: "Log", icon: CalendarCheck },
  { path: "/insights", label: "Insights", icon: Brain },
  { path: "/report", label: "Report", icon: FileText },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-50" aria-label="Main navigation">
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
              className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${active ? "bg-primary/15" : ""}`}>
                <tab.icon className={`w-5 h-5 transition-all ${active ? "stroke-[2.5]" : ""}`} aria-hidden="true" />
              </div>
              <span className={`text-[11px] font-medium ${active ? "font-semibold" : ""}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
