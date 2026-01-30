const { generateMnemonic, deriveEthAddress, deriveBtcAddress } = require('../src/createwallet')
const { ethers } = require('ethers')

test('generateMnemonic returns a 12-word mnemonic', () => {
  const m = generateMnemonic()
  expect(m.split(' ').length).toBe(12)
})

test('deriveEthAddress returns a valid ETH address', () => {
  const m = 'test test test test test test test test test test test ball' // deterministic mnemonic
  const addr = deriveEthAddress(m)
  expect(ethers.isAddress(addr)).toBe(true)
})

test('deriveBtcAddress returns a non-empty address', () => {
  const m = 'test test test test test test test test test test test ball'
  const addr = deriveBtcAddress(m, { network: 'testnet', index: 0 })
  expect(typeof addr).toBe('string')
  expect(addr.length).toBeGreaterThan(0)
})
