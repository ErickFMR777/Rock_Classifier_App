import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner: React.FC = () => {
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
        <p className="text-xl font-bold text-gray-800">Analyzing your rock...</p>
        <p className="text-sm text-gray-500">Using deep learning AI (ResNet50)</p>
      </div>
    </motion.div>
  );
};
