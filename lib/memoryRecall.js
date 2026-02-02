import { verifyAnchorOnChain } from "./bsvExplorer.js";
import { decryptJson } from "./encryption.js";

export async function recallMemoryFromTx(txid) {
  const onChainData = await verifyAnchorOnChain(txid);

  if (!onChainData.anchorPayload) {
    throw new Error("No anchor payload found in OP_RETURN.");
  }

  let anchorPayload;
  try {
    anchorPayload = JSON.parse(onChainData.anchorPayload);
  } catch (e) {
    throw new Error("Failed to parse anchor payload from OP_RETURN.");
  }

  if (!anchorPayload.hash) {
    throw new Error("No hash found in anchor payload.");
  }

  return {
    txid,
    hash: anchorPayload.hash,
    protocol: anchorPayload.protocol,
    type: anchorPayload.type,
    issuer: anchorPayload.issuer,
    timestamp: anchorPayload.timestamp,
    blockHeight: onChainData.blockHeight,
    confirmations: onChainData.confirmations,
    blockTime: onChainData.blockTime,
    note: "To decrypt session data, you need the encrypted payload that was stored separately. Use GET /api/recall/:sessionId with local anchor receipt."
  };
}

export async function recallAndDecryptFromReceipt(receipt) {
  if (!receipt.encryptedPayload) {
    throw new Error("No encrypted payload in receipt.");
  }

  try {
    const decrypted = decryptJson(receipt.encryptedPayload);
    return {
      sessionData: decrypted,
      hash: receipt.hash,
      txid: receipt.txid,
      anchoredAt: receipt.anchoredAt
    };
  } catch (e) {
    throw new Error(`Failed to decrypt: ${e.message}`);
  }
}
