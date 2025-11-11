---
id: tecnologias
title: Tecnologias
sidebar_position: 4
---

# Tecnologias

A plataforma Fountain utiliza uma stack moderna e robusta para garantir segurança, escalabilidade e uma ótima experiência para desenvolvedores.

## Stack Técnica

| Categoria | Tecnologia | Propósito |
|---|---|---|
| **Backend** | NestJS (Node.js) | Framework principal da API, garantindo uma arquitetura modular e escalável. |
| **Blockchain** | XRP Ledger | Ledger distribuído para emissão, transação e custódia de stablecoins. |
| **Banco de Dados** | Supabase (PostgreSQL) | Persistência de dados de operações, empresas e configurações. |
| **Frontend (Website)** | Next.js (React) | Framework para a construção da landing page e futuros dashboards. |
| **Documentação** | Docusaurus | Geração de documentação estática, interativa e amigável para desenvolvedores. |
| **SDKs** | TypeScript & Python | Kits de desenvolvimento para facilitar a integração com a API. |

## Características Principais

| Recurso | Descrição |
|---|---|
| **Multi-tenant** | Isolamento total de dados por empresa, garantindo que cada tokenizadora acesse apenas suas próprias informações. |
| **Real-time** | Monitoramento de transações na XRPL via WebSocket, com fallback para polling, garantindo a detecção de depósitos em tempo real. |
| **Automático** | Criação e limpeza automática de carteiras temporárias, simplificando a gestão de colateral. |
| **Seguro** | Criptografia AES-256-GCM para chaves privadas e seeds, garantindo que informações sensíveis nunca sejam expostas. |
| **Escalável** | Arquitetura baseada em micro-serviços e uso de tecnologias escaláveis como Supabase e a própria XRPL. |
| **Auditado** | Logs estruturados com hashes de transações, facilitando a auditoria e o compliance. |
| **Webhooks** | Notificações assíncronas para eventos importantes, com retentativas e garantia de idempotência. |
