// 对 API Key 做 HMAC-SHA256：混入服务器密钥(pepper)，输出 64 位十六进制字符串存入 Token.hashed_key。
// 带 pepper 是为了即使 Token 表泄露，攻击者没有 pepper 也无法伪造合法哈希。
export const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const pepper = process.env.AUTH_SECRET ?? "";

  // 把 pepper 封装为 HMAC 专用密钥（这是 HMAC 区别于普通 SHA-256 的关键）
  const key = await crypto.subtle.importKey(
    "raw", //密钥的格式
    encoder.encode(pepper), //密钥本体
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // 用 pepper 对 token 做 HMAC 签名（带密钥的哈希）
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(token)); //sign() 产出的 32 字节裸二进制

  // 字节数组转 64 位十六进制字符串
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};
