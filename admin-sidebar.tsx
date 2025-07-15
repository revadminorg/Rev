import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, History, Settings, TrendingUp, Users } from "lucide-react";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'treasury', label: 'Treasury', icon: TrendingUp },
    { id: 'contributions', label: 'Contributions', icon: Settings },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm h-screen border-r">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-medium",
                    activeSection === item.id
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                  )}
                  onClick={() => onSectionChange(item.id)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
