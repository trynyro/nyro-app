import { NyroContext } from "@/context/context"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, ModelProvider } from "@/types"
import { IconAdjustmentsHorizontal } from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { ChatSettingsForm } from "../ui/chat-settings-form"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { supabase } from "@/lib/supabase/browser-client"

interface ChatSettingsProps {}

export const ChatSettings: FC<ChatSettingsProps> = ({}) => {
  useHotkey("i", () => handleClick())

  const {
    profile,
    chatSettings,
    setChatSettings,
    models,
    availableHostedModels,
    availableLocalModels,
    availableOpenRouterModels
  } = useContext(NyroContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (buttonRef.current) {
      buttonRef.current.click()
    }
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!chatSettings) return
  
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("query_count")
        .eq("user_id", profile!.user_id)
        .single();
  
      if (profileError) {
        throw new Error(profileError.message);
      }
  
      if (profileData?.query_count >= 18) {
        setChatSettings({
          ...chatSettings,
          model: "llama3-8b-8192",
          temperature: Math.min(
            chatSettings.temperature,
            CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_TEMPERATURE || 1
          ),
          contextLength: Math.min(
            chatSettings.contextLength,
            CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_CONTEXT_LENGTH || 4096
          )
        })
      } else {
        setChatSettings({
          ...chatSettings,
          temperature: Math.min(
            chatSettings.temperature,
            CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_TEMPERATURE || 1
          ),
          contextLength: Math.min(
            chatSettings.contextLength,
            CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_CONTEXT_LENGTH || 4096
          )
        })
      }
    }
  
    fetchProfileData();
  }, [chatSettings?.model])

  if (!chatSettings) return null

  const allModels = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...availableHostedModels,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ]

  const fullModel = allModels.find(llm => llm.modelId === chatSettings.model)

  return (
    // <Popover>
    //   <PopoverTrigger>
    //     <Button
    //       ref={buttonRef}
    //       className="flex items-center space-x-2"
    //       variant="ghost"
    //     >
    //       <div className="max-w-[120px] truncate text-lg sm:max-w-[300px] lg:max-w-[500px]">
    //         {fullModel?.modelName}
    //         {/* || chatSettings.model} */}
    //       </div>

    //       <IconAdjustmentsHorizontal size={28} />
    //     </Button>
    //   </PopoverTrigger>

    //   <PopoverContent
    //     className="bg-background border-input relative flex max-h-[calc(100vh-60px)] w-[300px] flex-col space-y-4 overflow-auto rounded-lg border-2 p-6 sm:w-[350px] md:w-[400px] lg:w-[500px] dark:border-none"
    //     align="end"
    //   >
    //     <ChatSettingsForm
    //       chatSettings={chatSettings}
    //       onChangeChatSettings={setChatSettings}
    //     />
    //   </PopoverContent>
    // </Popover>
    <>
      <div className="max-w-[120px] truncate text-lg sm:max-w-[300px] lg:max-w-[500px]">
            {chatSettings.model}
            {/* || fullModel?.modelName} */}
          </div>
    </>
  )
}
