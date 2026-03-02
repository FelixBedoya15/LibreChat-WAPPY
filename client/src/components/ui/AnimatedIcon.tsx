import React from 'react';
import { motion } from 'framer-motion';

export type IconName = 'sparkles' | 'save' | 'trash' | 'qrcode' | 'plus' | 'history' | 'layout-list' | 'database' | 'chevron-right' | 'chevron-down' | 'file-text';

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
                    whileHover={{ scale: 1.2, rotate: 180 }}
                    whileTap={{ scale: 0.8 }}
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
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.9, y: 0 }}
                >
                    <motion.path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <motion.polyline
                        points="17 21 17 13 7 13 7 21"
                        whileHover={{ y: -1 }}
                        transition={{ ease: "easeOut" }}
                    />
                    <motion.polyline points="7 3 7 8 15 8" />
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
                    whileHover="hover"
                    whileTap="tap"
                >
                    <motion.path
                        d="M3 6h18"
                        variants={{
                            hover: { y: -2, rotate: -5, originX: 0.5, originY: 1 }
                        }}
                    />
                    <motion.path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <motion.path
                        d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                        variants={{
                            hover: { y: -2, rotate: -5, originX: 0.5, originY: 1 }
                        }}
                    />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
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
                    whileHover="hover"
                    whileTap="tap"
                >
                    <motion.rect width="5" height="5" x="3" y="3" rx="1" variants={{ hover: { scale: 1.1 } }} />
                    <motion.rect width="5" height="5" x="16" y="3" rx="1" variants={{ hover: { scale: 1.1, transition: { delay: 0.1 } } }} />
                    <motion.rect width="5" height="5" x="3" y="16" rx="1" variants={{ hover: { scale: 1.1, transition: { delay: 0.2 } } }} />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
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
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300 }}
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
                    whileHover="hover"
                    whileTap="tap"
                >
                    <motion.path
                        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        variants={{ hover: { rotate: -15 } }}
                    />
                    <path d="M3 3v5h5" />
                    <motion.path
                        d="M12 7v5l4 2"
                        variants={{ hover: { rotate: 45, originX: 0.1, originY: 0.1 } }}
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
                    whileHover="hover"
                    whileTap="tap"
                >
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                    <motion.path d="M14 4h7" variants={{ hover: { x: 2 } }} />
                    <motion.path d="M14 9h7" variants={{ hover: { x: 2, transition: { delay: 0.1 } } }} />
                    <motion.path d="M14 15h7" variants={{ hover: { x: 2, transition: { delay: 0.2 } } }} />
                    <motion.path d="M14 20h7" variants={{ hover: { x: 2, transition: { delay: 0.3 } } }} />
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
                    whileHover="hover"
                    whileTap="tap"
                >
                    <motion.ellipse cx="12" cy="5" rx="9" ry="3" variants={{ hover: { y: -1 } }} />
                    <motion.path d="M3 5V19A9 3 0 0 0 21 19V5" variants={{ hover: { y: 1 } }} />
                    <path d="M3 12A9 3 0 0 0 21 12" />
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
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.9 }}
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
                    whileHover={{ y: 2 }}
                    whileTap={{ scale: 0.9 }}
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
                    whileHover="hover"
                    whileTap="tap"
                >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <motion.path d="M14 2v4a2 2 0 0 0 2 2h4" variants={{ hover: { scale: 1.1, originX: 0, originY: 0 } }} />
                    <motion.path d="M10 9H8" variants={{ hover: { x: 2 } }} />
                    <motion.path d="M16 13H8" variants={{ hover: { x: 2, transition: { delay: 0.1 } } }} />
                    <motion.path d="M16 17H8" variants={{ hover: { x: 2, transition: { delay: 0.2 } } }} />
                </motion.svg>
            );

        default:
            return null;
    }
};
