"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

interface AnimatedSectionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode
  className?: string
  delay?: number
}

// Luxury cubic bezier easing for silky smooth natural deceleration
const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function AnimatedSection({
  children,
  className,
  delay = 0,
  ...props
}: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
      transition={{
        duration: 0.85,
        delay,
        ease: LUXURY_EASE,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  )
}

interface AnimatedDivProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedDiv({
  children,
  className,
  delay = 0,
  ...props
}: AnimatedDivProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -30px 0px" }}
      transition={{
        duration: 0.75,
        delay,
        ease: LUXURY_EASE,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -40px 0px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.75,
            ease: LUXURY_EASE,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.9,
        delay,
        ease: LUXURY_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
