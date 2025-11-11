"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RoadmapItem {
  quarter: string;
  title: string;
  description: string;
  status?: "done" | "in-progress" | "upcoming";
}

export interface RoadmapCardProps {
  title?: string;
  description?: string;
  items: RoadmapItem[];
  className?: string;
}

export function RoadmapCard({
  title = "Product Roadmap",
  description = "Upcoming features and releases",
  items,
  className,
}: RoadmapCardProps) {
  return (
    <Card className={cn("w-full max-w-5xl border-white/10 bg-black/70 text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur", className)}>
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-white/60">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8">
          <div className="absolute left-6 right-6 top-12 h-px bg-white/10" />
          <div className="grid gap-6 lg:grid-cols-4">
            {items.map((item, index) => (
              <motion.div
                key={item.quarter}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  className={cn(
                    "absolute left-1/2 top-12 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-black",
                    item.status === "done" || item.status === "in-progress" ? "border-primary/80 bg-primary/40" : "",
                  )}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </motion.div>

                <Badge
                  variant={item.status === "done" || item.status === "in-progress" ? "default" : "outline"}
                  className="mb-8 mt-4 bg-white/10 text-xs uppercase tracking-wide text-white/80"
                >
                  {item.quarter}
                </Badge>

                <h4 className="text-base font-semibold text-white">{item.title}</h4>
                <p className="mt-2 text-sm text-white/60">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

