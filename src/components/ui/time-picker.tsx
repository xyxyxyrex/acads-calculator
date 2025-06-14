"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
  label?: string
}

const HOURS = Array.from({ length: 12 }).map((_, i) => i + 1); // 1-12
const MINUTES = [0, 15, 30, 45];
const AMPM = ["AM", "PM"];

function toAmPm(hhmm: string): { hour: number; minute: number; ampm: string } {
  if (!hhmm) return { hour: 7, minute: 0, ampm: "AM" };
  const [h, m] = hhmm.split(":").map(Number);
  let ampm = h >= 12 ? "PM" : "AM";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: m, ampm };
}

function to24Hour(hour: number, minute: number, ampm: string): string {
  let h = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
  return `${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function TimePicker({ value, onChange, className, label }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { hour, minute, ampm } = toAmPm(value);
  const [selHour, setSelHour] = React.useState(hour);
  const [selMinute, setSelMinute] = React.useState(minute);
  const [selAmPm, setSelAmPm] = React.useState(ampm);

  React.useEffect(() => {
    setSelHour(hour);
    setSelMinute(minute);
    setSelAmPm(ampm);
  }, [value]);

  const handleChange = (h: number, m: number, ap: string) => {
    setSelHour(h);
    setSelMinute(m);
    setSelAmPm(ap);
    onChange(to24Hour(h, m, ap));
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            type="button"
          >
            <Clock className="mr-2 h-4 w-4" />
            {`${selHour.toString().padStart(2, "0")}:${selMinute.toString().padStart(2, "0")} ${selAmPm}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1 focus:outline-none"
              value={selHour}
              onChange={e => handleChange(Number(e.target.value), selMinute, selAmPm)}
            >
              {HOURS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span>:</span>
            <select
              className="border rounded px-2 py-1 focus:outline-none"
              value={selMinute}
              onChange={e => handleChange(selHour, Number(e.target.value), selAmPm)}
            >
              {MINUTES.map(m => (
                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
              ))}
            </select>
            <select
              className="border rounded px-2 py-1 focus:outline-none"
              value={selAmPm}
              onChange={e => handleChange(selHour, selMinute, e.target.value)}
            >
              {AMPM.map(ap => (
                <option key={ap} value={ap}>{ap}</option>
              ))}
            </select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

