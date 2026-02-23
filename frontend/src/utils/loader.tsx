import React from 'react';
import { motion } from 'framer-motion';

// import Loader from '@/utils/loader';

// // Full-screen loader
// <Loader />

// // Inline loader within a component
// <Loader fullScreen={false} />

// // Custom background
// <Loader backgroundColor="bg-blue-50 dark:bg-blue-950" />

interface LoaderProps {
  fullScreen?: boolean;
  backgroundColor?: string;
}

const Loader: React.FC<LoaderProps> = ({
  fullScreen = true,
  backgroundColor = 'bg-white dark:bg-slate-950',
}) => {
  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 ${backgroundColor}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <motion.img
            src="/loadingNexus.webp"
            alt="Loading Nexus"
            className="w-32 h-12 md:w-40 md:h-16 object-contain"
          />
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Inline loader for use within components
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 m-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <motion.img
          src="/loadingNexus.webp"
          alt="Loading Nexus"
          className="w-32 h-12 md:w-40 md:h-16 object-contain"
        />
        <motion.div
          className="flex gap-1"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Loader;
