import ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import './index.css';
// Sentry must be initialised before the React tree renders
import './sentry';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StyledEngineProvider injectFirst>
    <App />
  </StyledEngineProvider>
);
