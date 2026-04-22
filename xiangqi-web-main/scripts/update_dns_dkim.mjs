import axios from 'axios';

const API_KEY = 'hmtapikeycode1';
const BASE_URL = 'http://ns3.hmt.asia:18081/api/v1/servers/localhost/zones/cotuong.xyz.';
const PUBLIC_IP = '1.52.137.69';
const DKIM_P = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAN4jfX0onkPzpwRruGRpLnqV29zClBVcI8iKy7Z3PcJ4eEGsfzKp0PIi8IWH25r10jUJ5DalLSGyP3TdIFVCTSGw9i8pQuc0RWsUl3vQTmIhumHRbL+nNVUskEXM2BcA1CSp216VF2aOaUz3scSY/EfCc++6/dFd3d8SmPbbv4QIDAQAB';

const rrsets = [
  {
    name: 'cotuong.xyz.',
    type: 'TXT',
    ttl: 3600,
    changetype: 'REPLACE',
    records: [
      { content: '"google-site-verification=-Spw6ZThiL5sCyKxBsdnbJC7JkRBZM8T12k3NExjjkg"', disabled: false },
      { content: '"tiktok-developers-site-verification=HH3wK4kiD18r5XxQHuNxwpTIUCD3I3uL"', disabled: false },
      { content: '"tiktok-developers-site-verification=DYeETEGtfQbIhqFZEivnmDMxujbnGdjT"', disabled: false },
      { content: '"facebook-domain-verification=bros7qcohqfe4tfc1znrdtq9nvmjt6"', disabled: false },
      { content: '"v=spf1 ip4:' + PUBLIC_IP + ' -all"', disabled: false }
    ]
  },
  {
    name: 'dkim._domainkey.cotuong.xyz.',
    type: 'TXT',
    ttl: 3600,
    changetype: 'REPLACE',
    records: [
      { content: '"v=DKIM1; p=' + DKIM_P + '"', disabled: false }
    ]
  },
  {
    name: 'mail.cotuong.xyz.',
    type: 'A',
    ttl: 3600,
    changetype: 'REPLACE',
    records: [
      { content: PUBLIC_IP, disabled: false }
    ]
  },
  {
    name: 'cotuong.xyz.',
    type: 'MX',
    ttl: 3600,
    changetype: 'REPLACE',
    records: [
      { content: '10 mail.cotuong.xyz.', disabled: false }
    ]
  }
];

async function updateDNS() {
  try {
    const response = await axios.patch(BASE_URL, { rrsets }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('DNS Update Success (DKIM added):', response.status);
  } catch (error) {
    console.error('DNS Update Error:', error.response?.data || error.message);
  }
}

updateDNS();
