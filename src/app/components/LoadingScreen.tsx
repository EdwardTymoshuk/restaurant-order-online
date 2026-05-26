'use client'

import { cn } from '@/utils/utils'
import { motion } from 'framer-motion'
import AnimatedLogo from './AnimatedLogo'

interface LoadingScreenProps {
  fullScreen?: boolean
}

const Dots = () => (
  <div className="flex items-center gap-2">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="block h-2 w-2 rounded-full bg-[#a3c13c]"
        animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 0.18,
        }}
      />
    ))}
  </div>
)

const LoadingScreen = ({ fullScreen = false }: LoadingScreenProps) => {
  if (fullScreen) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#173a8a]"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6"
        >
          <AnimatedLogo variant="dark" width={220} height={116} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <Dots />
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className={cn('flex h-screen w-full items-center justify-center')}>
      <AnimatedLogo variant="light" width={150} height={79} />
    </div>
  )
}

export default LoadingScreen
