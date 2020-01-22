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

  it('reverse non-existent invoice fail', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse existing non-approved invoice, no duplicates fail', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 1);
    for (var i = 2; i <= 10; i++) {
      if (i !== 3) {
        await manager.setStatus(0, i);
        await manager.reverseInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
        assert.notEqual(await manager.getStatus(0), 3);
      }
    }
    await manager.setStatus(0, 1);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });


  it('reverse existing approved invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 1);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 3);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
  });

  it('approve existing not reversed invoice, no duplicates fail', async () => {
    const manager = await InvoiceManager.deployed();
    for (var i = 2; i <= 10; i++) {
      if (i !== 3) {
        await manager.setStatus(0, i);
        await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
        assert.notEqual(await manager.getStatus(0), 1);
      }
    }
    await manager.setStatus(0, 3);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve existing reversed invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 3);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 1);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('finance non-existent invoice fail', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.financeInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('finance existing non-approved invoice, no duplicates fail', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(0), 1);
    for (var i = 3; i <= 10; i++) {
      await manager.setStatus(0, i);
      await manager.financeInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
      assert.notEqual(await manager.getStatus(0), 2);
    }
    await manager.setStatus(0, 1);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('finance existing approved invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.financeInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 2);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one wrong status duplicate fail', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')], 222);
    assert.equal(await manager.getStatus(1), 1);
    assert.deepEqual(await manager.getDataHash(1), [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')]);
    numOfInvoices++;
    for (var i = 4; i <= 10; i++) {
      await manager.setStatus(1, i);
      await manager.approveInvoice(2, [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')], 222);
    }
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one financed duplicate success', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await manager.getStatus(0), 6);
    assert.equal(await manager.getStatus(2), 5);
    assert.deepEqual(await manager.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.deepEqual(await manager.getDataHash(2), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    numOfInvoices++;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one approved duplicate success', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('third'), web3.utils.soliditySha3('bird')], 222);
    assert.equal(await manager.getStatus(3), 1);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('third'), web3.utils.soliditySha3('bird')], 222);
    assert.equal(await manager.getStatus(3), 4);
    assert.equal(await manager.getStatus(4), 4);
    numOfInvoices += 2;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one reversed duplicate success', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await manager.getStatus(5), 1);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await manager.getStatus(5), 3);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await manager.getStatus(5), 8);
    assert.equal(await manager.getStatus(6), 1);
    numOfInvoices += 2;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve existing status 8 invoice, one approved duplicate success', async () => {
    const manager = await InvoiceManager.deployed();
    assert.equal(await manager.getStatus(5), 8);
    assert.equal(await manager.getStatus(6), 1);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await manager.getStatus(5), 4);
    assert.equal(await manager.getStatus(6), 4);
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, multiple status 4 duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(3, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await manager.getStatus(5), 4);
    assert.equal(await manager.getStatus(6), 4);
    assert.equal(await manager.getStatus(7), 4);
    assert.deepEqual(await manager.getDataHash(7), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    numOfInvoices++;
    assert.equal((await manager.getNumOfInvoices()), numOfInvoices);

    // await expectRevert(manager.useCode(
    //   codeHashJSON.codeHashes[1],
    //   { from: accounts[0] }
    // ), 'only voting machine has access');
  });

  // it('reverse approved invoice, one wrong status duplicate fail', async () => {
  //   const manager = await InvoiceManager.deployed();
  //   await manager.approveInvoice(1, [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')], 222);
  //   assert.equal(await manager.getStatus(1), 1);
  //   assert.deepEqual(await manager.getDataHash(1), [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')]);
  //   numOfInvoices++;
  //   for (var i = 4; i <= 10; i++) {
  //     await manager.setStatus(1, i);
  //     await manager.approveInvoice(2, [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')], 222);
  //   }
  //   assert.equal((await manager.getNumOfInvoices()), numOfInvoices);
  // });
});
