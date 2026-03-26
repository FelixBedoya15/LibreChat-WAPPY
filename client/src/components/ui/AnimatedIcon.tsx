import React from 'react';
import { motion } from 'framer-motion';

export type IconName = 'sparkles' | 'save' | 'trash' | 'qrcode' | 'plus' | 'history' | 'layout-list' | 'database' | 'chevron-right' | 'chevron-down' | 'file-text' | 'robot' | 'brain' | 'upload' | 'download' | 'refresh-cw' | 'inbox' | 'sidebar' | 'bookmark' | 'camera' | 'shield' | 'search' | 'user' | 'video';

interface AnimatedIconProps {
    name: IconName;
    className?: string;
    size?: number | string;
    strokeWidth?: number;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
    name,
    className = '',
    size = 24,
    strokeWidth = 2,
}) => {
    const customVariant = {
        hover: { scale: 1.1, rotate: 0 },
        tap: { scale: 0.9 },
    };

    switch (name) {
        case 'sparkles':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { scale: 1.2, rotate: 180 }, tap: { scale: 0.8 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                    <path d="M20 3v4" />
                    <path d="M22 5h-4" />
                    <path d="M4 17v2" />
                    <path d="M5 18H3" />
                </motion.svg>
            );

        case 'save':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { scale: 1.1, y: -2 }, tap: { scale: 0.9 } }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                </motion.svg>
            );

        case 'trash':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                >
                    <motion.path
                        d="M3 6h18"
                        variants={{
                            hover: { y: -3, rotate: -10, originX: "50%", originY: "100%" }
                        }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <motion.path
                        d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                        variants={{
                            hover: { y: -4, rotate: 10, originX: "50%", originY: "100%" }
                        }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    />
                    <motion.path d="M10 11v6" variants={{ hover: { height: 8 } }} />
                    <motion.path d="M14 11v6" variants={{ hover: { height: 8 } }} />
                </motion.svg>
            );

        case 'qrcode':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                >
                    <motion.rect width="5" height="5" x="3" y="3" rx="1" variants={{ hover: { scale: 1.2, x: -1, y: -1 } }} />
                    <motion.rect width="5" height="5" x="16" y="3" rx="1" variants={{ hover: { scale: 1.2, x: 1, y: -1 } }} />
                    <motion.rect width="5" height="5" x="3" y="16" rx="1" variants={{ hover: { scale: 1.2, x: -1, y: 1 } }} />
                    <motion.path d="M21 16h-3a2 2 0 0 0-2 2v3" variants={{ hover: { scale: 1.1 } }} />
                    <path d="M21 21v.01" />
                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                    <path d="M3 12h.01" />
                    <path d="M12 3h.01" />
                    <path d="M12 16v.01" />
                    <path d="M16 12h1" />
                    <path d="M21 12v.01" />
                    <path d="M12 21v-1" />
                </motion.svg>
            );

        case 'plus':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { scale: 1.25, rotate: 180 }, tap: { scale: 0.8 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                </motion.svg>
            );

        case 'history':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                >
                    <motion.path
                        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        variants={{ hover: { rotate: -45, scale: 1.05 } }}
                        transition={{ duration: 0.3 }}
                    />
                    <path d="M3 3v5h5" />
                    <motion.path
                        d="M12 7v5l4 2"
                        variants={{ hover: { rotate: 360 } }}
                        transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                        style={{ originX: "12px", originY: "12px" }}
                    />
                </motion.svg>
            );

        case 'layout-list':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                >
                    <motion.rect width="7" height="7" x="3" y="3" rx="1" variants={{ hover: { scale: 1.1 } }} />
                    <motion.rect width="7" height="7" x="3" y="14" rx="1" variants={{ hover: { scale: 1.1 } }} />
                    <motion.path d="M14 4h7" variants={{ hover: { x: 4 } }} />
                    <motion.path d="M14 9h7" variants={{ hover: { x: 4, transition: { delay: 0.05 } } }} />
                    <motion.path d="M14 15h7" variants={{ hover: { x: 4, transition: { delay: 0.1 } } }} />
                    <motion.path d="M14 20h7" variants={{ hover: { x: 4, transition: { delay: 0.15 } } }} />
                </motion.svg>
            );

        case 'database':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                >
                    <motion.ellipse cx="12" cy="5" rx="9" ry="3" variants={{ hover: { y: -2, scale: 1.05 } }} transition={{ type: 'spring', stiffness: 300 }} />
                    <motion.path d="M3 5V19A9 3 0 0 0 21 19V5" variants={{ hover: { scaleY: 1.1, originY: "bottom" } }} />
                    <motion.path d="M3 12A9 3 0 0 0 21 12" variants={{ hover: { y: 2 } }} />
                </motion.svg>
            );

        case 'chevron-right':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { x: 5 }, tap: { scale: 0.8 } }}
                >
                    <path d="m9 18 6-6-6-6" />
                </motion.svg>
            );

        case 'chevron-down':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { y: 5 }, tap: { scale: 0.8 } }}
                >
                    <path d="m6 9 6 6 6-6" />
                </motion.svg>
            );

        case 'file-text':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                >
                    <motion.path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" variants={{ hover: { scale: 1.02 } }} />
                    <motion.path d="M14 2v4a2 2 0 0 0 2 2h4" variants={{ hover: { scale: 1.2, originX: 0, originY: 0 } }} />
                    <motion.path d="M10 9H8" variants={{ hover: { x: 3 } }} />
                    <motion.path d="M16 13H8" variants={{ hover: { x: 3, transition: { delay: 0.05 } } }} />
                    <motion.path d="M16 17H8" variants={{ hover: { x: 3, transition: { delay: 0.1 } } }} />
                </motion.svg>
            );

        case 'robot':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { scale: 1.1, rotate: [0, -10, 10, -10, 0] }, tap: { scale: 0.9 } }}
                >
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                </motion.svg>
            );

        case 'brain':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { scale: 1.2, filter: "drop-shadow(0 0 8px rgba(20, 184, 166, 0.5))" }, tap: { scale: 0.8 } }}
                >
                    <path d="M9.5 2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
                    <path d="M14.5 2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </motion.svg>
            );

        case 'upload':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { y: -3 }, tap: { scale: 0.9 } }}
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </motion.svg>
            );

        case 'download':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { y: 3 }, tap: { scale: 0.9 } }}
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </motion.svg>
            );

        case 'refresh-cw':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    
                    
                    variants={{ hover: { rotate: 180 }, tap: { scale: 0.8 } }}
                >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </motion.svg>
            );

        case 'inbox':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { y: -2, scale: 1.05 }, tap: { scale: 0.9 } }}
                >
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </motion.svg>
            );

        case 'sidebar':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { x: -2, scale: 1.1 }, tap: { scale: 0.9 } }}
                >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 3v18" />
                </motion.svg>
            );

        case 'bookmark':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { y: -3, rotate: 15 }, tap: { scale: 0.8 } }}
                >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                </motion.svg>
            );

        case 'camera':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { scale: 1.1, rotate: [0, -10, 10, 0] }, tap: { scale: 0.9 } }}
                >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                </motion.svg>
            );

        case 'shield':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { scale: 1.15, y: -2 }, tap: { scale: 0.85 } }}
                >
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
                    <path d="m9 12 2 2 4-4" />
                </motion.svg>
            );

        case 'search':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { scale: 1.2, x: 2, y: -2 }, tap: { scale: 0.8 } }}
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </motion.svg>
            );

        case 'user':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { scale: 1.1, y: -1 }, tap: { scale: 0.9 } }}
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </motion.svg>
            );

        case 'video':
            return (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    variants={{ hover: { scale: 1.1, rotate: 5 }, tap: { scale: 0.9 } }}
                >
                    <path d="m22 8-6 4 6 4V8Z" />
                    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                </motion.svg>
            );

        default:
            return null;
    }
};
