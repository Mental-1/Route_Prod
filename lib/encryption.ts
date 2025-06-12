// Simple encryption utility for messages
export class MessageEncryption {
  private static encoder = new TextEncoder()
  private static decoder = new TextDecoder()

  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    )
  }

  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key)
    return btoa(String.fromCharCode(...new Uint8Array(exported)))
  }

  static async importKey(keyString: string): Promise<CryptoKey> {
    const keyData = new Uint8Array(
      atob(keyString)
        .split("")
        .map((char) => char.charCodeAt(0)),
    )
    return await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, true, ["encrypt", "decrypt"])
  }

  static async encrypt(message: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = this.encoder.encode(message)

    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoded,
    )

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
    }
  }

  static async decrypt(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
    const encryptedBytes = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0)),
    )
    const ivBytes = new Uint8Array(
      atob(iv)
        .split("")
        .map((char) => char.charCodeAt(0)),
    )

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes,
      },
      key,
      encryptedBytes,
    )

    return this.decoder.decode(decrypted)
  }
}
