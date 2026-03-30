const yf = require('yahoo-finance2').default;
async function test() {
  try {
    const q1 = await yf.quote('^GSPC');
    console.log('^GSPC quote success');
  } catch(e) { console.error('^GSPC quote error', e.message); }
}
test();
