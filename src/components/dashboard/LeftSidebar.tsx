import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Bot, 
  ListTodo, 
  Calendar, 
  Brain, 
  MessageSquare, 
  Wrench, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  X,
  Home
} from 'lucide-react';
import { NavSection, StateVisualConfig } from '../../types/jarvis';

interface LeftSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  config: StateVisualConfig;
  memoryCount?: number;
  toolsCount?: number;
  onClose?: () => void;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badge?: string | number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  config,
  memoryCount = 0,
  toolsCount = 66,
  onClose
}) => {
  const [isCoreStatusVisible, setIsCoreStatusVisible] = React.useState(true);
  const [hiddenNavSections, setHiddenNavSections] = React.useState<string[]>([]);

  const navItems: NavItemConfig[] = [
    { id: 'COMMAND_CENTER', label: 'COMMAND CENTER', icon: LayoutDashboard },
    { id: 'AI_CORE', label: 'AI CORE v3', icon: Cpu },
    { id: 'AGENTS', label: 'SUBSYSTEMS', icon: Bot, badge: '6' },
    { id: 'TASKS', label: 'TASKS', icon: ListTodo },
    { id: 'CALENDAR', label: 'REMINDERS', icon: Calendar },
    { id: 'MEMORY', label: 'MEMORY', icon: Brain, badge: memoryCount > 0 ? memoryCount : undefined },
    { id: 'CONVERSATIONS', label: 'CONVERSATIONS', icon: MessageSquare },
    { id: 'TOOLS', label: 'TOOLS & SKILLS', icon: Wrench, badge: toolsCount > 0 ? toolsCount : undefined },
    { id: 'SMART_HOME', label: 'SMART HOME / IOT', icon: Home, badge: 'IoT' }
  ];

  const visibleNavItems = navItems.filter(i => !hiddenNavSections.includes(i.id));

  return (
    <aside className={`jarvis-left-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header with Collapse Toggle & Cross Button */}
      <div className="sidebar-header" style={{ flexDirection: isCollapsed ? 'column' : 'row', gap: isCollapsed ? '4px' : '0' }}>
        {!isCollapsed && (
          <div className="sidebar-header-title font-mono">
            <span className="title-prefix">//</span> NAVIGATION
          </div>
        )}
        <div 
          className="sidebar-header-actions" 
          style={{ 
            display: 'flex', 
            flexDirection: isCollapsed ? 'column' : 'row', 
            alignItems: 'center', 
            gap: isCollapsed ? '4px' : '4px',
            width: isCollapsed ? '100%' : 'auto',
            justifyContent: 'center'
          }}
        >
          <button 
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            style={{ borderColor: 'rgba(0, 240, 255, 0.25)' }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" style={{ color: config.primaryColor }} />
            ) : (
              <ChevronLeft className="w-4 h-4" style={{ color: config.primaryColor }} />
            )}
          </button>
          {onClose && (
            <button
              type="button"
              className="hud-panel-close-btn"
              onClick={onClose}
              title="Hide Navigation Sidebar (Cross)"
              aria-label="Hide Navigation Sidebar"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.6)',
                color: '#f87171'
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Items List */}
      <nav className="sidebar-nav-list">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeSection === item.id;

          return (
            <div 
              key={item.id}
              className="sidebar-nav-item-container"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}
            >
              <button
                className={`sidebar-nav-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectSection(item.id)}
                title={item.label}
                style={{
                  borderColor: isSelected ? config.primaryColor : 'transparent',
                  backgroundColor: isSelected ? `${config.primaryColor}16` : undefined,
                  flex: 1
                }}
              >
                {/* Active Indicator Glow Bar */}
                {isSelected && (
                  <div 
                    className="nav-active-bar" 
                    style={{ 
                      backgroundColor: config.primaryColor,
                      boxShadow: `0 0 10px ${config.primaryColor}`
                    }} 
                  />
                )}

                <div className="nav-item-icon-wrapper">
                  <Icon 
                    className="w-4 h-4 nav-item-icon" 
                    style={{ color: isSelected ? config.primaryColor : '#94a3b8' }} 
                  />
                </div>

                {!isCollapsed && (
                  <>
                    <span 
                      className="nav-item-label font-mono"
                      style={{ color: isSelected ? config.primaryColor : '#e2e8f0', paddingRight: '18px' }}
                    >
                      {item.label}
                    </span>

                    {item.badge !== undefined && (
                      <span 
                        className="nav-item-badge font-mono"
                        style={{ 
                          borderColor: isSelected ? config.primaryColor : 'rgba(0, 240, 255, 0.2)',
                          color: isSelected ? config.primaryColor : '#94a3b8',
                          marginRight: '12px'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Individual Nav Item Cross Hide Button */}
              {!isCollapsed && (
                <button
                  type="button"
                  className="hud-panel-close-btn nav-item-cross-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHiddenNavSections(prev => [...prev, item.id]);
                  }}
                  title={`Hide ${item.label} (Cross)`}
                  aria-label={`Hide ${item.label}`}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '2px',
                    opacity: 0.6,
                    zIndex: 5
                  }}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Restore Hidden Nav Sections button */}
        {!isCollapsed && hiddenNavSections.length > 0 && (
          <div style={{ padding: '6px 4px' }}>
            <button
              type="button"
              className="hud-restore-chip-btn font-mono"
              onClick={() => setHiddenNavSections([])}
              title="Restore all hidden navigation items"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.62rem' }}
            >
              + RESTORE ({hiddenNavSections.length}) ITEMS
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Footer Subsystem Status */}
      {!isCollapsed && isCoreStatusVisible && (
        <div className="sidebar-footer">
          <div className="subsystem-box">
            <div className="subsystem-title font-mono" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles className="w-3 h-3" style={{ color: config.primaryColor }} />
                <span>SOVEREIGN CORE STATUS</span>
              </div>
              <button
                type="button"
                className="hud-panel-close-btn"
                onClick={() => setIsCoreStatusVisible(false)}
                title="Hide Core Status Box (Cross)"
                aria-label="Hide Core Status Box"
                style={{ padding: '1px 3px' }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="subsystem-details font-mono">
              <div className="detail-row">
                <span>TOOLS:</span>
                <span style={{ color: config.primaryColor }}>{toolsCount} ONLINE</span>
              </div>
              <div className="detail-row">
                <span>MEMORY:</span>
                <span style={{ color: '#10b981' }}>{memoryCount} STORED</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
