import { configureStore } from '@reduxjs/toolkit'
import ordersBookReducer from './ordersBookSlice'

export const store = configureStore({
	reducer: {
		ordersBook: ordersBookReducer,
	},
})