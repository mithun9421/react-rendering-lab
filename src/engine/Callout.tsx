import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";

type Tone = "info" | "warn" | "good" | "bad" | "next";

/**
 * Callout container variant: tinted background + left-border accent rail.
 * The right-hand body keeps default text colour while the rail tint signals tone.
 */
const calloutVariants = cva(
  "border-l-4 px-4 py-3 text-sm shadow-none",
  {
    variants: {
      tone: {
        info: "border-l-accent-info bg-accent-info/5",
        warn: "border-l-accent-warn bg-accent-warn/5",
        good: "border-l-accent-good bg-accent-good/5",
        bad: "border-l-accent-bad bg-accent-bad/5",
        next: "border-l-accent bg-accent/5",
      },
    },
    defaultVariants: { tone: "info" },
  }
);

const toneToBadgeVariant: Record<Tone, BadgeProps["variant"]> = {
  info: "info",
  warn: "warn",
  good: "success",
  bad: "destructive",
  next: "default",
};

export interface CalloutProps extends VariantProps<typeof calloutVariants> {
  tone?: Tone;
  title?: string;
  children: React.ReactNode;
}

export function Callout({ tone = "info", title, children }: CalloutProps) {
  return (
    <Card className={cn(calloutVariants({ tone }), "rounded-lg")}>
      {title && (
        <div className="mb-1">
          <Badge
            variant={toneToBadgeVariant[tone]}
            className="font-mono uppercase tracking-widest text-[11px]"
          >
            {title}
          </Badge>
        </div>
      )}
      <div className="text-ink">{children}</div>
    </Card>
  );
}
