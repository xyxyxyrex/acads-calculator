"use client";

// Timetable generator page. Provides functionality to add subjects, customise appearance and export timetable.

import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TimePicker } from "@/components/ui/time-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toPng, toJpeg } from "html-to-image";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/color-picker";

interface Subject {
  id: string;
  code: string;
  description: string;
  days: string[];
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  room: string;
  color: string;
}

const days = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

const HOURS = Array.from({ length: 15 }).map((_, i) => i + 7); // 7-21

export default function TimetablePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [themeColor, setThemeColor] = useState("#f5f5f5");
  const [wallpaper, setWallpaper] = useState<string>();

  // export settings
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");
  const [exportWidth, setExportWidth] = useState(1920);
  const [exportHeight, setExportHeight] = useState(1080);

  const timetableRef = useRef<HTMLDivElement>(null);

  // form state
  const [form, setForm] = useState({
    code: "",
    description: "",
    days: [] as string[],
    start: "07:00",
    end: "08:00",
    room: "",
    color: "#60a5fa",
  });

  const handleAddSubject = () => {
    if (!form.code || !form.description) return;
    const newSub: Subject = {
      id: crypto.randomUUID(),
      code: form.code,
      description: form.description,
      days: [...form.days],
      start: form.start,
      end: form.end,
      room: form.room,
      color: form.color,
    };
    setSubjects((prev) => [...prev, newSub]);
  };

  const handleWallpaperChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setWallpaper(url);
    }
  };

  const exportTimetable = async () => {
    if (!timetableRef.current) return;
    const node = timetableRef.current;
    const options = {
      width: exportWidth,
      height: exportHeight,
      cacheBust: true,
      skipFonts: true,
    };
    try {
      let dataUrl: string;
      if (exportFormat === "png") {
        dataUrl = await toPng(node, options);
      } else {
        dataUrl = await toJpeg(node, { ...options, quality: 0.95 });
      }
      saveAs(dataUrl, `timetable.${exportFormat}`);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  // helpers
  const hourToLabel = (h: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const normalized = h % 12 === 0 ? 12 : h % 12;
    return `${normalized}${suffix}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Timetable Generator</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Add Subject</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="code" className="text-right">
                  Code
                </Label>
                <Input
                  id="code"
                  value={form.code}
                  className="col-span-3"
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="desc" className="text-right">
                  Description
                </Label>
                <Input
                  id="desc"
                  value={form.description}
                  className="col-span-3"
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Days</Label>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {days.map((d) => (
                    <div key={d.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${d.id}`}
                        checked={form.days.includes(d.id)}
                        onCheckedChange={() => {
                          setForm((prev) => ({
                            ...prev,
                            days: prev.days.includes(d.id)
                              ? prev.days.filter((day) => day !== d.id)
                              : [...prev.days, d.id],
                          }));
                        }}
                      />
                      <Label htmlFor={`day-${d.id}`}>{d.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Start</Label>
                <div className="col-span-3">
                  <TimePicker
                    value={form.start}
                    onChange={(val: string) => setForm({ ...form, start: val })}
                    label="Start Time"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">End</Label>
                <div className="col-span-3">
                  <TimePicker
                    value={form.end}
                    onChange={(val: string) => setForm({ ...form, end: val })}
                    label="End Time"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Room</Label>
                <Input
                  value={form.room}
                  className="col-span-3"
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Color</Label>
                <div className="col-span-3">
                  <ColorPicker
                    color={form.color}
                    onChange={(color) => setForm({ ...form, color })}
                    label="Subject Color"
                  />
                </div>
              </div>
              <Button onClick={handleAddSubject}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Theme + wallpaper */}
        <div className="flex items-center gap-2">
          <Label>Theme Color</Label>
          <Input
            type="color"
            value={themeColor}
            className="w-10 h-8 p-0 border-none"
            onChange={(e) => setThemeColor(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>Wallpaper</Label>
          <Input
            type="file"
            accept="image/*"
            className="max-w-[200px]"
            onChange={handleWallpaperChange}
          />
        </div>

        {/* Export */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Export</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Export Settings</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-right">Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as any)}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-right">Width</Label>
                <Input
                  type="number"
                  value={exportWidth}
                  className="col-span-2"
                  onChange={(e) => setExportWidth(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-right">Height</Label>
                <Input
                  type="number"
                  value={exportHeight}
                  className="col-span-2"
                  onChange={(e) => setExportHeight(Number(e.target.value))}
                />
              </div>
              <Button onClick={exportTimetable}>Download</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timetable grid */}
      <div
        ref={timetableRef}
        className="relative border rounded-lg overflow-hidden w-full"
        style={{
          backgroundColor: themeColor,
          backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
          backgroundSize: "cover",
        }}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}
        >
          {/* header row */}
          <div className="border p-2 font-medium bg-background/50 backdrop-blur">
            Time
          </div>
          {days.map((d) => (
            <div
              key={d.id}
              className="border p-2 font-medium text-center bg-background/50 backdrop-blur"
            >
              {d.label}
            </div>
          ))}
          {/* time rows */}
          {HOURS.map((h) => (
            <React.Fragment key={h}>
              <div
                key={`time-${h}`}
                className="border p-2 text-sm bg-background/30 backdrop-blur"
              >
                {hourToLabel(h)}
              </div>
              {days.map((d) => (
                <div key={`${d.id}-${h}`} className="border h-16 relative" />
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* subjects overlay */}
        {subjects.map((sub) =>
          sub.days.map((day) => {
            const dayIndex = days.findIndex((d) => d.id === day);
            if (dayIndex === -1) return null;
            // Parse start/end time strings ("HH:mm") to hour/minute
            const [startHour, startMin] = sub.start.split(":").map(Number);
            const [endHour, endMin] = sub.end.split(":").map(Number);
            // Calculate row positions
            const rowStart = startHour - 7 + 2 + (startMin ? 0.5 : 0); // 0.5 for :30
            const rowEnd = endHour - 7 + 2 + (endMin ? 0.5 : 0);
            return (
              <div
                key={`${sub.id}-${day}`}
                className="absolute rounded-md text-xs text-white p-1.5 shadow-md"
                style={{
                  backgroundColor: sub.color,
                  gridColumn: dayIndex + 2,
                  gridRowStart: rowStart,
                  gridRowEnd: rowEnd,
                  left: `calc((100% - 80px) / ${days.length} * ${dayIndex})`,
                  top: `calc(64px + ${
                    (startHour - 7 + (startMin ? 0.5 : 0)) * 64
                  }px)`,
                  width: `calc((100% - 80px) / ${days.length})`,
                  height: `${
                    (endHour + endMin / 60 - (startHour + startMin / 60)) * 64 -
                    4
                  }px`,
                }}
              >
                <div className="font-semibold truncate">{sub.code}</div>
                <div className="truncate">{sub.room}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
