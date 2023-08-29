import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import _ from 'lodash'
import { useDispatch } from "react-redux";
import { setBook, setStartingConnection } from "../store/ordersBookSlice";

const WS_URL = 'wss://api-pub.bitfinex.com/ws/2';
const BOOK_INITIAL_STATE = {
	bids: {},
	asks: {},
	priceSnapshot: {},
	messageCount: 0,
};

export function useOrdersBook() {
	const sequenceRef = useRef(null);
	const bookRef = useRef(BOOK_INITIAL_STATE);
	const [channelId, setChannelId] = useState();
	const dispatch = useDispatch();

	const { readyState, sendJsonMessage, lastMessage } = useWebSocket(WS_URL, {
		onOpen: () => {
			console.log('WS open')
		},
		shouldReconnect: () => true,
	});

	const setupOrdersBook = useCallback((msg) => {
		if (msg.event) return

		// Syncing sequence
		if (msg[1] === 'hb') {
			sequenceRef.current = +msg[2]
			return
		} else if (msg[1] === 'cs') {
			sequenceRef.current = +msg[3]
			return
		}

		if (bookRef.current.messageCount === 0) {
			_.each(msg[1], function (pp) {
				pp = { price: pp[0], count: pp[1], amount: pp[2] }
				let side = pp.amount >= 0 ? 'bids' : 'asks'
				pp.amount = Math.abs(pp.amount)
				bookRef.current[side][pp.price] = pp
			})
			console.log('BOOK snapshot cached');
		} else {
			let cseq = +msg[2]
			msg = msg[1]

			if (!sequenceRef.current) {
				sequenceRef.current = cseq - 1
			}

			if (cseq - sequenceRef.current !== 1) {
				console.error('OUT OF SEQUENCE', sequenceRef.current, cseq)
				return;
			}

			sequenceRef.current = cseq

			let pp = { price: msg[0], count: msg[1], amount: msg[2] }

			if (!pp.count) {
				let found = true

				if (pp.amount > 0) {
					if (bookRef.current['bids'][pp.price]) {
						delete bookRef.current['bids'][pp.price]
					} else {
						found = false
					}
				} else if (pp.amount < 0) {
					if (bookRef.current['asks'][pp.price]) {
						delete bookRef.current['asks'][pp.price]
					} else {
						found = false
					}
				}

				if (!found) {
					console.error('BOOK delete fail side not found');
				}
			} else {
				let side = pp.amount >= 0 ? 'bids' : 'asks'
				pp.amount = Math.abs(pp.amount)
				bookRef.current[side][pp.price] = pp
			}
		}

		_.each(['bids', 'asks'], function (side) {
			let sbook = bookRef.current[side]
			let bprices = Object.keys(sbook)

			let prices = bprices.sort(function (a, b) {
				if (side === 'bids') {
					return +a >= +b ? -1 : 1
				} else {
					return +a <= +b ? -1 : 1
				}
			})

			bookRef.current.priceSnapshot[side] = prices
		})

		bookRef.current.messageCount++;
		dispatch(setBook(_.cloneDeep(bookRef.current))); // cloning to avoid redux freeze this object
	}, [dispatch]);

	useEffect(() => {
		if (!lastMessage) return;
		const data = JSON.parse(lastMessage.data);

		if (data.event === 'subscribed') {
			console.log(data);
			setChannelId({
				channelId: data.chanId,
				channel: data.channel,
			})
			dispatch(setStartingConnection(false))
			return;
		}

		if (data.event === 'unsubscribed') {
			console.log(data);
			dispatch(setBook());
			bookRef.current = BOOK_INITIAL_STATE;
			sequenceRef.current = null;
			return;
		}

		setupOrdersBook(data)
	}, [dispatch, lastMessage, setupOrdersBook]);

	const subscribe = () => {
		dispatch(setStartingConnection(true))
		sendJsonMessage({
			event: 'conf', flags: 65536 + 131072
		})
		sendJsonMessage({
			event: 'subscribe',
			channel: 'book',
			symbol: "BTCUSD",
			prec: 'P0',
			freq: 'F0',
			len: 25,
		});
	}

	const unsubscribe = () => {
		if (!channelId) return;

		const unSubMsg = {
			event: 'unsubscribe',
			chanId: channelId.channelId,
		};
		sendJsonMessage(unSubMsg)
	}

	useEffect(() => {
		if (readyState === 0) {
			dispatch(setStartingConnection(true))
		} else {
			dispatch(setStartingConnection(false))
		}
	}, [readyState, dispatch]);

	return {
		subscribe,
		unsubscribe,
	}
}