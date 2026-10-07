import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'App-Recibos',
  description: 'Documentação Oficial do Sistema de Gestão Financeira e Emissão de Recibos Civis',
  base: '/App-Recibos/',
  lang: 'pt-BR',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    logo: '📜',
    siteTitle: 'App-Recibos',

    nav: [
      { text: 'Início', link: '/' },
      { text: 'Guia do Sistema', link: '/guia/introducao' },
      { text: 'Arquitetura', link: '/guia/arquitetura' },
      { text: 'API REST', link: '/guia/api-rest' },
    ],

    sidebar: {
      '/guia/': [
        {
          text: 'Visão Geral & Começando',
          items: [
            { text: 'Introdução ao Sistema', link: '/guia/introducao' },
            { text: 'Arquitetura Híbrida', link: '/guia/arquitetura' },
            { text: 'Diretrizes de Segurança Turbo', link: '/guia/seguranca-turbo' },
          ],
        },
        {
          text: 'Engenharia de Dados & Excel',
          items: [
            { text: 'Estrutura da Planilha Excel', link: '/guia/planilha-excel' },
            { text: 'Normatização BACEN STR', link: '/guia/padrao-bacen' },
          ],
        },
        {
          text: 'Documentos & Integração',
          items: [
            { text: 'Recibos Civis Oficiais (.docm)', link: '/guia/recibos-civis' },
            { text: 'Referência da API REST (.NET 9)', link: '/guia/api-rest' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AlissonVMS/App-Recibos' },
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Buscar na documentação' },
              modal: { noResultsText: 'Nenhum resultado encontrado' },
            },
          },
        },
      },
    },

    footer: {
      message: 'Sistema de Gestão Financeira e Cessão Hereditária',
      copyright: 'Copyright © 2026 AlissonVMS. Todos os direitos reservados.',
    },

    docFooter: {
      prev: 'Página anterior',
      next: 'Próxima página',
    },
  },
});
