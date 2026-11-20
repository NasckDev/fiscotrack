import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      '**/dist-portable',
      '**/coverage',
      '**/node_modules',
      '**/playwright-report',
      '**/storybook-static',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Padrão de UI: antd, ícones e ECharts só entram pela camada apps/web/src/ui.
    files: ['apps/web/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/ui/**', 'apps/web/.storybook/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'antd',
                'antd/*',
                '@ant-design/*',
                'echarts',
                'echarts/*',
                'echarts-for-react',
                'echarts-for-react/*',
              ],
              message:
                'Use os wrappers de apps/web/src/ui (AppButton, AppTable, AppChart...). antd e echarts só entram dentro de src/ui.',
            },
          ],
        },
      ],
    },
  },
);
