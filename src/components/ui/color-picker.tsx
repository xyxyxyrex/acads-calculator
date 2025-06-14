"use client"

import * as React from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  label?: string;
}

export function ColorPicker({ color, onChange, className, label }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
            <div className="mr-2 h-4 w-4 rounded-full border inline-block" style={{ backgroundColor: color }} />
            {color}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4">
          <HexColorPicker color={color} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
