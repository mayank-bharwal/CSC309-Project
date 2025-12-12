import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user, isManager } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const subMenuRefs = useRef({});

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  // Memoize nav items to prevent recreation on every render
  const navItems = useMemo(() => {
    const items = [
      {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        name: 'Dashboard',
        path: '/',
      },
    ];

    // Cashier items (includes managers)
    const isCashierOrManager = user?.role === 'cashier' || user?.role === 'manager' || user?.role === 'superuser';

    if (isCashierOrManager) {
      items.push({
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
        name: 'Cashier',
        subItems: [
          { name: 'Register User', path: '/cashier/register-user' },
          { name: 'Create Transaction', path: '/cashier/create-transaction' },
          { name: 'Process Redemption', path: '/cashier/process-redemption' },
        ],
      });
    }

    // Manager items
    if (isManager()) {
      items.push({
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        name: 'Users',
        subItems: [
          { name: 'All Users', path: '/manager/users' },
        ],
      });

      items.push({
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        name: 'Transactions',
        subItems: [
          { name: 'All Transactions', path: '/manager/transactions' },
        ],
      });

      items.push({
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
        name: 'Promotions',
        subItems: [
          { name: 'All Promotions', path: '/manager/promotions' },
          { name: 'Create Promotion', path: '/manager/promotions/create' },
        ],
      });

      items.push({
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        name: 'Events',
        subItems: [
          { name: 'All Events', path: '/manager/events' },
          { name: 'Create Event', path: '/manager/events/create' },
        ],
      });
      return items;
    }
    items.push({
      name: "Points",
      path: "/regular/points",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 00-4 4v5h8v-5a4 4 0 00-4-4z" />
        </svg>
      ),
    });

    items.push({
      name: "QR Code",
      path: "/regular/qr",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
        </svg>
      ),
    });

    items.push({
      name: "Transfer Points",
      path: "/regular/transfer",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M12 6v12" />
        </svg>
      ),
    });

    items.push({
      name: "Redemption",
      path: "/regular/redemption",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
        </svg>
      ),
    });

    items.push({
      name: "Promotions",
      path: "/regular/promotions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h14" />
        </svg>
      ),
    });
    items.push({
      name: "Events",
      path: "/regular/events",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    
    });

    items.push({
      name: "Transactions",
      path: "/regular/transactions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 7h18M3 12h18M3 17h18" 
          />
        </svg>
      ),
    });
    items.push({
      name: "Pending Redemption",
      path: "/regular/unprocessed-redemption",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    });

    return items;
  }, [isManager]);

  // Auto-open submenu based on current path
  useEffect(() => {
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        const isSubItemActive = nav.subItems.some(
          (subItem) => location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
        );
        if (isSubItemActive) {
          setOpenSubmenu(index);
        }
      }
    });
  }, [location.pathname, navItems]);

  const handleSubmenuToggle = (index) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? 'w-[290px]'
            : isHovered
            ? 'w-[290px]'
            : 'w-[90px]'
        }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
            LP
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              Loyalty
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? 'Menu' : '•••'}
              </h2>
              <ul className="flex flex-col gap-2">
                {navItems.map((nav, index) => (
                  <li key={nav.name}>
                    {nav.subItems ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSubmenuToggle(index)}
                          className={`flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                            openSubmenu === index
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          } ${
                            !isExpanded && !isHovered
                              ? 'lg:justify-center'
                              : 'lg:justify-start'
                          }`}
                        >
                          <span className="flex-shrink-0">{nav.icon}</span>
                          {(isExpanded || isHovered || isMobileOpen) && (
                            <>
                              <span className="font-medium">{nav.name}</span>
                              <svg
                                className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                                  openSubmenu === index ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                        {(isExpanded || isHovered || isMobileOpen) && openSubmenu === index && (
                          <div
                            ref={(el) => {
                              subMenuRefs.current[`main-${index}`] = el;
                            }}
                            className="overflow-hidden"
                          >
                            <ul className="mt-1 ml-9 space-y-1">
                              {nav.subItems.map((subItem) => (
                                <li key={subItem.name}>
                                  <Link
                                    to={subItem.path}
                                    className={`block px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                                      isActive(subItem.path)
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                  >
                                    {subItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      nav.path && (
                        <Link
                          to={nav.path}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive(nav.path)
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          } ${
                            !isExpanded && !isHovered
                              ? 'lg:justify-center'
                              : 'lg:justify-start'
                          }`}
                        >
                          <span className="flex-shrink-0">{nav.icon}</span>
                          {(isExpanded || isHovered || isMobileOpen) && (
                            <span className="font-medium">{nav.name}</span>
                          )}
                        </Link>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* User info */}
        {(isExpanded || isHovered || isMobileOpen) && user && (
          <div className="mt-auto mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
