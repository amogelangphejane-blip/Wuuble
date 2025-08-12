"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const getThemeIcon = () => {
    if (theme?.includes("theme-")) {
      return <Palette className="h-[1.2rem] w-[1.2rem]" />
    }
    return (
      <>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Basic Themes</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Palette className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color Schemes</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("theme-ocean")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          Ocean
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-forest")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
          Forest
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-sunset")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
          Sunset
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("theme-purple")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"></div>
          Purple
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}