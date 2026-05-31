/* eslint-disable @next/next/no-img-element */
import { Download, MonitorDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Glow } from "@/components/ui/glow";
import { Mockup } from "@/components/ui/mockup";
import { cn } from "@/lib/utils";

interface HeroWithMockupProps {
  title: string;
  description: string;
  primaryCta?: {
    text: string;
    href: string;
    method?: "get" | "post";
    download?: boolean;
  };
  secondaryCta?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
  mockupImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  className?: string;
}

export function HeroWithMockup({
  title,
  description,
  primaryCta = {
    text: "Download for macOS",
    href: "/api/checkout",
    method: "post",
  },
  secondaryCta = {
    text: "View screenshots",
    href: "#screenshots",
    icon: <MonitorDown className="mr-2 h-4 w-4" />,
  },
  mockupImage,
  className,
}: HeroWithMockupProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-background px-4 py-12 text-foreground md:py-24 lg:py-32",
        className,
      )}
    >
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-12 lg:gap-24">
        <div className="relative z-10 flex flex-col items-center gap-6 pt-8 text-center md:pt-16 lg:gap-12">
          <h1
            className={cn(
              "inline-block animate-appear",
              "bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground",
              "bg-clip-text text-transparent",
              "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl",
              "leading-[1.1] sm:leading-[1.1]",
              "drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]",
            )}
          >
            {title}
          </h1>

          <p
            className={cn(
              "max-w-[650px] animate-appear text-base font-medium opacity-0 [animation-delay:150ms] sm:text-lg md:text-xl",
              "text-muted-foreground",
            )}
          >
            {description}
          </p>

          <div className="relative z-10 flex animate-appear flex-wrap justify-center gap-4 opacity-0 [animation-delay:300ms]">
            {primaryCta.method === "post" ? (
              <form action={primaryCta.href} method="post">
                <Button
                  size="lg"
                  type="submit"
                  className={cn(
                    "bg-gradient-to-b from-brand to-brand/90 text-white shadow-lg",
                    "hover:from-brand/95 hover:to-brand/85",
                    "transition-all duration-300",
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {primaryCta.text}
                </Button>
              </form>
            ) : (
              <Button
                asChild
                size="lg"
                className={cn(
                  "bg-gradient-to-b from-brand to-brand/90 text-white shadow-lg",
                  "hover:from-brand/95 hover:to-brand/85",
                  "transition-all duration-300",
                )}
              >
                <a href={primaryCta.href} download={primaryCta.download ?? true}>
                  <Download className="mr-2 h-4 w-4" />
                  {primaryCta.text}
                </a>
              </Button>
            )}

            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-foreground/80 transition-all duration-300 hover:text-foreground"
            >
              <a href={secondaryCta.href}>
                {secondaryCta.icon}
                {secondaryCta.text}
              </a>
            </Button>
          </div>

          <div className="relative w-full px-4 pt-12 sm:px-6 lg:px-8">
            <Mockup
              className={cn(
                "animate-appear opacity-0 [animation-delay:700ms]",
                "rounded-lg border-brand/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)]",
              )}
            >
              <img
                src={mockupImage.src}
                alt={mockupImage.alt}
                width={mockupImage.width}
                height={mockupImage.height}
                className="h-auto w-full"
                loading="eager"
                decoding="async"
              />
            </Mockup>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Glow
          variant="above"
          className="animate-appear-zoom opacity-0 [animation-delay:1000ms]"
        />
      </div>
    </section>
  );
}
