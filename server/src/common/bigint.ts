// `JSON.stringify` throws on BigInt. File sizes therefore reach the client as
// strings; parse them with `Number()` on the way in.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (
  this: bigint,
): string {
  return this.toString();
};
