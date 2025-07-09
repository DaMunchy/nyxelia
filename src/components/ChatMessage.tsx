// components/ChatMessage.tsx
'use client'

import { Message } from '../utils/types'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md ${
          isUser
            ? 'bg-[#dcf8c6] text-[#111b21] rounded-br-none'
            : 'bg-white text-[#111b21] rounded-bl-none'
        }`}
      >
        {msg.image && (
          <div className="mb-2 rounded-lg overflow-hidden max-w-[200px]">
            <Image
              src={`data:${msg.image.mimeType};base64,${msg.image.data}`}
              alt="Uploaded image"
              width={200}
              height={200}
              className="rounded-lg object-contain"
            />
          </div>
        )}

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc list-inside my-2">{children}</ul>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            code: ({ children }) => (
              <code className="bg-gray-200 text-sm rounded px-1 py-0.5">{children}</code>
            ),
          }}
        >
          {msg.text}
        </ReactMarkdown>
      </div>
    </div>
  )
}
