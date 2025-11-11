"use client";

import { ReactNode } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("grid w-full auto-rows-[22rem] grid-cols-1 gap-4 lg:grid-cols-3", className)}>
      {children}
    </div>
  );
};

type IconType = React.ComponentType<React.ComponentProps<"svg">>;

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon: IconType;
  description: string;
  href: string;
  cta: string;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-1 flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur",
      "transform-gpu transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:bg-black/70 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]",
      className,
    )}
  >
    {background && <div>{background}</div>}
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-2 p-6 transition-all duration-300 group-hover:-translate-y-4">
      <Icon className="h-12 w-12 origin-left transform-gpu text-white transition-all duration-300 ease-in-out group-hover:scale-90" />
      <h3 className="text-xl font-semibold text-white">{name}</h3>
      <p className="max-w-lg text-sm text-white/70">{description}</p>
    </div>

    <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-6 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
      <Button
        variant="ghost"
        asChild
        size="sm"
        className="pointer-events-auto text-white hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white/90"
      >
        <a href={href}>
          {cta}
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
    <div className="pointer-events-none absolute inset-0 transform-gpu bg-gradient-to-br from-white/10 via-white/0 to-white/5 opacity-0 transition-all duration-300 group-hover:opacity-100" />
  </div>
);

export { BentoCard, BentoGrid };

