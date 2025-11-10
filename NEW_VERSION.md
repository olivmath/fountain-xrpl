# Documento Técnico: Serviço de Emissão de Stablecoins para Tokenizadoras na XRPL

## Resumo Executivo

Este projeto desenvolve um serviço backend B2B especializado na emissão e gerenciamento de stablecoins personalizadas na XRP Ledger (XRPL), projetado para empresas tokenizadoras de ativos reais (como imóveis, florestas ou bens digitais). O objetivo principal é abstrair complexidades regulatórias, como processos de KYC (Know Your Customer) e AML (Anti-Money Laundering), permitindo que tokenizadoras criem stablecoins lastreadas em reais (BRL) ou equivalentes para seus clientes empresariais (ex.: construtoras ou emissoras de tokens de ativos). O serviço opera exclusivamente com empresas, sem interação direta com usuários finais (pessoas físicas). Utilizando a XRPL para eficiência e baixo custo, o sistema suporta depósitos iniciais via Pix (fiat) ou on-chain (XRP/RLUSD), com minting e burning de tokens fungíveis via Issued Currencies. Isso facilita a tokenização de ativos, garantindo liquidez inicial e conformidade, enquanto o backend gerencia colateral, webhooks e integrações com provedores como Asas (para Pix) e Binance (para conversões).

## Sugestões de Monetização

Com base na estrutura B2B do produto, aqui vão três estratégias viáveis para monetização, considerando o foco em tokenizadoras e o volume de transações na XRPL:

1. **Taxas por Transação**: Cobrar uma taxa percentual (ex.: 0.1-0.5%) sobre o valor de cada mint ou burn de stablecoin. Isso escala com o uso, incentivando volumes maiores, e pode ser integrado diretamente nas APIs, com descontos para clientes de alto volume.

2. **Modelo de Assinatura SaaS**: Oferecer planos mensais/anuais (ex.: básico para até 10 stablecoins, premium para ilimitado com suporte prioritário e relatórios AML customizados). Isso garante receita recorrente, especialmente para tokenizadoras com operações contínuas, e inclui features como dashboards de auditoria on-chain.

3. **Parcerias e Comissões por Referência**: Estabelecer acordos com exchanges ou provedores de tokenização, onde o serviço recebe comissões por indicações ou integrações exclusivas. Por exemplo, uma parceria com a Ripple para uso preferencial de RLUSD poderia incluir revenue sharing em transações cross-chain.

## Fluxo de Criação da Stablecoin (Mint)

Esta seção descreve o processo de minting de uma stablecoin personalizada (ex.: APBRL para "America Park BRL"), lastreada 1:1 em colateral. O cliente (tokenizadora, ex.: Sônica) autentica via JWT (gerado manualmente após contrato B2B) e envia uma requisição API com parâmetros: valor (ex.: R$1.000.000), modo (Pix ou on-chain), webhook de notificação, carteira XRPL de destino, nome do cliente final (para código do token) e dados para KYC/AML (abstraídos pelo serviço). O mint usa Issued Currencies na XRPL, com clawback ativado para recuperação parcial. O colateral é gerenciado via trust lines, garantindo auditoria on-chain.

### Fluxo via Pix

1. **Requisição Inicial**: Tokenizadora envia API POST para /create-stablecoin com parâmetros acima. Backend valida JWT, armazena dados no banco (incluindo webhook) e confirma KYC/AML internamente.

2. **Geração de QR Code Pix**: Backend chama API do provedor Asas para criar depósito Pix no valor exato. Retorna QR Code e detalhes à tokenizadora via resposta API.

3. **Confirmação de Depósito**: Ao receber webhook do Asas confirmando o Pix, backend registra o recebimento.

4. **Conversão para XRP**: Backend integra com API da Binance para comprar XRP equivalente (considerando taxas e volatilidade). Transfere XRP para wallet admin do issuer.

5. **Minting na XRPL**: Na wallet issuer, ativa clawback se necessário. Emite o token via Payment transaction com currency code customizado (ex.: APBRL), mintando o amount proporcional. Estabelece trust line com a carteira da tokenizadora.

6. **Transferência e Notificação**: Transfere o token mintado para a carteira XRPL informada. Dispara webhook da tokenizadora com status "completo" e detalhes da transação.

Timeout: Se Pix não cair em 10 minutos, cancela operação, remove do banco e notifica via webhook.

### Fluxo via On-Chain (XRP ou RLUSD)

1. **Requisição Inicial**: Similar ao Pix, mas modo "on-chain". Backend gera uma nova wallet XRPL temporária (salva no banco com chave privada segura) e configura subscriber (via xrpl.js ou rippled API) para monitorar depósitos.

2. **Envio de Endereço**: Retorna endereço da wallet temporária à tokenizadora via API. Ela deposita XRP ou RLUSD (stablecoin USD da Ripple, convertido internamente para colateral BRL se necessário).

