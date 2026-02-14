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
        <div className="min-h-screen bg-background text-text font-sans flex flex-col relative isolate overflow-hidden">
            {/* Ambient Technical Grid */}
            <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_800px_at_50%_-100px,#1a1d26,transparent)] opacity-40" />

            <ReloadPrompt />
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 safe-area-inset-top">
                <div className="max-w-md mx-auto p-4 h-full">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-white/5 safe-area-inset-bottom z-50">
                <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative group",
                                    isActive ? "text-primary" : "text-white/40 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-0 w-1/2 h-[1px] bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                                )}
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2 : 1.5}
                                    className={clsx("transition-transform duration-300", isActive && "scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]")}
                                />
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em]">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
