import React, { createContext, useContext, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const StackingCardsContext = createContext(null);

export const useStackingCardsContext = () => {
  const context = useContext(StackingCardsContext);
  if (!context) {
    throw new Error("StackingCardItem must be used within StackingCards");
  }
  return context;
};

export default function StackingCards({
  children,
  className,
  scrollOptions,
  scaleMultiplier = 0.03,
  totalCards,
  ...props
}) {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    ...scrollOptions,
    target: scrollOptions?.container ? undefined : targetRef,
  });

  return (
    <StackingCardsContext.Provider
      value={{ progress: scrollYProgress, scaleMultiplier, totalCards }}
    >
      <div className={cn(className)} ref={targetRef} {...props}>
        {children}
      </div>
    </StackingCardsContext.Provider>
  );
}

export const StackingCardItem = ({
  index,
  topPosition,
  className,
  children,
  ...props
}) => {
  const {
    progress,
    scaleMultiplier = 0.03,
    totalCards = 0,
  } = useStackingCardsContext();

  const scaleTo = 1 - (totalCards - index) * scaleMultiplier;
  const rangeScale = [index * (1 / (totalCards || 1)), 1];
  const scale = useTransform(progress, rangeScale, [1, scaleTo]);
  const defaultTop = `calc(5.5rem + ${index * 1.5}rem)`;
  const top = topPosition ?? defaultTop;

  return (
    <div
      className={cn("sticky", className)}
      style={{ top }}
      {...props}
    >
      <motion.div
        className="origin-top relative w-full h-full"
        style={{ scale }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export { StackingCards };
