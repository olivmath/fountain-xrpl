import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: '📦 Produto',
      items: [
        'product/o-que-e-fountain',
        'product/arquitetura',
        'product/fluxos-principais',
        'product/tecnologias',
      ],
    },
    {
      type: 'category',
      label: '🔌 Backend API',
      items: [
        'backend/visao-geral',
        'backend/autenticacao',
        'backend/stablecoins',
        'backend/operacoes',
        'backend/admin',
        'backend/infraestrutura',
      ],
    },
    {
      type: 'category',
      label: '🛠️ SDKs',
      items: [
        'sdks/visao-geral',
        'sdks/typescript',
        'sdks/python',
      ],
    },
    {
      type: 'category',
      label: '📚 Guias',
      items: [
        'guides/quickstart',
        'guides/deploying',
        'guides/troubleshooting',
        'guides/seguranca',
      ],
    },
    {
      type: 'category',
      label: '📖 Referência',
      items: [
        'reference/diagramas',
        'reference/status-codes',
        'reference/webhooks',
        'reference/glossario',
      ],
    },
  ],
};

export default sidebars;
