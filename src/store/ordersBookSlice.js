import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	book: {
		bids: {},
		asks: {},
		priceSnapshot: {},
		messageCount: 0,
	},
	startingConnection: false,
}

export const ordersBookSlice = createSlice({
	name: 'ordersBook',
	initialState,
	reducers: {
		setBook: (state, action) => {
			state.book = action.payload
		},
		setStartingConnection: (state, action) => {
			state.startingConnection = action.payload
		}
	},
})

// Action creators are generated for each case reducer function
export const { setBook, setStartingConnection } = ordersBookSlice.actions

export default ordersBookSlice.reducer