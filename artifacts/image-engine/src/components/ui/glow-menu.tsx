"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MenuItem {
  icon: React.FC<{ className?: string }>
  label: string
  href?: string
  gradient: string
  iconColor: string
}

interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuItem[]
  activeItem?: string
  onItemClick?: (label: string) => void
  isDark?: boolean
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export const GlowMenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(
  ({ className, items, activeItem, onItemClick, isDark = false, ...props }, ref) => {
    return (
      <motion.nav
        ref={ref}
        className={cn(
          "p-2 rounded-2xl backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden",
          isDark
            ? "bg-gradient-to-b from-[#1c1a16]/80 to-[#141310]/40"
            : "bg-gradient-to-b from-background/80 to-background/40",
          className,
        )}
        initial="initial"
        whileHover="hover"
        {...props}
      >
        <motion.div
          className={cn(
            "absolute -inset-2 rounded-3xl z-0 pointer-events-none",
            isDark
              ? "bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.15)_0%,_rgba(168,85,247,0.1)_40%,_transparent_70%)]"
              : "bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.1)_0%,_rgba(168,85,247,0.06)_40%,_transparent_70%)]",
          )}
          variants={navGlowVariants}
        />
        <ul className="flex items-center gap-1 relative z-10 flex-wrap">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.label === activeItem

            return (
              <motion.li key={item.label} className="relative">
                <button
                  onClick={() => onItemClick?.(item.label)}
                  className="block w-full"
                >
                  <motion.div
                    className="block rounded-xl overflow-visible group relative"
                    style={{ perspective: "600px" }}
                    whileHover="hover"
                    initial="initial"
                  >
                    {/* Glow background */}
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none"
                      variants={glowVariants}
                      animate={isActive ? "hover" : "initial"}
                      style={{
                        background: item.gradient,
                        opacity: isActive ? 1 : 0,
                        borderRadius: "16px",
                      }}
                    />

                    {/* Front face */}
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 relative z-10 bg-transparent transition-colors rounded-xl text-sm font-medium",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                      variants={itemVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center bottom",
                      }}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-colors duration-300", isActive ? item.iconColor : "")} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </motion.div>

                    {/* Back face */}
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 absolute inset-0 z-10 bg-transparent transition-colors rounded-xl text-sm font-medium",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                      variants={backVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center top",
                        rotateX: 90,
                      }}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", item.iconColor)} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </motion.div>
                  </motion.div>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </motion.nav>
    )
  },
)

GlowMenuBar.displayName = "GlowMenuBar"
