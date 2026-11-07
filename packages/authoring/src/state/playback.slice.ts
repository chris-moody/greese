/** Playback slice — transport state driven by the timeline clock. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PlaybackState } from '../core/types/playback.types.ts'

const initialState: PlaybackState = {
  currentFrame: 0,
  playing: false,
  loop: true,
  speed: 1,
  frameCount: 1,
}

export const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    setCurrentFrame: (state, action: PayloadAction<number>) => {
      state.currentFrame = Math.max(0, Math.floor(action.payload))
    },
    play: (state) => {
      state.playing = true
    },
    pause: (state) => {
      state.playing = false
    },
    setLoop: (state, action: PayloadAction<boolean>) => {
      state.loop = action.payload
    },
    setSpeed: (state, action: PayloadAction<number>) => {
      state.speed = action.payload
    },
    /** Set the base timeline length. */
    setFrameCount: (state, action: PayloadAction<number>) => {
      state.frameCount = Math.max(1, Math.floor(action.payload))
    },
  },
})

export const playbackActions = playbackSlice.actions
export const playbackReducer = playbackSlice.reducer
