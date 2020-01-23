const InvoiceStorage = artifacts.require('InvoiceStorage');
const InvoiceManager = artifacts.require('InvoiceManager');

const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Monkey Test InvoiceManager Contract', accounts => {

  function getRandomInt (max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  it('random testing', async () => {
    const manager = await InvoiceManager.deployed();
    const storage = await InvoiceStorage.deployed();
    await manager.approveInvoice(0, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    let numOfInvoices = 1;
    // for (var i = 0; i < 5; i++) {
    //   switch (getRandomInt(6)) {
    //     case 0:
    //       console.log('approve same invoice, same bank');
    //       await manager.approveInvoice(getRandomInt(numOfInvoices), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    //       break;
    //     case 1:
    //       console.log('approve same invoice, different bank');
    //       await manager.approveInvoice(numOfInvoices + 1, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    //       numOfInvoices++;
    //       break;
    //     case 2:
    //       console.log('finance same invoice, same bank');
    //       await manager.financeInvoice(getRandomInt(numOfInvoices), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    //       break;
    //     case 3:
    //       console.log('reverse same invoice, same bank');
    //       await manager.reverseInvoice(getRandomInt(numOfInvoices), [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
    //       break;
    //   }
    // }
    console.log('num of invoices ' + await storage.getNumOfInvoices());
    for (var j = 0; j < storage.getNumOfInvoices(); j++) {
      // console.log('Invoice ' + j + '\tBank: ' + await storage.getBankNo(j) + '\tStatus: ' + await storage.getStatus(j));
      console.log(2);
    }
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });

  // await expectRevert(manager.useCode(
  //   codeHashJSON.codeHashes[1],
  //   { from: accounts[0] }
  // ), 'only voting machine has access');
});
