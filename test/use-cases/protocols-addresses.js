const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Protocol addresses", function () {

  before(async function() {
    this.ProtocolsRegistry = await ethers.getContractFactory("StringsRegistry");
    this.AddressesRegistry = await ethers.getContractFactory("AddressesRegistry");
    this.ProtocolAddresses = await ethers.getContractFactory("ProtocolsAddresses");

    protocol1 = "AAVE";
    protocol2 = "UniSwap";
    protocol3 = "Compound";
    protocol4 = "SushiSwap";
    protocol5 = "ParaSwap";
  });

  beforeEach(async function () {
    [owner, account1, address1, address2, address3, address4] = await ethers.getSigners();

    this.protocolsRegistry = await this.ProtocolsRegistry.deploy(true);
    await this.protocolsRegistry.deployed();
    await this.protocolsRegistry.add(protocol1);
    await this.protocolsRegistry.add(protocol2);
    await this.protocolsRegistry.add(protocol3);

    this.addressesRegistry = await this.AddressesRegistry.deploy();
    await this.addressesRegistry.deployed();
    await this.addressesRegistry.add(address1.address);
    await this.addressesRegistry.add(address2.address);
    await this.addressesRegistry.add(address3.address);
    await this.addressesRegistry.add(address4.address);

    this.protocolAddresses = await this.ProtocolAddresses.deploy(this.addressesRegistry.address, this.protocolsRegistry.address);
    await this.protocolAddresses.deployed();

    // Allow relationContract to manage addressesRegistry and protocolsRegistry
    await this.addressesRegistry.allowAddress(this.protocolAddresses.relationContract());
    await this.protocolsRegistry.allowAddress(this.protocolAddresses.relationContract());
    await this.addressesRegistry.disallowAddress(owner.address);
    await this.protocolsRegistry.disallowAddress(owner.address);
  });

  describe("Expected use-cases", function () {
    it("Should have 0 links after deployment", async function() {
      expect((await this.protocolAddresses.protocolsAddressesCount()).toString()).to.equal('0');
    });
    
    it("Should correctly link protocols and addresses", async function() {
      expect(await this.protocolAddresses.owns(protocol1, address1.address)).to.be.false;
      await this.protocolAddresses.addAddress(address1.address, protocol1);

      expect((await this.protocolAddresses.protocolsAddressesCount()).toString()).to.equal('1');
      expect(await this.protocolAddresses.owns(protocol1, address1.address)).to.be.true;
      expect((await this.protocolAddresses.ownersCount(address1.address)).toString()).to.equal('1');
      expect((await this.protocolAddresses.addressesCount(protocol1)).toString()).to.equal('1');
      expect((await this.protocolAddresses.getOwnerProtocolById(address1.address, 0)).toString()).to.equal(protocol1);
      expect((await this.protocolAddresses.getAddressById(protocol1, 0)).toString()).to.equal(address1.address);

      expect(await this.protocolAddresses.owns(protocol1, address2.address)).to.be.false;
      await this.protocolAddresses.addAddress(address2.address, protocol1);

      expect((await this.protocolAddresses.protocolsAddressesCount()).toString()).to.equal('2');
      expect(await this.protocolAddresses.owns(protocol1, address2.address)).to.be.true;
      expect((await this.protocolAddresses.ownersCount(address2.address)).toString()).to.equal('1');
      expect((await this.protocolAddresses.addressesCount(protocol1)).toString()).to.equal('2');
      expect((await this.protocolAddresses.getOwnerProtocolById(address2.address, 0)).toString()).to.equal(protocol1);
      expect((await this.protocolAddresses.getAddressById(protocol1, 1)).toString()).to.equal(address2.address);

      await this.protocolAddresses.addAddress(address3.address, protocol2);

      expect((await this.protocolAddresses.protocolsAddressesCount()).toString()).to.equal('3');
      expect(await this.protocolAddresses.owns(protocol2, address3.address)).to.be.true;
      expect(await this.protocolAddresses.owns(protocol1, address3.address)).to.be.false;
      expect((await this.protocolAddresses.ownersCount(address3.address)).toString()).to.equal('1');
      expect((await this.protocolAddresses.addressesCount(protocol2)).toString()).to.equal('1');
      expect((await this.protocolAddresses.getOwnerProtocolById(address3.address, 0)).toString()).to.equal(protocol2);
      expect((await this.protocolAddresses.getAddressById(protocol2, 0)).toString()).to.equal(address3.address);

      await this.protocolAddresses.addAddress(address3.address, protocol1);

      expect((await this.protocolAddresses.protocolsAddressesCount()).toString()).to.equal('4');
      expect((await this.protocolAddresses.ownersCount(address3.address)).toString()).to.equal('2');
      
    });

    it("Should correctly unlink protocols and addresses", async function() {
      await this.protocolAddresses.addAddress(address1.address, protocol1);
      await this.protocolAddresses.addAddress(address2.address, protocol1);
      await this.protocolAddresses.addAddress(address3.address, protocol1);
      await this.protocolAddresses.addAddress(address2.address, protocol2);

      await this.protocolAddresses.removeAddress(address1.address, protocol1);
      await this.protocolAddresses.removeAddress(address2.address, protocol2);

      expect(await this.protocolAddresses.owns(protocol1, address1.address)).to.be.false;
      expect(await this.protocolAddresses.owns(protocol1, address2.address)).to.be.true;
      expect(await this.protocolAddresses.owns(protocol1, address3.address)).to.be.true;
      expect(await this.protocolAddresses.owns(protocol2, address2.address)).to.be.false;

      expect((await this.protocolAddresses.protocolsAddressesCount()).toString()).to.equal('2');

      expect((await this.protocolAddresses.ownersCount(address1.address)).toString()).to.equal('0');
      expect((await this.protocolAddresses.ownersCount(address2.address)).toString()).to.equal('1');
      expect((await this.protocolAddresses.ownersCount(address3.address)).toString()).to.equal('1');

      expect((await this.protocolAddresses.addressesCount(protocol1)).toString()).to.equal('2');
      expect((await this.protocolAddresses.addressesCount(protocol2)).toString()).to.equal('0');

      expect(this.protocolAddresses.getOwnerProtocolById(address1.address, 0)).to.be.revertedWith("index out of bounds");
      expect((await this.protocolAddresses.getOwnerProtocolById(address2.address, 0)).toString()).to.equal(protocol1);
      expect((await this.protocolAddresses.getOwnerProtocolById(address3.address, 0)).toString()).to.equal(protocol1);
      expect(this.protocolAddresses.getOwnerProtocolById(address2.address, 1)).to.be.revertedWith("index out of bounds");

      expect((await this.protocolAddresses.getAddressById(protocol1, 0)).toString()).to.equal(address3.address);
      expect((await this.protocolAddresses.getAddressById(protocol1, 1)).toString()).to.equal(address2.address);
      expect(this.protocolAddresses.getAddressById(protocol1, 2)).to.be.revertedWith("index out of bounds");
      expect(this.protocolAddresses.getAddressById(protocol2, 0)).to.be.revertedWith("index out of bounds");

      expect(await this.protocolAddresses.owns(protocol1, address1.address)).to.be.false;
    });
  });
});
