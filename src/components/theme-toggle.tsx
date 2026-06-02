'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-full justify-center"
      />
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("goal");
    } else if (theme === "goal") {
      setTheme("light");
    } else {
      setTheme(resolvedTheme === "dark" ? "goal" : "dark");
    }
  }

  let icon = <Sun className="size-4 shrink-0 text-amber-500" />;
  let label = "Tema claro";
  let tooltipText = "Cambiar a tema oscuro";

  if (currentTheme === "dark") {
    icon = <Moon className="size-4 shrink-0 text-indigo-300" />;
    label = "Tema oscuro";
    tooltipText = "Cambiar a tema combinado";
  } else if (currentTheme === "goal") {
    icon = <Trophy className="size-4 shrink-0 text-amber-400 animate-pulse" />;
    label = "Tema combinado";
    tooltipText = "Cambiar a tema claro";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={cycleTheme}
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          {icon}
          <span className="group-data-[collapsible=icon]:hidden">
            {label}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="group-data-[collapsible=icon]:hidden">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
