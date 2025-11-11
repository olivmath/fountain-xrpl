---
id: webhooks
title: Webhooks
sidebar_position: 3
---

# Webhooks

A Fountain API usa webhooks para notificar sua aplicação sobre eventos importantes de forma assíncrona.

## Como Funciona

Quando um evento ocorre (por exemplo, a conclusão de um mint), a Fountain API envia uma requisição `POST` para a `webhookUrl` que você especificou ao criar a operação.

O corpo da requisição contém um payload JSON com informações sobre o evento.

## Payload Padrão

```json
{
  "event": "mint.stablecoin.completed",
  "data": {
    "operationId": "8c430b52-5f6f-4ea5-9cd2-6a28adf0b3d5",
    "stablecoinId": "e25d9f4a-7b7f-4f9b-ab06-70d4220eaec1",
    "status": "completed",
    "totalDeposited": 2476.190476
  },
  "timestamp": "2024-11-11T12:42:00.000Z"
}
```

| Campo | Descrição |
|---|---|
| `event` | O tipo de evento que ocorreu. |
| `data` | Um objeto contendo dados relevantes para o evento. |
| `timestamp` | A data e hora em que o evento ocorreu. |

## Tipos de Evento

| Evento | Descrição |
|---|---|
| `mint.stablecoin.completed` | O mint de uma stablecoin foi concluído com sucesso. |
| `burn.stablecoin.completed` | O burn de uma stablecoin foi concluído com sucesso. |
| `deposit.confirmed` | O depósito de colateral foi confirmado. |

## Boas Práticas

- **Responda Rapidamente:** Seu endpoint de webhook deve responder com um código de status `2xx` o mais rápido possível. Processamentos demorados devem ser feitos de forma assíncrona.
- **Idempotência:** Seu endpoint deve ser capaz de lidar com webhooks duplicados. A Fountain pode reenviar um webhook se não receber uma resposta `2xx`.
- **Segurança:** Use HTTPS para seu endpoint de webhook e valide a origem da requisição.
