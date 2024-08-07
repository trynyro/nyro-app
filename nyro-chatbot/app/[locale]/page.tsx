"use client"

import { NyroSVG } from "@/components/icons/nyro-svg"
import { IconArrowRight } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function HomePage() {
  const { theme } = useTheme()

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <div >
        <NyroSVG theme={theme === "dark" ? "dark" : "light"} scale={1} />
      </div>

      {/* <div className="mt-2 text-4xl font-bold">Nyro</div> */}

      <Link
        className="mt-4 flex w-[200px] items-center justify-center rounded-md bg-blue-500 p-2 font-semibold"
        href="/login"
      >
        Start Chatting
        <IconArrowRight className="ml-1" size={20} />
      </Link>
    </div>
  )
}
