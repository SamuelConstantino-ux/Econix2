import React, { useState, useEffect } from 'react';
import { Home, List, User as UserIcon, Tags, Flag, ChevronLeft, ChevronRight, Menu, LogOut } from 'lucide-react';
import { ViewType, User } from '../types';

interface SidebarProps {
    activeView: ViewType;
    onNavigate: (view: ViewType) => void;
    user: User | null;
    onLogout: () => void;
    isMobileOpen: boolean;
    setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeView,
    onNavigate,
    user,
    onLogout,
    isMobileOpen,
    setIsMobileOpen
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setIsExpanded(true); // Always "expanded" visually when open in mobile (drawer mode)
            } else {
                setIsMobileOpen(false); // Close mobile drawer when resizing to desktop
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [setIsMobileOpen]);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    const menuItems = [
        { id: 'dashboard', label: 'Início', icon: Home },
        { id: 'records', label: 'Registros', icon: List },
        { id: 'categories', label: 'Categorias', icon: Tags },
        { id: 'goals', label: 'Metas', icon: Flag },
        { id: 'profile', label: 'Perfil', icon: UserIcon },
    ];

    // Base classes for the sidebar container
    const containerClasses = `
    fixed md:relative z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col
    ${isMobile
            ? `top-0 left-0 w-64 shadow-2xl transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${isExpanded ? 'w-64' : 'w-20'}`
        }
  `;

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={containerClasses}>
                {/* Header / Logo */}
                <div className={`h-16 flex items-center ${isExpanded ? 'justify-between px-6' : 'justify-center'} border-b border-gray-100`}>
                    {isExpanded ? (
                        <h1 className="text-xl font-black text-blue-600 tracking-tighter">ECONIX</h1>
                    ) : (
                        <h1 className="text-xl font-black text-blue-600 tracking-tighter">E</h1>
                    )}

                    {!isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                            {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </button>
                    )}

                    {isMobile && (
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="p-1.5 rounded-lg bg-gray-50 text-gray-500"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>

                {/* User Info (Desktop Collapsed/Expanded) */}
                {user && (
                    <div className={`p-4 border-b border-gray-100 flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 overflow-hidden">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.slice(0, 2).toUpperCase()}
                        </div>

                        {isExpanded && (
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id as ViewType);
                                    if (isMobile) setIsMobileOpen(false);
                                }}
                                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }
                  ${!isExpanded && !isMobile ? 'justify-center' : ''}
                `}
                                title={!isExpanded ? item.label : undefined}
                            >
                                <Icon
                                    size={20}
                                    className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                />

                                {isExpanded && (
                                    <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                                )}

                                {/* Active Indicator for Collapsed State */}
                                {!isExpanded && !isMobile && isActive && (
                                    <div className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onLogout}
                        className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors
              ${!isExpanded && !isMobile ? 'justify-center' : ''}
            `}
                        title="Sair"
                    >
                        <LogOut size={20} className="shrink-0" />
                        {isExpanded && <span className="font-medium text-sm">Sair</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
