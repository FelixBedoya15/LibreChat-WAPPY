import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@librechat/client';

interface Ad {
    _id: string;
    title: string;
    content?: string;
    images: string[];
    link?: string;
    ctaText?: string;
}

interface AdCarouselProps {
    ads: Ad[];
}

const AdCarousel: React.FC<AdCarouselProps> = ({ ads }) => {
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        if (ads.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentAdIndex((prev) => (prev + 1) % ads.length);
        }, 8000); // Rotate every 8 seconds

        return () => clearInterval(interval);
    }, [ads.length]);

    const nextAd = () => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    };

    const prevAd = () => {
        setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
    };

    if (ads.length === 0) return null;

    const currentAd = ads[currentAdIndex];

    return (
        <div className="relative w-full overflow-hidden rounded-lg bg-surface-secondary shadow-md mt-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentAd._id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col"
                >
                    {currentAd.images[0] && (
                        <div className="relative h-40 w-full overflow-hidden">
                            <img
                                src={currentAd.images[0]}
                                alt={currentAd.title}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}
                    <div className="p-4">
                        <h3 className="mb-2 text-lg font-semibold text-text-primary">{currentAd.title}</h3>
                        {currentAd.content && (
                            <p className="mb-4 text-sm text-text-secondary line-clamp-3">
                                {currentAd.content}
                            </p>
                        )}
                        {currentAd.link && (
                            <Button
                                asChild
                                className="w-full justify-center gap-2"
                                onClick={() => {
                                    let href = currentAd.link || '';
                                    if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
                                        href = `https://${href}`;
                                    }
                                    window.open(href, '_blank');
                                }}
                            >
                                <span>
                                    {currentAd.ctaText || 'Ver más'} <ExternalLink className="h-4 w-4" />
                                </span>
                            </Button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons for manual control */}
            {ads.length > 1 && (
                <>
                    <button
                        className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 focus:outline-none"
                        onClick={(e) => {
                            e.stopPropagation();
                            prevAd();
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 focus:outline-none"
                        onClick={(e) => {
                            e.stopPropagation();
                            nextAd();
                        }}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </>
            )}
        </div>
    );
};

export default AdCarousel;
