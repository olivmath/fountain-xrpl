---
id: seguranca
title: Segurança
sidebar_position: 4
---

# Segurança

Este documento descreve as melhores práticas de segurança ao usar a plataforma Fountain.

## Gerenciamento de Chaves e Tokens

### Chave de Criptografia da Carteira (`WALLET_ENCRYPTION_KEY`)

Esta chave é usada para criptografar as sementes (seeds) das carteiras temporárias.

- **NUNCA** comite esta chave no controle de versão.
- Use um sistema de gerenciamento de segredos (como AWS Secrets Manager, HashiCorp Vault ou Doppler) para injetá-la como uma variável de ambiente em produção.
- Rotacione a chave periodicamente. Lembre-se que ao rotacionar a chave, as sementes criptografadas com a chave antiga precisarão ser re-criptografadas.

### Token JWT

O token JWT é um bearer token. Qualquer pessoa que o possua pode fazer requisições em nome da sua empresa.

- **NUNCA** exponha o token JWT no frontend ou em aplicações cliente.
- Armazene o token de forma segura no backend da sua aplicação.
- Use HTTPS para todas as comunicações com a Fountain API para evitar que o token seja interceptado.

## Webhooks

Os webhooks são usados para notificar sua aplicação sobre eventos importantes.

- **Valide a origem:** Certifique-se de que as requisições de webhook vêm de um endereço IP confiável (os IPs da Fountain API).
- **Use HTTPS:** Seu endpoint de webhook deve usar HTTPS.
- **Assinaturas (Futuro):** Em uma futura versão, os webhooks serão assinados para que você possa verificar criptograficamente que eles foram enviados pela Fountain.

## Boas Práticas Gerais

- **Princípio do Menor Privilégio:** Não use uma conta de administrador para operações do dia-a-dia. Contas de administrador devem ser usadas apenas para tarefas administrativas.
- **Validação de Entrada:** Sempre valide e sanitize qualquer dado que venha de usuários antes de enviá-lo para a Fountain API.
- **Logs:** Monitore os logs da sua aplicação e da Fountain API para detectar atividades suspeitas.
