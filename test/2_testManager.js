const InvoiceManager = artifacts.require('InvoiceManager');

const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Test InvoiceManager Contract', accounts => {

  let numOfInvoices = 0;

  it('only admin get number of invoices', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal((await manager.getNumOfInvoices({ from: accounts[0] })), numOfInvoices);
    await expectRevert(manager.getNumOfInvoices({ from: accounts[1] }), 'only admin has access');
  });

  it('approve new invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 1);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    numOfInvoices++;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and same bank, no duplicates fail', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 1);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 1);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  // approve same invoice and same bank, not reversed, no duplicates fail

  // approve same invoice and same bank, reversed, no duplicates success

  it('reverse non-existent invoice fail', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse existing approved invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 1);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 3);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
  });

  it('approve existing reversed invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 3);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 1);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
  });

  it('finance non-existent invoice fail', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.financeInvoice(1, [web3.utils.soliditySha3('finance'), web3.utils.soliditySha3('this')], 222);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('finance existing approved invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')], 222);
    assert.equal(await manager.getStatus(1), 1);
    assert.deepEqual(await manager.getDataHash(1), [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')]);
    await manager.financeInvoice(1, [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')], 222);
    assert.equal(await manager.getStatus(1), 2);
    numOfInvoices++;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });



  it('approve same invoice and same bank, one duplicate fail', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 1);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 1);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });




  it('approve existing financed invoice, no duplicates fail', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
    assert.equal(await manager.getStatus(1), 2);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')], 222);
    assert.equal(await manager.getStatus(1), 2);
    assert.deepEqual(await manager.getDataHash(1), [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')]);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice, different bank, one approved duplicate', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
    assert.equal(await manager.getStatus(0), 1);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 4);
    assert.equal(await manager.getStatus(2), 4);
    assert.deepEqual(await manager.getDataHash(2), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    numOfInvoices++;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice, different bank, one financed duplicate', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
    assert.equal(await manager.getStatus(1), 2);
    assert.deepEqual(await manager.getDataHash(1), [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')]);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')], 222);
    assert.equal(await manager.getStatus(1), 6);
    assert.equal(await manager.getStatus(3), 5);
    assert.deepEqual(await manager.getDataHash(3), [web3.utils.soliditySha3('random'), web3.utils.soliditySha3('string')]);
    numOfInvoices++;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice, different bank, one reversed duplicate', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('JJ'), web3.utils.soliditySha3('Lin')], 222);
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('JJ'), web3.utils.soliditySha3('Lin')], 222);
    assert.deepEqual(await manager.getDataHash(4), [web3.utils.soliditySha3('JJ'), web3.utils.soliditySha3('Lin')]);
    assert.equal(await manager.getStatus(4), 3);
    await manager.approveInvoice(3, [web3.utils.soliditySha3('JJ'), web3.utils.soliditySha3('Lin')], 222);
    assert.equal(await manager.getStatus(5), 1);
    assert.equal(await manager.getStatus(4), 8);
    numOfInvoices += 2;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice, different bank, status 4 duplicates', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.setStatus(2, 1); // force a break
    await manager.approveInvoice(3, [web3.utils.soliditySha3('no'), web3.utils.soliditySha3('way')], 224);
    assert.equal(await manager.getStatus(4), 0);
    await manager.setStatus(2, 4);
    await manager.setStatus(4, 4);
  });

  it('approve same invoice, different bank, more than one approved duplicate', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(4, [web3.utils.soliditySha3('no'), web3.utils.soliditySha3('way')], 224);
    assert.equal(await manager.getStatus(2), 4);
    assert.equal(await manager.getStatus(3), 4);
    assert.equal(await manager.getStatus(4), 4);
    assert.equal(await manager.getStatus(5), 4);

    // await expectRevert(manager.useCode(
    //   codeHashJSON.codeHashes[1],
    //   { from: accounts[0] }
    // ), 'only voting machine has access');
  });
});
