'use client'

import React, { useEffect, useState, useRef } from 'react'

const systemMessages = [
  'Initializing system...',
  'Loading AI core...',
  'Connecting to consciousness...',
  'Ready.',
]

const userMessage = 'Hi, how are you?'
const aiReply = "I'm good, thank you for asking! ✨ "

const useTypewriter = (text: string, speed = 50) => {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    if (!text) return
    let i = 0
    setDisplayText('')
    const timerId = setInterval(() => {
      if (i < text.length) {
        setDisplayText((prev) => prev + text.charAt(i))
        i++
      } else {
        clearInterval(timerId)
      }
    }, speed)
    return () => clearInterval(timerId)
  }, [text, speed])

  return displayText
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-3 bg-white rounded-xl rounded-bl-none shadow-sm">
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
  </div>
)

const ChatMessage = ({
  sender,
  children,
  isTyping = false,
}: {
  sender: 'user' | 'ai'
  children?: React.ReactNode
  isTyping?: boolean
}) => {
  const isUser = sender === 'user'

  const avatar = (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
        isUser ? 'bg-gray-400' : 'bg-gradient-to-br from-[#a95cff] to-[#6c34e0]'
      }`}
    >
      {isUser ? 'U' : 'N'}
    </div>
  )

  const messageBubble = (
    <div
      className={`text-sm px-4 py-2 shadow-md max-w-[80%] ${
        isUser
          ? 'bg-[#dcf8c6] text-[#111b21] rounded-2xl rounded-br-lg'
          : 'bg-white text-[#111b21] rounded-2xl rounded-bl-lg'
      }`}
    >
      {children}
    </div>
  )

  return (
    <div
      className={`flex items-end gap-3 w-full transition-all duration-500 ease-in-out ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && avatar}
      {isTyping ? <TypingIndicator /> : messageBubble}
      {isUser && avatar}
    </div>
  )
}

const NyxeliaLoader = ({ onFinish = () => {} }: { onFinish?: () => void }) => {
  const [currentSystemMsgIndex, setCurrentSystemMsgIndex] = useState(0)
  const [phase, setPhase] = useState<'system_loading' | 'chat_active' | 'finished'>(
    'system_loading'
  )
  const [showUserMsg, setShowUserMsg] = useState(false)
  const [showAiTyping, setShowAiTyping] = useState(false)
  const [showAiReply, setShowAiReply] = useState(false)

  const hasFinished = useRef(false)
  const typedAiReply = useTypewriter(showAiReply ? aiReply : '', 40)

  useEffect(() => {
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    const run = async () => {
      for (let i = 1; i < systemMessages.length; i++) {
        await delay(1000)
        setCurrentSystemMsgIndex(i)
      }

      await delay(1000)
      setPhase('chat_active')

      await delay(500)
      setShowUserMsg(true)

      await delay(1200)
      setShowAiTyping(true)

      await delay(2500)
      setShowAiTyping(false)
      setShowAiReply(true)

      await delay(aiReply.length * 50 + 1500)
      if (!hasFinished.current) {
        hasFinished.current = true
        onFinish()
        setPhase('finished')
      }
    }

    run()
  }, [onFinish])

  return (
    <div className="flex justify-center items-center h-screen bg-[#f0f2f5] font-sans">
      <div className="w-full max-w-md p-4 space-y-5">
        <div
          className={`transition-all duration-700 ease-in-out ${
            phase === 'chat_active' ? 'opacity-0 max-h-0' : 'opacity-100 max-h-40'
          }`}
        >
          {phase === 'system_loading' && (
            <div className="text-sm text-center text-gray-500 font-mono animate-pulse">
              {systemMessages[currentSystemMsgIndex]}
            </div>
          )}
        </div>

        <div
          className={`space-y-5 transition-opacity duration-500 ease-in-out ${
            phase === 'chat_active' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`transition-all duration-500 ease-out ${
              showUserMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {showUserMsg && <ChatMessage sender="user">{userMessage}</ChatMessage>}
          </div>

          <div
            className={`transition-all duration-500 ease-out ${
              showAiTyping || showAiReply
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            {showAiTyping && <ChatMessage sender="ai" isTyping />}
            {showAiReply && <ChatMessage sender="ai">{typedAiReply}</ChatMessage>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NyxeliaLoader
