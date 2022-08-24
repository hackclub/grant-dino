import * as jose from "jose";

export async function sign(data) {
  return await new jose.SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(Buffer.from(process.env.JWT_SECRET, "hex"));
}

export async function verify(jwt) {
  const { payload } = await jose.jwtVerify(
    jwt,
    Buffer.from(process.env.JWT_SECRET, "hex")
  );

  return payload;
}
