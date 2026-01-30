const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const bip32 = require('bip32')
const bip39 = require('bip39')
const bitcoin = require('bitcoinjs-lib')
const { ethers } = require('ethers')
const axios = require('axios')

// Config file
const CONFIG_PATH = path.resolve(__dirname, '..', 'config.json')

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch (e) {
    const defaultConfig = {
      favorites: { eth: [], btc: [] },
      defaultNetworks: { eth: 'mainnet', btc: 'testnet' },
      rpc: { eth_mainnet: '', eth_testnet: '' }
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2))
    return defaultConfig
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2))
}

function generateMnemonic(words = 12) {
  return bip39.generateMnemonic()
}

function deriveBtcAddress(mnemonic, opts = {}) {
  const networkName = opts.network || 'testnet'
  const index = Number(opts.index || 0)
  const net = networkName === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
  const coinType = networkName === 'mainnet' ? 0 : 1
  const derivationPath = `m/49'/${coinType}'/0'/0/${index}`
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed, net)
  const account = root.derivePath(derivationPath)
  const node = account
  const { address } = bitcoin.payments.p2pkh({ pubkey: node.publicKey, network: net })
  return address
}

const { hdkey } = require('ethereumjs-wallet')

function deriveEthAddress(mnemonic, index = 0) {
  const hdPath = `m/44'/60'/0'/0/${index}`
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const hdwallet = hdkey.fromMasterSeed(seed)
  const node = hdwallet.derivePath(hdPath)
  const wallet = node.getWallet()
  const address = `0x${wallet.getAddress().toString('hex')}`
  return ethers.getAddress(address)
}

async function fetchEthBalances(address, rpcUrl) {
  const provider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : ethers.getDefaultProvider()
  const balance = await provider.getBalance(address)
  return { native: ethers.formatEther(balance) }
}

async function fetchEthTokenBalance(tokenAddress, address, provider) {
  const abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ]
  const contract = new ethers.Contract(tokenAddress, abi, provider)
  const [balanceRaw, decimals, symbol] = await Promise.all([
    contract.balanceOf(address),
    contract.decimals().catch(() => 18),
    contract.symbol().catch(() => 'TKN')
  ])
  const adjusted = Number(ethers.formatUnits(balanceRaw, decimals))
  return { symbol, balance: adjusted }
}

async function fetchBtcBalance(address, networkName = 'testnet') {
  try {
    const base = networkName === 'mainnet' ? 'https://blockstream.info/api' : 'https://blockstream.info/testnet/api'
    const res = await axios.get(`${base}/address/${address}/balance`)
    const sat = Number(res.data)
    return { btc: (sat / 1e8).toString() }
  } catch (e) {
    return { error: e.message }
  }
}

function addFavorite(chain, tokenAddress, name) {
  const cfg = loadConfig()
  cfg.favorites[chain] = cfg.favorites[chain] || []
  cfg.favorites[chain].push({ address: tokenAddress, name })
  saveConfig(cfg)
}

function listFavorites() {
  const cfg = loadConfig()
  return cfg.favorites
}

// CLI
const program = new Command()
program.name('wallet').description('Gerador de carteira e visualizador multi-chain').version('1.1.0')

program
  .command('generate')
  .description('Gerar endereço e seed para BTC/ETH')
  .option('--chain <chain>', 'btc|eth', 'btc')
  .option('--network <network>', 'mainnet|testnet', 'testnet')
  .option('--index <n>', 'índice da derivação', '0')
  .action(async (opts) => {
    const mnemonic = generateMnemonic()
    console.log('Seed (não compartilhe):', mnemonic)
    if (opts.chain === 'btc') {
      const addr = deriveBtcAddress(mnemonic, { network: opts.network, index: opts.index })
      console.log(`BTC ${opts.network} address:`, addr)
    } else if (opts.chain === 'eth') {
      const addr = deriveEthAddress(mnemonic, Number(opts.index))
      console.log(`ETH address:`, addr)
    }
  })

program
  .command('add-favorite')
  .description('Adicionar token favorito (ex.: ERC-20)')
  .requiredOption('--chain <chain>', 'eth|btc')
  .requiredOption('--address <address>', 'endereço do token (para ETH)')
  .option('--name <name>', 'nome amigável', 'token')
  .action((opts) => {
    addFavorite(opts.chain, opts.address, opts.name)
    console.log('Adicionado nos favoritos:', opts)
  })

program
  .command('list-favorites')
  .description('Listar tokens favoritos')
  .action(() => {
    console.log(listFavorites())
  })

program
  .command('balances')
  .description('Mostrar saldo nativo e tokens favoritos')
  .requiredOption('--chain <chain>', 'eth|btc')
  .requiredOption('--address <address>', 'endereço da carteira')
  .option('--rpc <rpc>', 'RPC para ETH (opcional)')
  .option('--network <network>', 'mainnet|testnet', 'mainnet')
  .action(async (opts) => {
    if (opts.chain === 'eth') {
      const provider = opts.rpc ? new ethers.JsonRpcProvider(opts.rpc) : ethers.getDefaultProvider(opts.network)
      const native = await provider.getBalance(opts.address)
      console.log('ETH balance:', ethers.formatEther(native))
      const cfg = loadConfig()
      const favs = cfg.favorites.eth || []
      for (const t of favs) {
        const tokenInfo = await fetchEthTokenBalance(t.address, opts.address, provider)
        console.log(`${t.name} (${t.address}):`, tokenInfo.balance, tokenInfo.symbol)
      }
    } else if (opts.chain === 'btc') {
      const bal = await fetchBtcBalance(opts.address, opts.network)
      console.log('BTC balance:', bal.btc ?? bal.error)
    }
  })

if (require.main === module) {
  program.parse(process.argv)
}

module.exports = { generateMnemonic, deriveBtcAddress, deriveEthAddress, addFavorite, listFavorites, fetchEthTokenBalance }
