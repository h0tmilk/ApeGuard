const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AddressesToStringsLink contract", function () {

  before(async function() {
    this.AddressesRegistryContract = await ethers.getContractFactory("AddressesRegistry");
    this.StringsRegistryContract = await ethers.getContractFactory("StringsRegistry");
    this.AddressesToStringsLinkContract = await ethers.getContractFactory("AddressesToStringsLink");
    [owner, address1, address2, address3, address4, address5] = await ethers.getSigners();
    string1 = "AAVE";
    string2 = "UniSwap";
    string3 = "Compound";
    string4 = "SushiSwap";
    string5 = "ParaSwap";
  });

  beforeEach(async function () {
    this.addressesRegistry = await this.AddressesRegistryContract.deploy();
    await this.addressesRegistry.deployed();

    this.addressesRegistry.add(address1);
    this.addressesRegistry.add(address2);
    this.addressesRegistry.add(address3);
 
    this.stringsRegistry = await this.StringsRegistryContract.deploy(true);
    await this.stringsRegistry.deployed();

    this.stringsRegistry.add(string1);
    this.stringsRegistry.add(string2);
    this.stringsRegistry.add(string3);

    this.addressesToStringsLink = await this.AddressesToStringsLinkContract.deploy(this.addressesRegistry.address, this.stringsRegistry.address);
    await this.addressesToStringsLink.deployed();
    this.addressesRegistry.transferOwnership(this.addressesToStringsLink.address);
    this.stringsRegistry.transferOwnership(this.addressesToStringsLink.address);
  });

  describe("Expected use-cases", function () {
    it("Should have 0 links after deployment", async function() {
      expect((await this.addressesToStringsLink.getLinksTotalCount()).toString()).to.equal('0');
    });

    it("Should have the good amount of links after adding / removing addresses", async function() {
      await this.addressesToStringsLink.linkAddress(address1.address, string1);
      await this.addressesToStringsLink.linkAddress(address1.address, string2);

      expect((await this.addressesToStringsLink.getLinksTotalCount()).toString()).to.equal('2');

      await this.addressesToStringsLink.unlinkAddress(address1.address, string2);

      expect((await this.addressesToStringsLink.getLinksTotalCount()).toString()).to.equal('1');

      await this.addressesToStringsLink.linkAddress(address3.address, string3);

      expect((await this.addressesToStringsLink.getLinksTotalCount()).toString()).to.equal('2');
    });

    it("Should link 3 addresses to different strings", async function() {
      expect(await this.addressesToStringsLink.isLinked(address1.address, string1)).to.be.false;
      expect(await this.addressesToStringsLink.isLinked(address1.address, string2)).to.be.false;
      expect(await this.addressesToStringsLink.isLinked(address2.address, string2)).to.be.false;
      expect(await this.addressesToStringsLink.isLinked(address3.address, string3)).to.be.false;

      await this.addressesToStringsLink.linkAddress(address1.address, string1);
      await this.addressesToStringsLink.linkAddress(address1.address, string2);
      await this.addressesToStringsLink.linkAddress(address2.address, string2);
      await this.addressesToStringsLink.linkAddress(address3.address, string3);

      expect(await this.addressesToStringsLink.isLinked(address1.address, string1)).to.be.true;
      expect(await this.addressesToStringsLink.isLinked(address1.address, string2)).to.be.true;
      expect(await this.addressesToStringsLink.isLinked(address2.address, string2)).to.be.true;
      expect(await this.addressesToStringsLink.isLinked(address3.address, string3)).to.be.true;
    });

    it("Should go through string's linked addresses", async function() {
      await this.addressesToStringsLink.linkAddress(address1.address, string1);
      await this.addressesToStringsLink.linkAddress(address1.address, string2);
      await this.addressesToStringsLink.linkAddress(address2.address, string1);
      await this.addressesToStringsLink.linkAddress(address3.address, string1);

      numberAddressesP1 = await this.addressesToStringsLink.getLinkedAddressesCount(string1);
      expect(numberAddressesP1.toString()).to.equal('3');

      numberAddressesP2 = await this.addressesToStringsLink.getLinkedAddressesCount(string2);
      expect(numberAddressesP2.toString()).to.equal('1');
      
      expect(await this.addressesToStringsLink.getLinkedAddressById(string1, 0)).to.equal(address1.address);
      expect(await this.addressesToStringsLink.getLinkedAddressById(string1, 1)).to.equal(address2.address);
      expect(await this.addressesToStringsLink.getLinkedAddressById(string1, 2)).to.equal(address3.address);

      await this.addressesToStringsLink.unlinkAddress(address1.address, string1);

      expect(await this.addressesToStringsLink.getLinkedAddressById(string1, 0)).to.equal(address3.address);
      expect(await this.addressesToStringsLink.getLinkedAddressById(string1, 1)).to.equal(address2.address);
    });

    it("Should go through address's linked strings", async function() {
      await this.addressesToStringsLink.linkAddress(address1.address, string1);
      await this.addressesToStringsLink.linkAddress(address1.address, string2);
      await this.addressesToStringsLink.linkAddress(address1.address, string3);
      await this.addressesToStringsLink.linkAddress(address2.address, string1);

      numberStrings = await this.addressesToStringsLink.getLinkedStringsCount(address1.address);
      expect(numberStrings.toString()).to.equal('3');

      numberStrings = await this.addressesToStringsLink.getLinkedStringsCount(address2.address);
      expect(numberStrings.toString()).to.equal('1');
      
      expect(await this.addressesToStringsLink.getLinkedStringById(address1.address, 0)).to.equal(string1);
      expect(await this.addressesToStringsLink.getLinkedStringById(address1.address, 1)).to.equal(string2);
      expect(await this.addressesToStringsLink.getLinkedStringById(address1.address, 2)).to.equal(string3);
      expect(await this.addressesToStringsLink.getLinkedStringById(address2.address, 0)).to.equal(string1);

      await this.addressesToStringsLink.unlinkAddress(address1.address, string1);

      expect(await this.addressesToStringsLink.getLinkedStringById(address1.address, 0)).to.equal(string3);
      expect(await this.addressesToStringsLink.getLinkedStringById(address2.address, 0)).to.equal(string1);
    });

    it("Should revert if string doesn't exist", async function() {
      await expect(
        this.addressesToStringsLink.linkAddress(address1.address, "foo")
      ).to.be.revertedWith("string not registered");
    });

    it("Should revert if address is already linked for a given string", async function() {
      await this.addressesToStringsLink.linkAddress(address1.address, string1);
      await expect(
        this.addressesToStringsLink.linkAddress(address1.address, string1)
      ).to.be.revertedWith("address is already linked");
    });

    it("Should create a new entry in AddressesRegistry while linking non-existent address", async function() {
      expect(await this.addressesRegistry.contains(address5.address)).to.be.false;
      await this.addressesToStringsLink.linkAddress(address5.address, string1);
      expect(await this.addressesRegistry.contains(address5.address)).to.be.true;
    });

    it("Should remove entry in AddressesRegistry while unlinking last string of address", async function() {
      await this.addressesToStringsLink.linkAddress(address1.address, string1);
      expect(await this.addressesRegistry.contains(address1.address)).to.be.true;
      await this.addressesToStringsLink.unlinkAddress(address1.address, string1);
      expect(await this.addressesRegistry.contains(address1.address)).to.be.false;
    });

  });

  describe("Authorizations", function () {
    it("Should link only owner to add address", async function() {
      await expect(
        this.addressesToStringsLink.connect(address1).linkAddress(address1.address, string1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should link only owner to delete address", async function() {
      await this.addressesToStringsLink.linkAddress(address1.address, string1)
      await expect(
        this.addressesToStringsLink.connect(address1).unlinkAddress(address1.address, string1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
