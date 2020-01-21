const addressJSON = require('./address.json');

const Migrations = artifacts.require('../contracts/Migrations.sol');
const InvoiceManager = artifacts.require('../contracts/InvoiceManager.sol');

module.exports = function (deployer, network, accounts) {
  const adminAddr = network === 'development' ? accounts[0] : addressJSON.admin;

  deployer.deploy(Migrations)
    .then(async migrationInstance => {
      const invoiceManager = await deployer.deploy(
        InvoiceManager,
        adminAddr
      );
    });
};
