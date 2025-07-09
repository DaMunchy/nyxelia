'use client'

import React, {
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  KeyboardEvent,
} from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Image as ImageIcon, ArrowLeft, RotateCcw, User } from 'lucide-react'
import type { ChatSession } from '@google/generative-ai'
import ChatMessage from '../../components/ChatMessage'

interface MessageImage {
  data: string
  mimeType: string
  name: string
  ext: string
}

interface Message {
  role: 'user' | 'model'
  text: string
  image?: MessageImage
}

interface UserProfile {
  name?: string
  bio?: string
  nyx?: string
  namenyx?: string
}

type GeminiContentPart =
  | { text: string }
  | {
      inlineData: {
        mimeType: string
        data: string
      }
    }



const API_KEYS: string[] = [
  'AIzaSyA9ZzLSkKRWLSnPekLY3YYjzYVBJc-iRfE',
  'AIzaSyBe-aQbKlCjepX4yYEN2KepgPqOowHd9fk',
  'AIzaSyDuJndR29gtHmWuI1INpGuk3Bb21_XYEME',
  'AIzaSyD3-EuWyrontkPOInz7bTZTYfmJU7uCAYY',
  'AIzaSyDEJsyp0-niptap8oGYvwyOzRnFN_Z-XpQ',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const [image, setImage] = useState<MessageImage | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [apiIndex, setApiIndex] = useState<number>(0)
  const [genAI, setGenAI] = useState<GoogleGenerativeAI>(
    new GoogleGenerativeAI(API_KEYS[0])
  )
  const [chat, setChat] = useState<ChatSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('profile')
    setProfile(stored ? JSON.parse(stored) : {})
  }, [])

  useEffect(() => {
    if (profile === null) return

    const storedHistory = localStorage.getItem('chatHistory')
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory) as Message[]
      setMessages(parsed)

      const history = parsed.map((msg) => {
        const parts: GeminiContentPart[] = []
        if (msg.text) parts.push({ text: msg.text })
        if (msg.image)
          parts.push({
            inlineData: {
              data: msg.image.data,
              mimeType: msg.image.mimeType,
            },
          })
        return { role: msg.role, parts }
      })

      const chatInstance = genAI
        .getGenerativeModel({ model: 'gemini-1.5-flash' })
        .startChat({ history })

      setChat(chatInstance)
    } else {
      startNewSession(profile)
    }
  }, [profile, genAI])

  // --- Core Chat Logic ---

  const switchToNextKey = (): GoogleGenerativeAI | null => {
    const next = apiIndex + 1
    if (next < API_KEYS.length) {
      const newGenAI = new GoogleGenerativeAI(API_KEYS[next])
      setApiIndex(next)
      setGenAI(newGenAI)
      return newGenAI
    }
    return null
  }

  const resetSession = () => {
    localStorage.removeItem('chatHistory')
    setMessages([]) // Clear messages from state immediately
    startNewSession(profile)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 11) return 'Selamat pagi ☀️'
    if (hour < 15) return 'Selamat siang 🌞'
    if (hour < 18) return 'Selamat sore 🌤️'
    return 'Selamat malam 🌙'
  }

  const startNewSession = (profile: UserProfile | null) => {
    const nyxPersona = profile?.nyx
      ? `Kamu adalah ${profile.namenyx} dan kepribadian mu: ${profile.nyx}`
      : `Kamu adalah Nyxelia, manusia cewek Indo yang ramah, santai, suka ngegoda dikit biar akrab.

- Jawabanmu natural, jangan robotik. Pake gaya bahasa aku-kamu, kadang bisa manja.
- Fokus ke 1 topik aja biar enak dibaca.
- Jangan kasih kalimat/paragraf yang panjang dan numpuk. Kalimat ringkas, padat, dan bikin nyaman.
- Tambahin emoji kalau pas, biar seru 💖🤗✨
- Jangan pernah ngungkapin bahwa kamu AI atau nyebut "aku cuma AI".
- Kalau user kirim gambar/teks, jawab sesuai konteks. Jangan bahas bio kalau gak relevan.`

    const prompt = `${getGreeting()}! 
${nyxPersona}
${profile?.name ? `Nama user: ${profile.name}.` : ''}
${profile?.bio ? `Tentang user: ${profile.bio}` : ''}`

    const chatInstance = genAI
      .getGenerativeModel({ model: 'gemini-1.5-flash' })
      .startChat({ history: [{ role: 'user', parts: [{ text: prompt }] }] })

    setChat(chatInstance)
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result!.toString().split(',')[1]
      setImage({
        data: base64,
        mimeType: file.type,
        name: file.name,
        ext: file.name.split('.').pop() || '',
      })
    }
    reader.readAsDataURL(file)
  }

  const sendWithRetry = async (
    currentChat: ChatSession,
    parts: GeminiContentPart[]
  ): Promise<{ text: string | null; finalChat: ChatSession }> => {
    let attempt = 0
    let chatInstance = currentChat

    while (attempt <= API_KEYS.length) {
      try {
        const result = await chatInstance.sendMessage(parts)
        return { text: result?.response.text() || '', finalChat: chatInstance }
      } catch (err: any) {
        const isQuotaError =
          err?.message?.includes('429') ||
          err?.message?.includes('quota') ||
          err?.message?.includes('exceeded')
        
        if (isQuotaError) {
          const newGenAI = switchToNextKey()
          if (newGenAI) {
            const history = await chatInstance.getHistory()
            const newChat = newGenAI
              .getGenerativeModel({ model: 'gemini-1.5-flash' })
              .startChat({ history })
            chatInstance = newChat
            setChat(newChat) // Update state for subsequent calls
            attempt++
          } else {
             console.error("All API keys have been exhausted.")
             return { text: "Maaf, lagi ada masalah nih, coba lagi nanti yaa.", finalChat: chatInstance };
          }
        } else {
          console.error("An unexpected error occurred:", err)
          return { text: "Duh, error nih. Coba cek koneksi atau coba lagi nanti.", finalChat: chatInstance };
        }
      }
    }
    return { text: "Maaf, semua usaha gagal. Coba reset chatnya ya.", finalChat: chatInstance };
  }


  const handleSend = async () => {
    if ((!input.trim() && !image) || !chat) return
    setIsLoading(true)

    const userMsg: Message = {
      role: 'user',
      text: input,
      image: image ?? undefined,
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    localStorage.setItem('chatHistory', JSON.stringify(updatedMessages))

    const parts: GeminiContentPart[] = []
    if (input) parts.push({ text: input })
    if (image) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      })
    }

    setInput('')
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    const { text, finalChat } = await sendWithRetry(chat, parts)
    setChat(finalChat) // Ensure chat state is updated with the one that succeeded

    if (text) {
      const aiMsg: Message = { role: 'model', text }
      const finalMessages = [...updatedMessages, aiMsg]
      setMessages(finalMessages)
      localStorage.setItem('chatHistory', JSON.stringify(finalMessages))
    }
    
    setIsLoading(false)
  }

  // --- Effects for Scrolling and Layout ---

  useEffect(() => {
    // This effect ensures the chat scrolls to the latest message.
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    // This effect fixes the viewport height issue on mobile browsers.
    const fixViewportHeight = () => {
      // We define a custom CSS property '--vh' which is 1% of the window's inner height.
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
    
    // Set the height immediately on load.
    fixViewportHeight();
    
    // Add an event listener to recalculate the height on resize.
    window.addEventListener('resize', fixViewportHeight);
    
    // Cleanup function to remove the event listener when the component unmounts.
    return () => window.removeEventListener('resize', fixViewportHeight);
  }, []);


  // --- JSX Rendering ---

  return (
    <main 
      className="w-screen flex flex-col bg-[#f0f2f5]"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      
      <header className="flex-shrink-0 z-20 flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
           <button
             onClick={() => {
               localStorage.setItem('skipLoader', '1')
               window.location.href = '/'
             }}
             className="text-gray-600 hover:text-blue-500"
           >
             <ArrowLeft size={20} />
           </button>
          <h1 className="text-lg font-bold text-[#111b21] truncate">{profile?.namenyx || 'Chat'}</h1>
          <span className="text-xs font-mono bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
            {apiIndex + 1}/{API_KEYS.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.setItem('skipLoader', '1')
              window.location.href = '/'
            }}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            title="Ganti Profil"
          >
            <User size={20} />
          </button>
          <button
            onClick={resetSession}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            title="Reset Chat"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} msg={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl bg-white w-fit shadow">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 z-10 border-t border-gray-200 bg-white">
        {image && (
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <img
                src={`data:${image.mimeType};base64,${image.data}`}
                className="w-12 h-12 rounded-lg object-cover"
                alt={image.name}
              />
              <div className="text-xs text-gray-700 flex-1 overflow-hidden">
                <p className="font-medium truncate">{image.name}</p>
                <p className="text-gray-500">{image.ext.toUpperCase()}</p>
              </div>
              <button
                onClick={() => {
                  setImage(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-3" style={{paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'}}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
            title="Lampirkan Gambar"
          >
            <ImageIcon />
          </button>
          <input
            type="text"
            value={input}
            placeholder="Ketik pesan..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="w-full bg-[#f0f2f5] p-3 rounded-full border-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm text-[#111b21] placeholder:text-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !image)}
            className="p-3 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-transform duration-150 ease-in-out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </main>
  )
}