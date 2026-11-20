import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import '../src/index.css';
import { AppThemeProvider, ToastProvider } from '../src/ui';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'todo' },
  },
  globalTypes: {
    theme: {
      description: 'Tema do FiscoTrack',
      toolbar: {
        title: 'Tema',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Escuro' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', mode);
      return (
        <AppThemeProvider mode={mode}>
          <MemoryRouter>
            <ToastProvider>
              <Story />
            </ToastProvider>
          </MemoryRouter>
        </AppThemeProvider>
      );
    },
  ],
};

export default preview;
