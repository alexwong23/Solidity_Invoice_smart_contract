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
    var index;
    for (var i = 0; i < 30; i++) {
      switch (getRandomInt(4)) {
        case 0:
          index = getRandomInt(numOfInvoices);
          console.log('\n----------\tAPPROVE existing bank ' + index + '\t----------\n');
          await manager.approveInvoice(index, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
          for (var j = 0; j < await storage.getNumOfInvoices(); j++) {
            console.log('Invoice ' + j + '\tBank: ' + await storage.getBankNo(j) + '\tStatus: ' + await storage.getStatus(j));
          }
          break;
        case 1:
          console.log('\n----------\tAPPROVE new bank\t----------\n');
          await manager.approveInvoice(numOfInvoices, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
          numOfInvoices++;
          for (var j = 0; j < await storage.getNumOfInvoices(); j++) {
            console.log('Invoice ' + j + '\tBank: ' + await storage.getBankNo(j) + '\tStatus: ' + await storage.getStatus(j));
          }
          break;
        case 2:
          index = getRandomInt(numOfInvoices);
          console.log('\n----------\tFINANCE existing bank ' + index + '\t----------\n');
          await manager.financeInvoice(index, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
          for (var j = 0; j < await storage.getNumOfInvoices(); j++) {
            console.log('Invoice ' + j + '\tBank: ' + await storage.getBankNo(j) + '\tStatus: ' + await storage.getStatus(j));
          }
          break;
        case 3:
          index = getRandomInt(numOfInvoices);
          console.log('\n----------\tREVERSE existing bank ' + index + '\t----------\n');
          await manager.reverseInvoice(index, [web3.utils.soliditySha3('hello'), web3.utils.soliditySha3('world')], 222);
          for (var j = 0; j < await storage.getNumOfInvoices(); j++) {
            console.log('Invoice ' + j + '\tBank: ' + await storage.getBankNo(j) + '\tStatus: ' + await storage.getStatus(j));
          }
          break;
      }
    }
    assert.equal((await storage.getNumOfInvoices()), numOfInvoices);
  });
});
