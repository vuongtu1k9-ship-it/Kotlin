const b64 = "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDmALhfTwsWr3ZU";
const buf = Buffer.from(b64, 'base64');
console.log(buf.toString('hex'));
