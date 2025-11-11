---
sidebar_position: 1
---

# Fountain Visão Geral

Fountain é uma Stablecoin Factory API construída sobre a XRP Ledger (XRPL) para automatizar a emissão de stablecoins lastreadas em reais e destravar a tokenização de ativos reais (RWAs) no Brasil.

## O Desafio Atual

Até 2030, o mercado global de tokenização de RWAs deve ultrapassar US$ 16 trilhões. Apesar do potencial, o dia a dia continua travado por:

- Processos manuais e caros de KYC/AML e compliance regulatório
- Falta de automação na criação e gestão de stablecoins corporativas
- Integração limitada entre infraestrutura Web3, bancos e gateways de pagamento
- Riscos operacionais e legais que escalam a cada novo cliente

### Como o mercado funciona hoje

1. Um investidor pessoa física, como o Afonso, quer comprar R$ 10.000 em tokens imobiliários.
2. A construtora `America Park Building (APB)` lança um prédio de R$ 3,6 milhões dividido em frações de R$ 10.000.
3. Para tokenizar o ativo, a APB contrata uma tokenizadora, por exemplo a `Sonica`, responsável por criar a infraestrutura Web3 e os RWAs.
4. A tokenizadora emite os tokens, mas precisa gerenciar depósitos, retiradas e lastro de forma manual via sistemas Web2.

Esse fluxo se repete para cada novo cliente corporativo, exige conciliação constante com stablecoins em dólar e demanda consultas de preço contínuas.

## A Proposta Fountain

Fountain automatiza a emissão e o gerenciamento de stablecoins em real (BRL) para tokenizadoras e emissoras de RWAs.

- **API única:** cria stablecoins em minutos, com mint/burn programáticos.
- **Custódia e escrow on-chain:** recebemos valores via PIX, XRP ou RLUSD e realizamos o escrow na XRPL.
- **Entrega automática:** os tokens são depositados diretamente na carteira da tokenizadora, com trilha auditável na XRPL.
- **Compliance reduzido:** KYC, AML e monitoramento são centralizados, liberando as tokenizadoras para focarem na originação de ativos.

### Exemplo de fluxo com Fountain

1. A APB tokeniza um novo imóvel em Pinheiros (São Paulo).
2. Os investidores enviam depósitos para comprar os tokens RWA.
3. A tokenizadora `Sonica` invoca a Fountain para criar a stablecoin lastreada em BRL da APB.
4. Fountain recebe os valores (PIX/XRP/RLUSD), realiza o escrow na XRPL e cria a stablecoin correspondente.
5. A stablecoin é creditada automaticamente na carteira da Sonica, pronta para distribuição aos investidores.
6. Todo o processo permanece auditável, seguro e sem burocracia.

## Modelo de Negócios

- **Fees por transação:** 0,1% a 0,5% em operações de mint e burn, alinhando receita com o volume processado.
- **SaaS recorrente:** planos mensais para dashboards, analytics e suporte premium.

## Roadmap

- **V1 – Hoje:** piloto com 1 tokenizadora processando R$ 4M de MRR, com fluxos ativos de mint, burn e gestão de colateral em XRP.
- **V2 – 2 meses:** integrações adicionais com exchanges e gateways PIX, suporte completo a RLUSD e PIX.
- **V3 – 6 meses:** expansão para +5 tokenizadoras, totalizando R$ 20M de MRR sob gestão.

## Time

- **Lucas Oliveira:** Matemático, Engenheiro Sênior de Blockchain com mais de 5 anos de experiência e dois pilotos do DREX entregues para grandes players.
- **João Bellu:** Cientista da Computação com atuação em desenvolvimento full stack e automação de infraestrutura Web3.

## O que buscamos

- Parcerias estratégicas com a Ripple e líderes do mercado brasileiro de tokenização.
- Investimento/Grant para acelerar os marcos:
  - US$ 25.000 para entregar a V2
  - US$ 50.000 para entregar a V3
  - US$ 100.000 para escalar a operação e adquirir novos clientes

Fountain elimina a complexidade operacional da tokenização de RWAs no Brasil, com estabilidade em real, automação de ponta a ponta e governança on-chain confiável.
