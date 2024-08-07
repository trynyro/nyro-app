"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import useHotkey from "@/lib/hooks/use-hotkey"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { IconChevronCompactRight } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"
import React, { useRef, useEffect } from 'react';

export const SIDEBAR_WIDTH = 300

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  useHotkey("s", () => setShowSidebar(prevState => !prevState))

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabValue = searchParams.get("tab") || "chats"

  const { handleSelectDeviceFile } = useSelectFileHandler()

  const [contentType, setContentType] = useState<ContentType>(
    tabValue as ContentType
  )
  const [showSidebar, setShowSidebar] = useState(
    localStorage.getItem("showSidebar") === "true"
  )
  const [isDragging, setIsDragging] = useState(false)

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const files = event.dataTransfer.files
    const file = files[0]

    handleSelectDeviceFile(file)

    setIsDragging(false)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleToggleSidebar = () => {
    setShowSidebar(prevState => !prevState)
    localStorage.setItem("showSidebar", String(!showSidebar))
  }

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = (size: { width: number }) => {
      setWindowWidth(size.width);
    };

    (window as any).electron.ipcRenderer.on('resize', handleResize);
    
    return () => {
      (window as any).electron.ipcRenderer.removeListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex size-full">
      <CommandK />

      <div
        className={cn(
          "duration-200 dark:border-none " + (showSidebar ? "border-r-2" : "")
        )}
        style={{
          // Sidebar
          minWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
          maxWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
          width: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px"
        }}
      >
        {showSidebar && (
          <Tabs
            className="flex h-full"
            value={contentType}
            onValueChange={tabValue => {
              setContentType(tabValue as ContentType)
              router.replace(`${pathname}?tab=${tabValue}`)
            }}
          >
            <SidebarSwitcher onContentTypeChange={setContentType} />

            <Sidebar contentType={contentType} showSidebar={showSidebar} />
          </Tabs>
        )}
      </div>

      {/*FIrst check width of application and if its >= 600 px, then prev logic where if isDragging show drop file here otherwise children*/}
      {/*If width of application is < 600 px, then logic below is good*/}
      {windowWidth >= 600 ? 
      (
        <div
            className="bg-muted/50 relative flex w-screen min-w-[20%] grow flex-col sm:min-w-fit md:min-w-fit lg:min-w-fit"
            onDrop={onFileDrop}
            onDragOver={onDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {(isDragging ? (
              <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
                drop file here
              </div>
            ) : (
              children
            ))}

            <Button
              className={cn(
                "absolute left-[4px] top-[50%] z-10 size-[32px] cursor-pointer"
              )}
              style={{
                // marginLeft: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
                transform: showSidebar ? "rotate(180deg)" : "rotate(0deg)"
              }}
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
            >
              <IconChevronCompactRight size={24} />
            </Button>
          </div>
      ) : (showSidebar ? (
          <>
            <Button
              className={cn(
                "absolute right-[4px] top-[50%] z-10 size-[32px] cursor-pointer"
              )}
              style={{
                // marginLeft: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
                transform: showSidebar ? "rotate(180deg)" : "rotate(0deg)"
              }}
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
            >
              <IconChevronCompactRight size={24} />
            </Button>
          </>
        ) : (
          <div
            className="bg-muted/50 relative flex w-screen min-w-[90%] grow flex-col sm:min-w-fit"
            onDrop={onFileDrop}
            onDragOver={onDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {(isDragging ? (
              <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
                drop file here
              </div>
            ) : (
              children
            ))}

            <Button
              className={cn(
                "absolute left-[4px] top-[50%] z-10 size-[32px] cursor-pointer"
              )}
              style={{
                // marginLeft: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
                transform: showSidebar ? "rotate(180deg)" : "rotate(0deg)"
              }}
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
            >
              <IconChevronCompactRight size={24} />
            </Button>
          </div>
        ))}
    </div>
  )
}
