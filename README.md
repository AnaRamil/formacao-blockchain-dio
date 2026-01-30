# Wallet Generator 🚀

**Carteira multi-chain (BTC, ETH)** com suporte a tokens favoritos, consulta de saldos e comandos CLI simples.

## ✨ Visão geral

Este projeto gera seeds/mnemonics, deriva endereços para **Bitcoin** e **Ethereum** e permite que o usuário registre `tokens favoritos` (ex.: ERC-20) para visualizar saldos sem sair da carteira.

> Usuário original: este projeto usou `testnet` para fins de formação (Binance - Blockchain Developer with Solidity 2025). Continue a testar em ambientes de teste antes de usar fundos reais.

## ✅ Recursos implementados

- Geração de mnemonic (seed).
- Derivação de endereços HD para **BTC** (P2PKH) e **ETH** (BIP-44).
- CLI simples com comandos para gerar carteiras, adicionar/listar favoritos e consultar saldos.
- Configuração local em `config.json` para salvar tokens favoritos.
- Testes básicos com `jest`.

## 💻 Requisitos

- Node.js (recomendado v16+)
- npm

## 🔧 Instalação

```bash
npm install
```

## 🚀 Uso básico (CLI)

- Gerar uma carteira (BTC por padrão):

```bash
npm start -- generate --chain btc --network testnet --index 0
```

- Gerar ETH:

```bash
npm start -- generate --chain eth --index 0
```

- Adicionar token favorito (ex.: ERC-20):

```bash
npm start -- add-favorite --chain eth --address 0x... --name USDT
```

- Listar favoritos:

```bash
npm start -- list-favorites
```

- Consultar saldos (usa provider padrão ou RPC fornecido):

```bash
npm start -- balances --chain eth --address <sua_address> --rpc <RPC_URL>
```

Para BTC em testnet/mainnet:

```bash
npm start -- balances --chain btc --address <sua_address> --network testnet
```

## 🔐 Segurança (leia com atenção)

- Nunca compartilhe sua mnemonic ou chaves privadas.
- Nunca comite sementes, chaves ou arquivos de configuração com credenciais para repositórios públicos.
- Teste sempre em `testnet` antes de migrar para `mainnet`.

## 🧪 Testes

```bash
npm test
```

## Próximos passos sugeridos

- Suporte de wallets para mais chains (BSC, Polygon, etc.).
- Integração com provedores RPC configuráveis via variáveis de ambiente.
- UI simples (desktop/web) para facilitar uso e visualização de tokens favoritos.

---

Se quiser, posso: adicionar suporte a tokens BEP-20/Polygon, criar um painel web minimal ou integrar com provedores RPC populares (Infura/Alchemy) de forma segura. 😄