3. **Confirmação de Depósito**: Subscriber detecta transação on-chain (via WebSocket ou polling). Valida amount e origem.

4. **Minting na XRPL**: Transfere colateral da wallet temporária para issuer admin. Emite token via Issued Currency, com trust line e clawback. Pula conversão Binance, usando o colateral direto.

5. **Transferência e Notificação**: Transfere token para carteira da tokenizadora. Dispara webhook com confirmação.

Timeout: 10 minutos para depósito; cancela se não ocorrer, liberando wallet.

## Fluxo de Saída ou Queima da Stablecoin (Burn/Redemption)

Este fluxo reverte o mint, permitindo resgate do colateral. Tokenizadora envia API POST para /redeem-stablecoin com: currency code (ex.: APBRL), valor (ex.: R$10.000), modo (Pix ou XRP/RLUSD) e confirmação de burn. Pré-requisito: Chave Pix ou wallet XRPL cadastrada no onboarding B2B.

1. **Requisição e Validação**: Backend valida JWT e saldo na trust line via XRPL API. Tokenizadora transfere tokens de volta para issuer (via Payment transaction, queimando supply).

2. **Clawback Parcial**: Issuer executa Clawback transaction para recuperar apenas o valor especificado, liberando colateral proporcional sem recriar o token inteiro. Isso é atômico e eficiente na XRPL.

3. **Conversão e Saída**:
   - **Via Pix**: Vende colateral (XRP) na Binance por BRL. Saca para conta Asas (monitorado por webhook). Gera Pix para chave cadastrada da tokenizadora. Notifica via webhook ao confirmar.
   - **Via On-Chain**: Transfere colateral diretamente como XRP ou RLUSD para wallet da tokenizadora. Mais rápido, sem intermediários.

4. **Finalização**: Atualiza banco, dispara webhook com status "resgatado". KYC/AML verificado para compliance.

Timeout: 10 minutos para burn inicial; cancela se falhar.

## Gerenciamento de Saldos e Colateral na XRPL

Saldos são gerenciados nativamente via Issued Currencies na XRPL, sem contratos inteligentes (não suportados). Cada stablecoin é um currency code único (ex.: APBRL para um cliente, XYZBRL para outro), emitido por uma wallet issuer central. Trust lines estabelecem conexões entre issuer e holders (tokenizadoras), trackando saldos individualmente por código – como um "mapa" on-chain auditável via API (ex.: getAccountLines). Colateral (XRP/RLUSD) é travado na issuer wallet, mantido 1:1 off-chain pelo backend (ex.: via reservas em Binance/Asas), mas auditoria é pública: consultas XRPL mostram supplies, holders e histórico. Features como Authorized Trust Lines restringem holders a contas aprovadas (para KYC), e Clawback permite recuperação parcial. Para múltiplos clientes (ex.: 30), cada código é isolado, evitando confusão – o ledger suporta milhares de trust lines por account. Backend sincroniza via subscribers para real-time updates.

## Pontos de Atenção

- **Segurança Técnica**: Exposição de chaves privadas (wallets XRPL) – usar HSM (Hardware Security Modules) para storage. Riscos de ataques a webhooks (ex.: replay attacks) – implementar autenticação HMAC e idempotência.

- **Falhas Operacionais**: Dependência de terceiros (Asas, Binance) – downtime pode bloquear fluxos; implementar retries e fallbacks. Volatilidade XRP durante conversões – usar oráculos para hedging ou buffers de taxa.

- **Compliance e Regulatório**: KYC/AML deve ser rigoroso; falhas podem levar a sanções. Clawback deve ser usado apenas para compliance, não arbitrariamente. Monitorar limites XRPL (ex.: taxas de transação, reserves).

- **Pontos de Falha**: Timeouts não gerenciados podem deixar operações pendentes; usar cron jobs para limpeza. Integrações on-chain: subscribers podem falhar em picos de rede – fallback para polling. Usuários errando depósitos (ex.: amount errado) – validar e reembolsar manualmente.

## Referências

-  Stablecoin Settings - XRPL: https://xrpl.org/docs/concepts/tokens/fungible-tokens/stablecoins/settings
-  Clawback - XRPL: https://xrpl.org/docs/references/protocol/transactions/types/clawback
-  Stablecoin Issuer - XRPL: https://xrpl.org/docs/use-cases/tokenization/stablecoin-issuer
-  Clawing Back Tokens - XRPL: https://xrpl.org/docs/concepts/tokens/fungible-tokens/clawing-back-tokens
-  Authorized Trust Lines - XRPL: https://xrpl.org/docs/concepts/tokens/fungible-tokens/authorized-trust-lines
-  Ripple USD (RLUSD) Stablecoin: https://ripple.com/solutions/stablecoin/
-  Stablecoins - XRPL: https://xrpl.org/docs/concepts/tokens/fungible-tokens/stablecoins
-  What Is the XRP Stablecoin RLUSD: https://blog.valr.com/blog/xrp-stablecoin-rlusd