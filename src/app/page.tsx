'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {ToastType, useSimpleToast} from "@/component/toast";
import {AVATAR_OPTIONS, DEFAULT_AVATAR_INDEX, getAvatarByIndex} from "@/constants/avatars";

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(DEFAULT_AVATAR_INDEX);
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const router = useRouter();
  const invitedRoomId = useSearchParams().get('roomId');
  const { showToast, ToastContainer } = useSimpleToast();

  const handleJoinRoom = () => {
    if (!nickname.trim() || !roomId.trim()) {
      alert('Please enter both nickname and room ID');
      return;
    }

    setIsLoading(true);
    // Navigate to game room with query parameters
    router.push(`/room/${roomId}?nickname=${encodeURIComponent(nickname.trim())}&avatar=${selectedAvatarIndex}`);
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  const copyLinkToClipboard = () => {
    const link = `${window.location.origin}/?roomId=${roomId}`;
    if (!roomId) {
      showToast('Please enter room ID first!', ToastType.Error);
      return;
    }
    navigator.clipboard.writeText(link).then(() => {
      showToast('Link copied to clipboard!', ToastType.Success);
    }).catch((err) => {
      console.error('Could not copy text: ', err);
      showToast('Could not copy link to clipboard!', ToastType.Error);
    })
  }

  useEffect(() => {
    if (invitedRoomId) {
      setRoomId(invitedRoomId);
    }
  },[]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Guess Who?</h1>
          <p className="text-gray-600">Play the classic guessing game online!</p>
        </div>

        <div className="space-y-6">
          <div>
            <button
              onClick={() => setShowAvatarDialog(true)}
              className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl border-2 border-blue-200 hover:border-blue-400 transition-colors mx-auto"
            >
              {getAvatarByIndex(selectedAvatarIndex)}
            </button>
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Your Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <div className="flex gap-2">
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room ID"
                className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors
                ${invitedRoomId !== null ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                maxLength={6}
                disabled={invitedRoomId !== null }
              />
              <button
                onClick={generateRoomId}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                title="Generate random room ID"
              >
                🎲
              </button>
            </div>
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isLoading || !nickname.trim() || !roomId.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {isLoading ? 'Joining...' : 'Join Game'}
          </button>
        </div>

        <div className="mt-8 text-center text-blue-500 hover:underline cursor-pointer" onClick={copyLinkToClipboard}>
          <p>Share the room link with your friend</p>
        </div>
      </div>

      <ToastContainer />

      {/* Avatar Selection Dialog */}
      {showAvatarDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Choose Your Avatar</h2>
            </div>

            <div className="grid grid-cols-6 gap-3 mb-6">
              {AVATAR_OPTIONS.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAvatarIndex(index);
                    setShowAvatarDialog(false);
                  }}
                  className={`w-12 h-12 text-2xl rounded-full transition-all ${
                    selectedAvatarIndex === index
                      ? 'bg-blue-500 text-white scale-110'
                      : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}