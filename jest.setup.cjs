/* jsdom does not expose TextEncoder / TextDecoder, which react-router needs at
   import time. Node has had both for years; this hands them to the jsdom
   global so importing the router in a test does not throw before the first
   assertion. Nothing else belongs in this file. */
const { TextDecoder, TextEncoder } = require('node:util');

globalThis.TextEncoder = globalThis.TextEncoder ?? TextEncoder;
globalThis.TextDecoder = globalThis.TextDecoder ?? TextDecoder;
