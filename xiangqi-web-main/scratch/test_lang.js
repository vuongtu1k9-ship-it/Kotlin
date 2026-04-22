
function testDetection(hostname) {
  if (hostname === 'cotuong.xyz' || hostname === 'www.cotuong.xyz') {
    return 'vi';
  }
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  return 'default';
}

console.log('cotuong.xyz ->', testDetection('cotuong.xyz'));
console.log('en.cotuong.xyz ->', testDetection('en.cotuong.xyz'));
console.log('zh.cotuong.xyz ->', testDetection('zh.cotuong.xyz'));
