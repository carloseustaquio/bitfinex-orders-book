import { useSelector } from 'react-redux';
import './App.css';
import { useOrdersBook } from './hooks/useOrdersBook';

function App() {
  const { subscribe, unsubscribe } = useOrdersBook();
  const ordersBook = useSelector((state) => state.ordersBook.book);
  const startingConnection = useSelector((state) => state.ordersBook.startingConnection);

  const renderRow = (row, index) => (
    <tr key={index}>
      <td>{row.count}</td>
      <td>{parseFloat(row.count * row.amount).toFixed(5)}</td>
      <td>{row.amount}</td>
      <td>{row.price}</td>
    </tr>
  );

  return (
    <div className="App">
      <h1>Order Book <span>BTC/USD</span></h1>
      {startingConnection && <p>Connecting...</p>}
      <button onClick={subscribe}>Connect</button>
      <button onClick={unsubscribe}>Disconnect</button>
      <div className='row'>
        <div className='tableWrapper'>
          <h2>Bids</h2>
          {(ordersBook && ordersBook.bids) ? (
            <table>
              <thead>
                <tr>
                  <th>Count</th>
                  <th>Total</th>
                  <th>Amount</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {ordersBook && ordersBook.bids && Object.values(ordersBook.bids).map(renderRow)}
              </tbody>
            </table>
          ) : <p>Not connected</p>}
        </div>
        <div className='tableWrapper'>
          <h2>Asks</h2>
          {(ordersBook && ordersBook.asks) ? (
            <table>
              <thead>
                <tr>
                  <th>Count</th>
                  <th>Total</th>
                  <th>Amount</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {ordersBook && ordersBook.asks && Object.values(ordersBook.asks).map(renderRow)}
              </tbody>
            </table>
          ) : <p>Not connected</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
