import { Outlet, Link, useLocation } from "react-router-dom";
import { Dumbbell, LayoutDashboard, History, User } from "lucide-react";
import clsx from "clsx";
import { ReloadPrompt } from "./ReloadPrompt";

export function Layout() {
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: "Home", path: "/" },
        { icon: Dumbbell, label: "Workout", path: "/workout" },
        { icon: History, label: "History", path: "/history" },
        { icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="min-h-screen bg-background text-text font-sans flex flex-col">
            <ReloadPrompt />
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 safe-area-inset-top">
                <div className="max-w-md mx-auto p-4 h-full">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-secondary safe-area-inset-bottom z-50">
                <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200",
                                    isActive ? "text-primary" : "text-text-muted hover:text-text"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
