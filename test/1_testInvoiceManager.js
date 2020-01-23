const InvoiceStorage = artifacts.require('InvoiceStorage');
const InvoiceManager = artifacts.require('InvoiceManager');

const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Test InvoiceManager Contract', accounts => {

  let numOfInvoices = 0;

  it('approve new invoice, no duplicates success', async () => {
    const manager = await InvoiceManager.deployed();
    const storage = await InvoiceStorage.deployed();
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await storage.getStatus(0), 1);
    assert.deepEqual(await storage.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    numOfInvoices++;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and same bank, no duplicates fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.equal(await storage.getStatus(0), 1);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await storage.getStatus(0), 1);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse non-existent invoice fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse existing non-approved invoice, no duplicates fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.equal(await storage.getStatus(0), 1);
    for (var i = 2; i <= 10; i++) {
      if (i !== 3) {
        await storage.setStatus(0, i);
        await manager.reverseInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
        assert.notEqual(await storage.getStatus(0), 3);
      }
    }
    await storage.setStatus(0, 1);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse existing approved invoice, no duplicates success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.equal(await storage.getStatus(0), 1);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await storage.getStatus(0), 3);
    assert.deepEqual(await storage.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
  });

  it('approve existing not reversed invoice, no duplicates fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    for (var i = 2; i <= 10; i++) {
      if (i !== 3) {
        await storage.setStatus(0, i);
        await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
        assert.notEqual(await storage.getStatus(0), 1);
      }
    }
    await storage.setStatus(0, 3);
    assert.deepEqual(await storage.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve existing reversed invoice, no duplicates success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.equal(await storage.getStatus(0), 3);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await storage.getStatus(0), 1);
    assert.deepEqual(await storage.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance non-existent invoice fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.financeInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance existing non-approved invoice, no duplicates fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.equal(await storage.getStatus(0), 1);
    for (var i = 3; i <= 10; i++) {
      await storage.setStatus(0, i);
      await manager.financeInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
      assert.notEqual(await storage.getStatus(0), 2);
    }
    await storage.setStatus(0, 1);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance existing approved invoice, no duplicates success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.financeInvoice(1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await storage.getStatus(0), 2);
    assert.deepEqual(await storage.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one wrong status duplicate fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')], 222);
    assert.equal(await storage.getStatus(1), 1);
    assert.deepEqual(await storage.getDataHash(1), [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')]);
    numOfInvoices++;
    for (var i = 4; i <= 10; i++) {
      await storage.setStatus(1, i);
      await manager.approveInvoice(2, [web3.utils.soliditySha3('second'), web3.utils.soliditySha3('wind')], 222);
    }
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one financed duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(2, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    assert.equal(await storage.getStatus(0), 6);
    assert.equal(await storage.getStatus(2), 5);
    assert.deepEqual(await storage.getDataHash(0), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    assert.deepEqual(await storage.getDataHash(2), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')]);
    numOfInvoices++;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one approved duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('third'), web3.utils.soliditySha3('bird')], 222);
    assert.equal(await storage.getStatus(3), 1);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('third'), web3.utils.soliditySha3('bird')], 222);
    assert.equal(await storage.getStatus(3), 4);
    assert.equal(await storage.getStatus(4), 4);
    numOfInvoices += 2;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, one reversed duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 1);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 3);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 8);
    assert.equal(await storage.getStatus(6), 1);
    numOfInvoices += 2;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve existing status 8 invoice, one approved duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.equal(await storage.getStatus(5), 8);
    assert.equal(await storage.getStatus(6), 1);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 4);
    assert.equal(await storage.getStatus(6), 4);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse approved invoice, one wrong status duplicate fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.equal(await storage.getStatus(5), 4);
    assert.equal(await storage.getStatus(6), 4);
    for (var i = 1; i <= 10; i++) {
      if(i !== 4 && i !== 6 && i !== 8) {
        await storage.setStatus(6, i);
        await manager.reverseInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
        assert.equal(await storage.getStatus(5), 4);
        assert.equal(await storage.getStatus(6), i);
      }
    }
    await storage.setStatus(6, 4);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance approved invoice, one wrong status duplicate fail', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.equal(await storage.getStatus(5), 4);
    assert.equal(await storage.getStatus(6), 4);
    for (var i = 1; i <= 10; i++) {
      if(i !== 4 && i !== 6 && i !== 8) {
        await storage.setStatus(6, i);
        await manager.financeInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
        assert.equal(await storage.getStatus(5), 4);
        assert.equal(await storage.getStatus(6), i);
      }
    }
    await storage.setStatus(6, 4);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse approved invoice, one status 4 duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.equal(await storage.getStatus(5), 4);
    assert.equal(await storage.getStatus(6), 4);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 8);
    assert.equal(await storage.getStatus(6), 1);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse approved invoice, one status 8 duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.equal(await storage.getStatus(5), 8);
    assert.equal(await storage.getStatus(6), 1);
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 3);
    assert.equal(await storage.getStatus(6), 3);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance approved invoice, one status 8 duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(2, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 8);
    assert.equal(await storage.getStatus(6), 1);
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    await manager.financeInvoice(2, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 9);
    assert.equal(await storage.getStatus(6), 2);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance approved invoice, one status 4 duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')], 222);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')], 222);
    await manager.financeInvoice(1, [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')], 222);
    assert.equal(await storage.getStatus(7), 6);
    assert.equal(await storage.getStatus(8), 5);
    assert.deepEqual(await storage.getDataHash(7), [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')]);
    assert.deepEqual(await storage.getDataHash(8), [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')]);
    numOfInvoices += 2;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse approved invoice, one status 6 duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(7), [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')]);
    assert.deepEqual(await storage.getDataHash(8), [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')]);
    assert.equal(await storage.getStatus(7), 6);
    assert.equal(await storage.getStatus(8), 5);
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')], 222);
    assert.equal(await storage.getStatus(7), 2);
    assert.equal(await storage.getStatus(8), 9);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance approved invoice, one status 6 duplicate success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(2, [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')], 222);
    assert.equal(await storage.getStatus(7), 6);
    assert.equal(await storage.getStatus(8), 5);
    assert.deepEqual(await storage.getDataHash(7), [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')]);
    assert.deepEqual(await storage.getDataHash(8), [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')]);
    await manager.financeInvoice(2, [web3.utils.soliditySha3('fifth'), web3.utils.soliditySha3('force')], 222);
    assert.equal(await storage.getStatus(7), 7);
    assert.equal(await storage.getStatus(8), 7);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, multiple duplicates status 6 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('sixth'), web3.utils.soliditySha3('sense')], 222);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('sixth'), web3.utils.soliditySha3('sense')], 222);
    await manager.financeInvoice(1, [web3.utils.soliditySha3('sixth'), web3.utils.soliditySha3('sense')], 222);
    assert.equal(await storage.getStatus(9), 6);
    assert.equal(await storage.getStatus(10), 5);
    await manager.approveInvoice(3, [web3.utils.soliditySha3('sixth'), web3.utils.soliditySha3('sense')], 222);
    assert.equal(await storage.getStatus(9), 6);
    assert.equal(await storage.getStatus(10), 5);
    assert.equal(await storage.getStatus(11), 5);
    assert.deepEqual(await storage.getDataHash(9), [web3.utils.soliditySha3('sixth'), web3.utils.soliditySha3('sense')]);
    assert.deepEqual(await storage.getDataHash(10), [web3.utils.soliditySha3('sixth'), web3.utils.soliditySha3('sense')]);
    assert.deepEqual(await storage.getDataHash(11), [web3.utils.soliditySha3('sixth'), web3.utils.soliditySha3('sense')]);
    numOfInvoices += 3;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, multiple duplicates status 2 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.equal(await storage.getStatus(5), 9);
    assert.equal(await storage.getStatus(6), 2);
    await manager.approveInvoice(3, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 9);
    assert.equal(await storage.getStatus(6), 6);
    assert.equal(await storage.getStatus(12), 5);
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(12), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    numOfInvoices++;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse same invoice and same bank, multiple duplicates status 6 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(5), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(6), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    assert.deepEqual(await storage.getDataHash(12), [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')]);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 5);
    assert.equal(await storage.getStatus(6), 6);
    assert.equal(await storage.getStatus(12), 5);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 9);
    assert.equal(await storage.getStatus(6), 6);
    assert.equal(await storage.getStatus(12), 5);
    await manager.reverseInvoice(3, [web3.utils.soliditySha3('fourth'), web3.utils.soliditySha3('amendment')], 222);
    assert.equal(await storage.getStatus(5), 9);
    assert.equal(await storage.getStatus(6), 2);
    assert.equal(await storage.getStatus(12), 9);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, multiple duplicates status 1 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 1);
    assert.equal(await storage.getStatus(14), 8);
    await manager.approveInvoice(3, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 4);
    assert.equal(await storage.getStatus(14), 8);
    assert.equal(await storage.getStatus(15), 4);
    assert.deepEqual(await storage.getDataHash(13), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(14), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(15), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    numOfInvoices += 3;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and same bank, multiple duplicates status 4 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(13), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(14), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(15), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.equal(await storage.getStatus(13), 4);
    assert.equal(await storage.getStatus(14), 8);
    assert.equal(await storage.getStatus(15), 4);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 4);
    assert.equal(await storage.getStatus(14), 4);
    assert.equal(await storage.getStatus(15), 4);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse same invoice and same bank, multiple duplicates status 4 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(13), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(14), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(15), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.equal(await storage.getStatus(13), 4);
    assert.equal(await storage.getStatus(14), 4);
    assert.equal(await storage.getStatus(15), 4);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 8);
    assert.equal(await storage.getStatus(14), 4);
    assert.equal(await storage.getStatus(15), 4);
    await manager.reverseInvoice(2, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 8);
    assert.equal(await storage.getStatus(14), 8);
    assert.equal(await storage.getStatus(15), 1);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('reverse same invoice and same bank, multiple duplicates status 8 ONLY success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(13), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(14), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(15), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.equal(await storage.getStatus(13), 8);
    assert.equal(await storage.getStatus(14), 8);
    assert.equal(await storage.getStatus(15), 1);
    await manager.reverseInvoice(3, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 3);
    assert.equal(await storage.getStatus(14), 3);
    assert.equal(await storage.getStatus(15), 3);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, multiple duplicates status 3 ONLY success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(13), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(14), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(15), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.equal(await storage.getStatus(13), 3);
    assert.equal(await storage.getStatus(14), 3);
    assert.equal(await storage.getStatus(15), 3);
    await manager.approveInvoice(1, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 1);
    assert.equal(await storage.getStatus(14), 8);
    assert.equal(await storage.getStatus(15), 8);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('approve same invoice and different bank, multiple duplicates status 8 ONLY success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')], 222);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')], 222);
    assert.equal(await storage.getStatus(16), 4);
    assert.equal(await storage.getStatus(17), 4);
    await manager.approveInvoice(3, [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')], 222);
    assert.equal(await storage.getStatus(16), 4);
    assert.equal(await storage.getStatus(17), 4);
    assert.equal(await storage.getStatus(18), 4);
    assert.deepEqual(await storage.getDataHash(16), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.deepEqual(await storage.getDataHash(17), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.deepEqual(await storage.getDataHash(18), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    numOfInvoices += 3;
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance same invoice and same bank, multiple duplicates status 4 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    await manager.approveInvoice(1, [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')], 222);
    await manager.approveInvoice(2, [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')], 222);
    await manager.approveInvoice(3, [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')], 222);
    assert.deepEqual(await storage.getDataHash(19), [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')]);
    assert.deepEqual(await storage.getDataHash(20), [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')]);
    assert.deepEqual(await storage.getDataHash(21), [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')]);
    assert.equal(await storage.getStatus(19), 4);
    assert.equal(await storage.getStatus(20), 4);
    assert.equal(await storage.getStatus(21), 4);
    await manager.reverseInvoice(1, [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')], 222);
    assert.equal(await storage.getStatus(19), 8);
    assert.equal(await storage.getStatus(20), 4);
    assert.equal(await storage.getStatus(21), 4);
    await manager.financeInvoice(2, [web3.utils.soliditySha3('ninth'), web3.utils.soliditySha3('cloud')], 222);
    assert.equal(await storage.getStatus(19), 9);
    assert.equal(await storage.getStatus(20), 6);
    assert.equal(await storage.getStatus(21), 5);
    numOfInvoices += 3;
    assert.deepEqual(await storage.getDataHash(16), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.deepEqual(await storage.getDataHash(17), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.deepEqual(await storage.getDataHash(18), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.equal(await storage.getStatus(16), 4);
    assert.equal(await storage.getStatus(17), 4);
    assert.equal(await storage.getStatus(18), 4);
    await manager.financeInvoice(1, [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')], 222);
    assert.equal(await storage.getStatus(16), 6);
    assert.equal(await storage.getStatus(17), 5);
    assert.equal(await storage.getStatus(18), 5);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance same invoice and same bank, multiple duplicates status 7 success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(16), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.deepEqual(await storage.getDataHash(17), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.deepEqual(await storage.getDataHash(18), [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')]);
    assert.equal(await storage.getStatus(16), 6);
    assert.equal(await storage.getStatus(17), 5);
    assert.equal(await storage.getStatus(18), 5);
    await manager.financeInvoice(2, [web3.utils.soliditySha3('eighth'), web3.utils.soliditySha3('gate')], 222);
    assert.equal(await storage.getStatus(16), 7);
    assert.equal(await storage.getStatus(17), 7);
    assert.equal(await storage.getStatus(18), 5);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  it('finance same invoice and same bank, multiple duplicates status 8 ONLY success', async () => {
    const storage = await InvoiceStorage.deployed();
    const manager = await InvoiceManager.deployed();
    assert.deepEqual(await storage.getDataHash(13), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(14), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.deepEqual(await storage.getDataHash(15), [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')]);
    assert.equal(await storage.getStatus(13), 1);
    assert.equal(await storage.getStatus(14), 8);
    assert.equal(await storage.getStatus(15), 8);
    await manager.financeInvoice(1, [web3.utils.soliditySha3('seventh'), web3.utils.soliditySha3('heaven')], 222);
    assert.equal(await storage.getStatus(13), 2);
    assert.equal(await storage.getStatus(14), 9);
    assert.equal(await storage.getStatus(15), 9);
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  // await expectRevert(manager.useCode(
  //   codeHashJSON.codeHashes[1],
  //   { from: accounts[0] }
  // ), 'only voting machine has access');
});
