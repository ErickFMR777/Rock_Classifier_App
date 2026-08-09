import React from 'react';
import { motion } from 'framer-motion';
import { useLocale } from '../lib/i18n';
import { ui } from '../data/ui';

export const LoadingSpinner: React.FC = () => {
  const { t } = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 space-y-6"
    >
      <div className="relative w-20 h-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 border-4 border-transparent border-t-amber-500 border-r-orange-500 rounded-full"
        />
      </div>
      <div className="space-y-2 text-center">
        <p className="text-xl font-bold text-gray-800">{t(ui.loading.title)}</p>
        <p className="text-sm text-gray-500">{t(ui.loading.subtitle)}</p>
      </div>
    </motion.div>
  );
};
