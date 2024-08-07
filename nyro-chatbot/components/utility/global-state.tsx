// TODO: Separate into multiple contexts, keeping simple for now

"use client"

import { NyroContext } from "@/context/context"
import { getProfileByUserId } from "@/db/profile"
import { getWorkspaceImageFromStorage } from "@/db/storage/workspace-images"
import { getWorkspacesByUserId } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import {
  fetchHostedModels,
  fetchOllamaModels,
  fetchOpenRouterModels
} from "@/lib/models/fetch-models"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import {
  ChatFile,
  ChatMessage,
  ChatSettings,
  LLM,
  MessageImage,
  OpenRouterLLM,
  WorkspaceImage
} from "@/types"
import { AssistantImage } from "@/types/images/assistant-image"
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { useRouter } from "next/navigation"
import { FC, useEffect, useRef, useState } from "react"

interface GlobalStateProps {
  children: React.ReactNode
}

export const GlobalState: FC<GlobalStateProps> = ({ children }) => {
  const router = useRouter()

  // PROFILE STORE
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null)

  // ITEMS STORE
  const [assistants, setAssistants] = useState<Tables<"assistants">[]>([])
  const [collections, setCollections] = useState<Tables<"collections">[]>([])
  const [chats, setChats] = useState<Tables<"chats">[]>([])
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [folders, setFolders] = useState<Tables<"folders">[]>([])
  const [models, setModels] = useState<Tables<"models">[]>([])
  const [presets, setPresets] = useState<Tables<"presets">[]>([])
  const [prompts, setPrompts] = useState<Tables<"prompts">[]>([])
  const [tools, setTools] = useState<Tables<"tools">[]>([])
  const [workspaces, setWorkspaces] = useState<Tables<"workspaces">[]>([])

  // MODELS STORE
  const [envKeyMap, setEnvKeyMap] = useState<Record<string, VALID_ENV_KEYS>>({})
  const [availableHostedModels, setAvailableHostedModels] = useState<LLM[]>([])
  const [availableLocalModels, setAvailableLocalModels] = useState<LLM[]>([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    OpenRouterLLM[]
  >([])

  // WORKSPACE STORE
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<Tables<"workspaces"> | null>(null)
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([])

  // PRESET STORE
  const [selectedPreset, setSelectedPreset] =
    useState<Tables<"presets"> | null>(null)

  // ASSISTANT STORE
  const [selectedAssistant, setSelectedAssistant] =
    useState<Tables<"assistants"> | null>(null)
  const [assistantImages, setAssistantImages] = useState<AssistantImage[]>([])
  const [openaiAssistants, setOpenaiAssistants] = useState<any[]>([])

  // PASSIVE CHAT STORE
  const [userInput, setUserInput] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    model: "gpt-4-turbo-preview",
    prompt: "You are a helpful AI assistant.",
    temperature: 0.5,
    contextLength: 4000,
    includeProfileContext: true,
    includeWorkspaceInstructions: true,
    embeddingsProvider: "openai"
  })
  const [selectedChat, setSelectedChat] = useState<Tables<"chats"> | null>(null)
  const [chatFileItems, setChatFileItems] = useState<Tables<"file_items">[]>([])

  // ACTIVE CHAT STORE
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  // CHAT INPUT COMMAND STORE
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false)
  const [slashCommand, setSlashCommand] = useState("")
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false)
  const [hashtagCommand, setHashtagCommand] = useState("")
  const [isToolPickerOpen, setIsToolPickerOpen] = useState(false)
  const [toolCommand, setToolCommand] = useState("")
  const [focusPrompt, setFocusPrompt] = useState(false)
  const [focusFile, setFocusFile] = useState(false)
  const [focusTool, setFocusTool] = useState(false)
  const [focusAssistant, setFocusAssistant] = useState(false)
  const [atCommand, setAtCommand] = useState("")
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] = useState(false)

  // ATTACHMENTS STORE
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [chatImages, setChatImages] = useState<MessageImage[]>([])
  const [newMessageFiles, setNewMessageFiles] = useState<ChatFile[]>([])
  const [newMessageImages, setNewMessageImages] = useState<MessageImage[]>([])
  const [showFilesDisplay, setShowFilesDisplay] = useState<boolean>(false)

  // RETIEVAL STORE
  const [useRetrieval, setUseRetrieval] = useState<boolean>(true)
  const [sourceCount, setSourceCount] = useState<number>(4)

  // TOOL STORE
  const [selectedTools, setSelectedTools] = useState<Tables<"tools">[]>([])
  const [toolInUse, setToolInUse] = useState<string>("none")

  // DRAGGING/RETRACTABLE STORE
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMouseInside, setIsMouseInside] = useState(false);
  const [isRetracted, setIsRetracted] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);

  useEffect(() => {
    ;(async () => {
      const profile = await fetchStartingData()

      if (profile) {
        const hostedModelRes = await fetchHostedModels(profile)
        if (!hostedModelRes) return

        setEnvKeyMap(hostedModelRes.envKeyMap)
        setAvailableHostedModels(hostedModelRes.hostedModels)

        if (
          profile["openrouter_api_key"] ||
          hostedModelRes.envKeyMap["openrouter"]
        ) {
          const openRouterModels = await fetchOpenRouterModels()
          if (!openRouterModels) return
          setAvailableOpenRouterModels(openRouterModels)
        }
      }

      if (process.env.NEXT_PUBLIC_OLLAMA_URL) {
        const localModels = await fetchOllamaModels()
        if (!localModels) return
        setAvailableLocalModels(localModels)
      }
    })()
  }, [])

  const fetchStartingData = async () => {
    const session = (await supabase.auth.getSession()).data.session

    if (session) {
      const user = session.user

      const profile = await getProfileByUserId(user.id)
      setProfile(profile)

      if (!profile.has_onboarded) {
        return router.push("/setup")
      }

      const workspaces = await getWorkspacesByUserId(user.id)
      setWorkspaces(workspaces)

      for (const workspace of workspaces) {
        let workspaceImageUrl = ""

        if (workspace.image_path) {
          workspaceImageUrl =
            (await getWorkspaceImageFromStorage(workspace.image_path)) || ""
        }

        if (workspaceImageUrl) {
          const response = await fetch(workspaceImageUrl)
          const blob = await response.blob()
          const base64 = await convertBlobToBase64(blob)

          setWorkspaceImages(prev => [
            ...prev,
            {
              workspaceId: workspace.id,
              path: workspace.image_path,
              base64: base64,
              url: workspaceImageUrl
            }
          ])
        }
      }

      return profile
    }
  }
  
  const appRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLDivElement | null>(null);
  const peerBarRef = useRef<HTMLDivElement>(null);
  const transparencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const startTimers = () => {
    if (isInputFocused || isPinned || isMouseInside) {
      clearTimeout(transparencyTimeoutRef.current!);
      clearTimeout(retractionTimeoutRef.current!);
      setIsTransparent(false);
      return;
    }
  
    clearTimeout(transparencyTimeoutRef.current!);
    clearTimeout(retractionTimeoutRef.current!);
    
    transparencyTimeoutRef.current = setTimeout(() => {
      if (!isInputFocused && !isPinned && !isMouseInside) {
        setIsTransparent(true);
        
        retractionTimeoutRef.current = setTimeout(() => {
          if (!isInputFocused && !isPinned && !isMouseInside && !isRetracted) {
            handleRetract();
          }
        }, 5000);
      }
    }, 5000);
  };

  const resetTimers = () => {
    if (isPinned) return;
  
    setIsTransparent(false);
    clearTimeout(transparencyTimeoutRef.current!);
    clearTimeout(retractionTimeoutRef.current!);
    startTimers();
  };

  const handleRetract = async () => {
    if (isInputFocused || isPinned) return;

    try {
      const result = await (window as any).electron.ipcRenderer.invoke('retract-window');
      if (result) {
        setIsRetracted(true);
        setIsTransparent(false);
      }
    } catch (error) {
      console.error('Error retracting:', error);
    }
  };

  const handleMouseEnter = () => {
    setIsMouseInside(true);
    resetTimers();
  };

  const handleMouseLeave = () => {
    setIsMouseInside(false);
    startTimers();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned) return;

    setIsMouseInside(true);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    resetTimers();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPinned || !isDragging || !isMouseInside) return;
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    (window as any).electron.ipcRenderer.send('windowDrag', { deltaX, deltaY });
    setDragStartPos({ x: e.clientX, y: e.clientY });
    resetTimers();
  };

  const handleTogglePin = () => {
    const newPinState = !isPinned;
    setIsPinned(newPinState);
    (window as any).electron.ipcRenderer.send('toggle-pin', newPinState);

    if (newPinState) {
      clearTimeout(transparencyTimeoutRef.current!);
      clearTimeout(retractionTimeoutRef.current!);
      setIsTransparent(false);
    } else {
      resetTimers();
    }
  };

  useEffect(() => {
    const handlePinStateChanged = (event: Event, pinState: boolean) => {
      setIsPinned(pinState);
      if (pinState) {
        setIsDragging(false);
        setIsTransparent(false);
        clearTimeout(transparencyTimeoutRef.current!);
        clearTimeout(retractionTimeoutRef.current!);
      } else {
        resetTimers();
      }
    };

    (window as any).electron.ipcRenderer.on('pin-state-changed', handlePinStateChanged);

    return () => {
      (window as any).electron.ipcRenderer.removeListener('pin-state-changed', handlePinStateChanged);
    };
  }, []);

  const handleMouseUp = () => {
    setIsMouseInside(false);
    setIsDragging(false);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    resetTimers();
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    startTimers();
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
    document.addEventListener('mouseup', handleMouseUp);
    startTimers();

    if (!isPinned) {
      startTimers();
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
      clearTimeout(transparencyTimeoutRef.current!);
      clearTimeout(retractionTimeoutRef.current!);
    };
  }, [isDragging, dragStartPos, isInputFocused, isPinned, isMouseInside]);

  const handleExpand = async () => {
    if (!isRetracted) return;
  
    try {
        const result = await (window as any).electron.ipcRenderer.invoke('expand-window');
        if (result) {
          setIsRetracted(false);
          resetTimers();
        }
      } catch (error) {
        console.error('Error expanding:', error);
      }
    };
        
    useEffect(() => {
      const handleRetractionStateChanged = (event: boolean, newWidth: BigInteger, newHeight: BigInteger) => {
          if (newWidth && newHeight) {
            appRef.current!.style.width = `${newWidth}px`;
            appRef.current!.style.height = `${newHeight}px`;
          } else {
            appRef.current!.style.width = '255px';
            appRef.current!.style.height = '445px';
          }
          setIsRetracted(event);
        };
      const changeWindowSize = (size: any) => {
          if (appRef.current) {
              appRef.current.style.width = `${size.width - 2}px`;
              appRef.current.style.height = `${size.height - 50}px`;
          }
      };

    (window as any).electron.ipcRenderer.on('retraction-state-changed', handleRetractionStateChanged);
    (window as any).electron.ipcRenderer.on('resize', changeWindowSize);
          
    return () => {
      (window as any).electron.ipcRenderer.removeListener('retraction-state-changed', handleRetractionStateChanged);
      (window as any).electron.ipcRenderer.removeListener('resize', changeWindowSize);
    };
  }, []);

  return (
    <NyroContext.Provider
      value={{
        // PROFILE STORE
        profile,
        setProfile,

        // ITEMS STORE
        assistants,
        setAssistants,
        collections,
        setCollections,
        chats,
        setChats,
        files,
        setFiles,
        folders,
        setFolders,
        models,
        setModels,
        presets,
        setPresets,
        prompts,
        setPrompts,
        tools,
        setTools,
        workspaces,
        setWorkspaces,

        // MODELS STORE
        envKeyMap,
        setEnvKeyMap,
        availableHostedModels,
        setAvailableHostedModels,
        availableLocalModels,
        setAvailableLocalModels,
        availableOpenRouterModels,
        setAvailableOpenRouterModels,

        // WORKSPACE STORE
        selectedWorkspace,
        setSelectedWorkspace,
        workspaceImages,
        setWorkspaceImages,

        // PRESET STORE
        selectedPreset,
        setSelectedPreset,

        // ASSISTANT STORE
        selectedAssistant,
        setSelectedAssistant,
        assistantImages,
        setAssistantImages,
        openaiAssistants,
        setOpenaiAssistants,

        // PASSIVE CHAT STORE
        userInput,
        setUserInput,
        chatMessages,
        setChatMessages,
        chatSettings,
        setChatSettings,
        selectedChat,
        setSelectedChat,
        chatFileItems,
        setChatFileItems,

        // ACTIVE CHAT STORE
        isGenerating,
        setIsGenerating,
        firstTokenReceived,
        setFirstTokenReceived,
        abortController,
        setAbortController,

        // CHAT INPUT COMMAND STORE
        isPromptPickerOpen,
        setIsPromptPickerOpen,
        slashCommand,
        setSlashCommand,
        isFilePickerOpen,
        setIsFilePickerOpen,
        hashtagCommand,
        setHashtagCommand,
        isToolPickerOpen,
        setIsToolPickerOpen,
        toolCommand,
        setToolCommand,
        focusPrompt,
        setFocusPrompt,
        focusFile,
        setFocusFile,
        focusTool,
        setFocusTool,
        focusAssistant,
        setFocusAssistant,
        atCommand,
        setAtCommand,
        isAssistantPickerOpen,
        setIsAssistantPickerOpen,

        // ATTACHMENT STORE
        chatFiles,
        setChatFiles,
        chatImages,
        setChatImages,
        newMessageFiles,
        setNewMessageFiles,
        newMessageImages,
        setNewMessageImages,
        showFilesDisplay,
        setShowFilesDisplay,

        // RETRIEVAL STORE
        useRetrieval,
        setUseRetrieval,
        sourceCount,
        setSourceCount,

        // TOOL STORE
        selectedTools,
        setSelectedTools,
        toolInUse,
        setToolInUse,

        // DRAGGING/RETRACTABLE STORE
        isDragging,
        setIsDragging,
        dragStartPos,
        setDragStartPos,
        appRef,
        otherRef,
        peerBarRef,
        isInputFocused,
        setIsInputFocused,
        isPinned,
        setIsPinned,
        isMouseInside,
        setIsMouseInside,
        transparencyTimeoutRef,
        retractionTimeoutRef,
        isRetracted,
        setIsRetracted,
        isTransparent,
        setIsTransparent,
        handleMouseEnter,
        handleMouseLeave,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleInputFocus,
        handleInputBlur,
        handleTogglePin,
        handleRetract,
        handleExpand,
          
      }}
    >
      {children}
    </NyroContext.Provider>
  )
}
