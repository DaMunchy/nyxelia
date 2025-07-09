'use client'

import React, { useEffect, useState } from 'react'
import NyxeliaLoader from '../components/NyxeliaLoader'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [namenyx, setNameNyx] = useState('')
  const [nyx, setNyx] = useState('')

  useEffect(() => {
  const skip = localStorage.getItem('skipLoader') === '1'
  if (skip) {
    setLoading(false)
    localStorage.removeItem('skipLoader')
  }

  const stored = localStorage.getItem('profile')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      setName(parsed.name || '')
      setBio(parsed.bio || '')
      setNyx(parsed.nyx || '')
      setNameNyx(parsed.namenyx || '')
    } catch (e) {
      console.error('Profile rusak:', e)
    }
  }
}, [])


  const handleStart = () => {
    const profile = { name, bio, nyx, namenyx }
    localStorage.setItem('profile', JSON.stringify(profile))
    window.location.href = '/chat'
  }

  const plc = namenyx ? namenyx : "Nyxelia"
  const bioser = name ? 'About ' + name : "About you"

  if (loading) return <NyxeliaLoader onFinish={() => setLoading(false)} />

  return (
    <main className="w-screen h-screen bg-[#f0f2f5] text-[#111b21] font-poppins flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{namenyx ? namenyx : "Nyxelia"} </h1>
          <p className="text-gray-600 text-sm mt-2">
            (Optional) Let {namenyx ? namenyx : "Nyxelia"} get to know you better 
          </p>
        </div>

        <div className="space-y-4">
          <h1 className="text-1xl font-bold">{name ? name : "Your name"}</h1>
          <input
            className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#a95cff] focus:border-transparent outline-none transition placeholder:text-gray-500"
            placeholder={"What should " + plc + " call you?"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <h1 className="text-1xl font-bold">{name ? name + "'s Personality" : "Your personality"}</h1>
          <textarea
            className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#a95cff] focus:border-transparent outline-none transition placeholder:text-gray-500"
            placeholder={bioser}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <h1 className="text-1xl font-bold">AI Name</h1>
          <input
            className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#a95cff] focus:border-transparent outline-none transition placeholder:text-gray-500"
            placeholder="Nyxelia"
            value={namenyx}
            onChange={(e) => setNameNyx(e.target.value)}
          />
          <h1 className="text-1xl font-bold">Personality</h1>
          <textarea
            className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#a95cff] focus:border-transparent outline-none transition placeholder:text-gray-500"
            placeholder={'About ' + namenyx}
            rows={3}
            value={nyx}
            onChange={(e) => setNyx(e.target.value)}
          />
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-[#a95cff] text-white py-3 px-4 rounded-lg hover:bg-[#934de6] transition-colors font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a95cff]"
        >
          {name ? `Continue` : `Start`}
        </button>
      </div>
    </main>
  )
}
