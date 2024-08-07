'use client'

import React, { ReactNode, useContext } from 'react'
import MenuBar from './menu-bar'
import PeekBar from './peek-bar'
import { NyroContext } from '@/context/context'

interface ChatAppProps {
  children: ReactNode
}

const ChatApp: React.FC<ChatAppProps> = ({ children }) => {
        const {
          appRef,
          otherRef,
          isRetracted,
          isTransparent,
          isPinned,
          handleRetract,
          handleExpand,
          handleTogglePin,
          handleMouseEnter,
          handleMouseMove,
          handleMouseLeave,
          handleMouseDown
        } = useContext(NyroContext);
      
        return (
          <div 
            ref={appRef}
            className={`bg-transparent transition-all duration-300 ease-in-out ${isRetracted ? 'h-[150px] w-[30px] overflow-hidden' : 'h-[445px] w-[255px]'} ${isTransparent ? 'opacity-70' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {isRetracted ? (
              <PeekBar onExpand={handleExpand} />
            ) : (
              <>
                <div
                  ref={otherRef}
                  onMouseDown={handleMouseDown}
                >
                  <MenuBar 
                    onRetract={handleRetract} 
                    isPinned={isPinned}
                    onTogglePin={handleTogglePin}
                  />
                </div>
                {children}
              </>
            )}
            
          </div>
        );
      }
      
      export default ChatApp;